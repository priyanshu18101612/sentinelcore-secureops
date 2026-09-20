package com.sentinelcore.sentinelcore_backend.service;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.ServerSocket;

import static org.junit.jupiter.api.Assertions.*;

class PrometheusClientServiceTest {

    private PrometheusClientService service;
    private ServerSocket localTestServer;
    private int localPort;

    @BeforeEach
    void setUp() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        service = new PrometheusClientService(objectMapper);
        // Point prometheus and blackbox to non-existent ports to test pure fallback behavior
        service.setPrometheusBaseUrl("http://localhost:59999");
        service.setBlackboxExporterBaseUrl("http://localhost:59999");
        service.setProbeTimeoutMs(300);

        // Open ephemeral server socket to act as real reachable target
        localTestServer = new ServerSocket(0);
        localPort = localTestServer.getLocalPort();
    }

    @AfterEach
    void tearDown() throws IOException {
        if (localTestServer != null && !localTestServer.isClosed()) {
            localTestServer.close();
        }
    }

    @Test
    void testFallbackSocketLatencyMeasuresGenuineLatency() {
        service.setProbeTarget("127.0.0.1:" + localPort);

        Double latency = service.getFallbackSocketLatencyMs();

        assertNotNull(latency, "Latency must not be null when probe target is reachable");
        assertTrue(latency >= 0.0, "Latency must be non-negative");
        assertTrue(latency < 500.0, "Loopback TCP connect latency should be fast (< 500 ms)");
    }

    @Test
    void testFallbackSocketLatencyWhenUnreachableTargetReturnsNullRatherThanFabricating() {
        // Use a test-net reserved IP that will immediately fail or time out
        service.setProbeTarget("192.0.2.1:53");
        service.setProbeTimeoutMs(50);

        Double latency = service.getFallbackSocketLatencyMs();

        // Must report unavailable (null) rather than fabricating a dummy value
        assertNull(latency, "Unreachable probe target must return null, never a fabricated number");
    }

    @Test
    void testFallbackSocketLatencyWithInvalidTargetReturnsNull() {
        service.setProbeTarget(null);
        assertNull(service.getFallbackSocketLatencyMs());

        service.setProbeTarget("");
        assertNull(service.getFallbackSocketLatencyMs());
    }

    @Test
    void testNetworkPacketLossWithReachableSocketReturnsZero() {
        service.setProbeTarget("127.0.0.1:" + localPort);

        Double loss = service.getNetworkPacketLoss();

        assertNotNull(loss);
        assertEquals(0.0, loss, 0.001);
    }

    @Test
    void testNetworkPacketLossWithUnreachableSocketReturnsHundred() {
        service.setProbeTarget("192.0.2.1:53");
        service.setProbeTimeoutMs(50);

        Double loss = service.getNetworkPacketLoss();

        assertNotNull(loss);
        assertEquals(100.0, loss, 0.001);
    }

    @Test
    void testGetTelemetryStatusIncludesNetworkLatencyFields() {
        service.setProbeTarget("127.0.0.1:" + localPort);

        var status = service.getTelemetryStatus();

        assertNotNull(status);
        assertFalse(status.isBlackboxExporterConnected());
        assertTrue(status.isFallback());
        assertNotNull(status.getCurrentNetworkLatency());
        assertNotNull(status.getCurrentNetworkPacketLoss());
    }
}
