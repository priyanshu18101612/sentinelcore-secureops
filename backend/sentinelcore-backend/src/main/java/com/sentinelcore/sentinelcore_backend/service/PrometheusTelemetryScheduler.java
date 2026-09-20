package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Asset;
import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import com.sentinelcore.sentinelcore_backend.model.NetworkMetric;
import com.sentinelcore.sentinelcore_backend.repository.AssetRepository;
import com.sentinelcore.sentinelcore_backend.repository.InfrastructureMetricRepository;
import com.sentinelcore.sentinelcore_backend.repository.NetworkMetricRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class PrometheusTelemetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PrometheusTelemetryScheduler.class);

    private final PrometheusClientService prometheusClientService;
    private final InfrastructureMetricRepository infrastructureMetricRepository;
    private final NetworkMetricRepository networkMetricRepository;
    private final AssetRepository assetRepository;
    private final AlertService alertService;

    @Value("${telemetry.host.asset-name:LOCAL-WORKSTATION-HOST}")
    private String hostAssetName;

    @Value("${telemetry.retention.max-records:300}")
    private int maxRetentionRecords;

    private Long resolvedHostAssetId = null;

    public PrometheusTelemetryScheduler(
            PrometheusClientService prometheusClientService,
            InfrastructureMetricRepository infrastructureMetricRepository,
            NetworkMetricRepository networkMetricRepository,
            AssetRepository assetRepository,
            AlertService alertService) {
        this.prometheusClientService = prometheusClientService;
        this.infrastructureMetricRepository = infrastructureMetricRepository;
        this.networkMetricRepository = networkMetricRepository;
        this.assetRepository = assetRepository;
        this.alertService = alertService;
    }

    @Scheduled(fixedRateString = "${telemetry.scrape-interval-ms:15000}")
    public void collectTelemetry() {
        try {
            Long assetId = getOrCreateHostAssetId();

            boolean usingFallback = prometheusClientService.isUsingFallback();
            if (usingFallback) {
                log.info("Collecting host telemetry via fallback OS MXBean (Prometheus offline)");
            }

            double cpu = prometheusClientService.getCpuUsage();
            double memory = prometheusClientService.getMemoryUsage();
            double disk = prometheusClientService.getDiskUsage();
            double netIn = prometheusClientService.getNetworkInRate();
            double netOut = prometheusClientService.getNetworkOutRate();
            LocalDateTime now = LocalDateTime.now();

            InfrastructureMetric infraMetric = new InfrastructureMetric(
                    null,
                    assetId,
                    cpu,
                    memory,
                    disk,
                    netIn,
                    netOut,
                    now
            );
            InfrastructureMetric savedInfra = infrastructureMetricRepository.save(infraMetric);

            Double latency = prometheusClientService.getNetworkLatencyMs();
            Double packetLoss = prometheusClientService.getNetworkPacketLoss();

            String status = "UP";
            if (packetLoss != null && packetLoss >= 100.0) {
                status = "DOWN";
            } else if (latency != null && latency >= 50.0) {
                status = "DEGRADED";
            } else if (latency == null) {
                status = "UNKNOWN";
            }

            String sourceLabel = usingFallback ? "FALLBACK - Host OS" : "Prometheus";
            NetworkMetric networkMetric = new NetworkMetric(
                    null,
                    "Host Loopback & Interface (" + sourceLabel + ")",
                    status,
                    netIn,
                    netOut,
                    latency,
                    packetLoss != null ? packetLoss : 0.0,
                    now.toString()
            );
            networkMetricRepository.save(networkMetric);

            // Anomaly detection automatically triggered on real host metrics with deduplication
            try {
                alertService.detectAnomalies(List.of(savedInfra));
                if (latency != null) {
                    alertService.detectNetworkAnomalies(assetId, latency, packetLoss != null ? packetLoss : 0.0);
                }
            } catch (Exception alertEx) {
                log.warn("Anomaly detection warning: {}", alertEx.getMessage());
            }

            // Prune old telemetry metrics chronologically to keep PostgreSQL performant (never touching M2-M4 data)
            pruneHistoricalMetrics(assetId);

        } catch (Exception e) {
            log.error("Error during real telemetry collection cycle: {}", e.getMessage());
        }
    }

    private Long getOrCreateHostAssetId() {
        if (resolvedHostAssetId != null && assetRepository.existsById(resolvedHostAssetId)) {
            return resolvedHostAssetId;
        }

        // Look up by stable identifier: LOCAL-WORKSTATION-HOST
        Asset hostAsset = assetRepository.findByName(hostAssetName).orElseGet(() -> {
            log.info("Creating local host workstation asset with stable identifier: {}", hostAssetName);
            Asset newAsset = new Asset();
            newAsset.setName(hostAssetName);
            newAsset.setType("Host Workstation");
            newAsset.setIpAddress("127.0.0.1");
            newAsset.setLocation("Local Host - " + System.getProperty("os.name"));
            newAsset.setCreatedAt(LocalDateTime.now());
            newAsset.setUpdatedAt(LocalDateTime.now());
            newAsset.setStatus("HEALTHY");
            return assetRepository.save(newAsset);
        });

        resolvedHostAssetId = hostAsset.getId();
        return resolvedHostAssetId;
    }

    private void pruneHistoricalMetrics(Long assetId) {
        try {
            // Limited exclusively to infrastructure_metrics for this asset
            List<InfrastructureMetric> metrics = new ArrayList<>(infrastructureMetricRepository.findByAssetId(assetId));
            if (metrics.size() > maxRetentionRecords) {
                metrics.sort(Comparator.comparing(InfrastructureMetric::getTimestamp));
                int toRemoveCount = metrics.size() - maxRetentionRecords;
                List<InfrastructureMetric> toRemove = metrics.subList(0, toRemoveCount);
                infrastructureMetricRepository.deleteAll(toRemove);
                log.debug("Pruned {} historical telemetry metrics for asset {}", toRemoveCount, assetId);
            }

            // Keep network metrics bounded
            long netCount = networkMetricRepository.count();
            if (netCount > maxRetentionRecords) {
                List<NetworkMetric> allNet = new ArrayList<>(networkMetricRepository.findAll());
                int netToRemove = (int) (netCount - maxRetentionRecords);
                if (netToRemove > 0 && netToRemove <= allNet.size()) {
                    networkMetricRepository.deleteAll(allNet.subList(0, netToRemove));
                }
            }
        } catch (Exception e) {
            log.warn("Telemetry retention pruning notice: {}", e.getMessage());
        }
    }
}
