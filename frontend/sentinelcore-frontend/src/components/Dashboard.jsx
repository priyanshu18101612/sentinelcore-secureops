import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

import {
  getAssets,
  getMetrics,
  getHealth,
  getAlerts,
  getNetworkMetrics,
} from "../services/api"

function Dashboard() {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [assets, setAssets] = useState([])
  const [infrastructureMetrics, setInfrastructureMetrics] = useState([])
  const [alerts, setAlerts] = useState([])
  const [networkMetrics, setNetworkMetrics] = useState([])

  const [assetsLoading, setAssetsLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [networkLoading, setNetworkLoading] = useState(true)

  // --------------------------------------------------
  // LOAD ASSETS + INFRASTRUCTURE METRICS + HEALTH
  // --------------------------------------------------

  useEffect(() => {
    async function loadInfrastructureData() {
      try {
        const assetData = await getAssets()

        if (!Array.isArray(assetData)) {
          setAssets([])
          setInfrastructureMetrics([])
          return
        }

        setAssets(assetData)

        // Get latest metrics and health for every asset
        const assetDetails = await Promise.all(
          assetData.map(async (asset) => {
            try {
              const [metrics, health] = await Promise.all([
                getMetrics(asset.id),
                getHealth(asset.id),
              ])

              const latestMetric =
                Array.isArray(metrics) && metrics.length > 0
                  ? metrics[metrics.length - 1]
                  : null

              return {
                asset,
                metric: latestMetric,
                health,
              }
            } catch (error) {
              console.error(
                `Failed to load data for asset ${asset.id}:`,
                error
              )

              return {
                asset,
                metric: null,
                health: null,
              }
            }
          })
        )

        const metrics = assetDetails
          .map((item) => item.metric)
          .filter(Boolean)

        setInfrastructureMetrics(metrics)

        // Update asset health using backend health API
        const updatedAssets = assetDetails.map((item) => ({
          ...item.asset,
          status:
            item.health?.status ||
            item.asset.status ||
            "UNKNOWN",
          checkedAt: item.health?.checkedAt || null,
        }))

        setAssets(updatedAssets)
      } catch (error) {
        console.error(
          "Failed to fetch infrastructure data:",
          error
        )

        setAssets([])
        setInfrastructureMetrics([])
      } finally {
        setAssetsLoading(false)
        setMetricsLoading(false)
      }
    }

    loadInfrastructureData()
  }, [])

  // --------------------------------------------------
  // LOAD ALERTS
  // --------------------------------------------------

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await getAlerts()

        if (Array.isArray(data)) {
          setAlerts(data)
        } else {
          setAlerts([])
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
        setAlerts([])
      } finally {
        setAlertsLoading(false)
      }
    }

    loadAlerts()
  }, [])

  // --------------------------------------------------
  // LOAD NETWORK METRICS
  // --------------------------------------------------

  useEffect(() => {
    async function loadNetworkMetrics() {
      try {
        const data = await getNetworkMetrics()

        if (Array.isArray(data)) {
          setNetworkMetrics(data)
        } else {
          setNetworkMetrics([])
        }
      } catch (error) {
        console.error(
          "Failed to fetch network metrics:",
          error
        )

        setNetworkMetrics([])
      } finally {
        setNetworkLoading(false)
      }
    }

    loadNetworkMetrics()
  }, [])

  // --------------------------------------------------
  // ALERT COUNTS
  // --------------------------------------------------

  const activeAlerts = alerts.filter(
    (alert) =>
      alert.status?.toUpperCase() === "OPEN" ||
      alert.status?.toUpperCase() === "ACTIVE"
  ).length

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert.severity?.toUpperCase() === "CRITICAL" ||
      alert.severity?.toUpperCase() === "HIGH"
  ).length

  // --------------------------------------------------
  // INFRASTRUCTURE METRICS
  // --------------------------------------------------

  const averageMetric = (field) => {
    if (infrastructureMetrics.length === 0) {
      return 0
    }

    const values = infrastructureMetrics
      .map((metric) => Number(metric[field]))
      .filter((value) => !Number.isNaN(value))

    if (values.length === 0) {
      return 0
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    )

    return Number((total / values.length).toFixed(1))
  }

  const averageCpu = averageMetric("cpuUsage")
  const averageMemory = averageMetric("memoryUsage")
  const averageDisk = averageMetric("diskUsage")

  // --------------------------------------------------
  // HEALTH COUNTS
  // --------------------------------------------------

  const healthyAssets = assets.filter(
    (asset) =>
      asset.status?.toUpperCase() === "HEALTHY"
  ).length

  const warningAssets = assets.filter(
    (asset) =>
      asset.status?.toUpperCase() === "WARNING"
  ).length

  const criticalAssets = assets.filter(
    (asset) =>
      asset.status?.toUpperCase() === "CRITICAL"
  ).length

  // --------------------------------------------------
  // DASHBOARD SUMMARY
  // --------------------------------------------------

  const dashboardData = {
    assetsMonitored: assets.length,
    uptime: "N/A",
    activeAlerts,
    cpu: averageCpu,
    memory: averageMemory,
    disk: averageDisk,
    network: "N/A",
  }

  // --------------------------------------------------
  // PERFORMANCE CHART
  // --------------------------------------------------

  const performanceData = infrastructureMetrics.map(
    (metric) => {
      let time = "--:--"

      if (metric.timestamp) {
        const date = new Date(metric.timestamp)

        if (!Number.isNaN(date.getTime())) {
          time = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      }

      return {
        time,
        cpu: Number(metric.cpuUsage ?? 0),
        memory: Number(metric.memoryUsage ?? 0),
      }
    }
  )

  // If multiple assets have the same timestamp,
  // show their average as one chart point.
  const groupedPerformanceData = Object.values(
    performanceData.reduce((groups, item) => {
      if (!groups[item.time]) {
        groups[item.time] = {
          time: item.time,
          cpuValues: [],
          memoryValues: [],
        }
      }

      groups[item.time].cpuValues.push(item.cpu)
      groups[item.time].memoryValues.push(item.memory)

      return groups
    }, {})
  ).map((group) => ({
    time: group.time,
    cpu: Number(
      (
        group.cpuValues.reduce(
          (sum, value) => sum + value,
          0
        ) / group.cpuValues.length
      ).toFixed(1)
    ),
    memory: Number(
      (
        group.memoryValues.reduce(
          (sum, value) => sum + value,
          0
        ) / group.memoryValues.length
      ).toFixed(1)
    ),
  }))

  // --------------------------------------------------
  // NETWORK DATA
  // --------------------------------------------------

  const latestNetwork =
    networkMetrics.length > 0
      ? networkMetrics[networkMetrics.length - 1]
      : null

  const networkStatus =
    latestNetwork?.status || "UNKNOWN"

  const incomingTraffic =
    latestNetwork?.networkIn ?? 0

  const outgoingTraffic =
    latestNetwork?.networkOut ?? 0

  const latency =
    latestNetwork?.latency ?? 0

  const packetLoss =
    latestNetwork?.packetLoss ?? 0

  const networkData = networkMetrics.map(
    (metric) => {
      let time = "--:--"

      if (metric.timestamp) {
        const date = new Date(metric.timestamp)

        if (!Number.isNaN(date.getTime())) {
          time = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      }

      return {
        time,
        incoming: Number(metric.networkIn ?? 0),
        outgoing: Number(metric.networkOut ?? 0),
      }
    }
  )

  // --------------------------------------------------
  // RECENT ALERTS
  // --------------------------------------------------

  const recentAlerts = alerts.slice(0, 5)

  // --------------------------------------------------
  // RETURN
  // --------------------------------------------------

  return (
    <div className="dashboard">

      {/* Dashboard introduction */}
      <div className="dashboard-intro">

        <div>

          <p className="eyebrow">
            SYSTEM OVERVIEW
          </p>

          <h1>
            Infrastructure Command Center
          </h1>

          <p className="dashboard-subtitle">
            Real-time visibility into your infrastructure,
            resources and system health.
          </p>

        </div>

        <div className="dashboard-live">

          <span className="status-dot"></span>

          Monitoring Active

        </div>

      </div>

      {/* Summary cards */}
      <div className="card-grid">

        <div className="card">

          <h3>
            Assets Monitored
          </h3>

          <p className="card-value">

            {assetsLoading
              ? "..."
              : dashboardData.assetsMonitored}

          </p>

        </div>

        <div className="card">

          <h3>
            System Uptime
          </h3>

          <p className="card-value">
            {dashboardData.uptime}
          </p>

        </div>

        <div className="card">

          <h3>
            Active Alerts
          </h3>

          <p className="card-value">

            {alertsLoading
              ? "..."
              : dashboardData.activeAlerts}

          </p>

        </div>

        <div className="card">

          <h3>
            CPU Usage
          </h3>

          <p className="card-value">

            {metricsLoading
              ? "..."
              : `${dashboardData.cpu}%`}

          </p>

        </div>

        <div className="card">

          <h3>
            Memory Usage
          </h3>

          <p className="card-value">

            {metricsLoading
              ? "..."
              : `${dashboardData.memory}%`}

          </p>

        </div>

        <div className="card">

          <h3>
            Disk Usage
          </h3>

          <p className="card-value">

            {metricsLoading
              ? "..."
              : `${dashboardData.disk}%`}

          </p>

        </div>

        <div className="card">

          <h3>
            Network Usage
          </h3>

          <p className="card-value">
            {dashboardData.network}
          </p>

        </div>

      </div>

      {/* Performance charts */}
      <div className="dashboard-section">

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              RESOURCE PERFORMANCE
            </p>

            <h2>
              Infrastructure Metrics
            </h2>

          </div>

          <span className="section-badge">
            LIVE DATA
          </span>

        </div>

        <div className="chart-grid">

          {/* CPU / Memory chart */}
          <div className="chart-card">

            <div className="chart-header">

              <div>

                <h3>
                  CPU & Memory
                </h3>

                <p>
                  Recent resource utilization
                </p>

              </div>

            </div>

            <div className="chart-container">

              {metricsLoading ? (

                <p className="loading-message">
                  Loading metrics...
                </p>

              ) : groupedPerformanceData.length === 0 ? (

                <p className="loading-message">
                  No infrastructure metrics found.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={groupedPerformanceData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={11}
                    />

                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      unit="%"
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#111a2b",
                        border:
                          "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>

              )}

            </div>

            <div className="chart-legend">

              <span>

                <i className="legend-dot cpu-dot"></i>

                CPU

              </span>

              <span>

                <i className="legend-dot memory-dot"></i>

                Memory

              </span>

            </div>

          </div>

          {/* Network chart */}
          <div className="chart-card">

            <div className="chart-header">

              <div>

                <h3>
                  Network Activity
                </h3>

                <p>
                  Inbound and outbound traffic
                </p>

              </div>

            </div>

            <div className="chart-container">

              {networkLoading ? (

                <p className="loading-message">
                  Loading network metrics...
                </p>

              ) : networkData.length === 0 ? (

                <p className="loading-message">
                  No network metrics found.
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={networkData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={11}
                    />

                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#111a2b",
                        border:
                          "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="incoming"
                      stroke="#38bdf8"
                      fill="rgba(56,189,248,0.12)"
                      strokeWidth={2}
                    />

                    <Area
                      type="monotone"
                      dataKey="outgoing"
                      stroke="#a78bfa"
                      fill="rgba(167,139,250,0.08)"
                      strokeWidth={2}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              )}

            </div>

            <div className="chart-legend">

              <span>

                <i className="legend-dot cpu-dot"></i>

                Incoming

              </span>

              <span>

                <i className="legend-dot memory-dot"></i>

                Outgoing

              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Health and alerts */}
      <div className="dashboard-bottom">

        {/* Infrastructure health */}
        <div className="health-panel">

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                ASSET HEALTH
              </p>

              <h2>
                Infrastructure Status
              </h2>

            </div>

          </div>

          <div className="health-status-list">

            <div className="health-status-item">

              <span className="health-indicator healthy"></span>

              <div>

                <strong>
                  Healthy
                </strong>

                <small>
                  Operational assets
                </small>

              </div>

              <b>
                {assetsLoading
                  ? "..."
                  : healthyAssets}
              </b>

            </div>

            <div className="health-status-item">

              <span className="health-indicator warning"></span>

              <div>

                <strong>
                  Warning
                </strong>

                <small>
                  Needs attention
                </small>

              </div>

              <b>
                {assetsLoading
                  ? "..."
                  : warningAssets}
              </b>

            </div>

            <div className="health-status-item">

              <span className="health-indicator critical"></span>

              <div>

                <strong>
                  Critical
                </strong>

                <small>
                  Immediate attention
                </small>

              </div>

              <b>
                {assetsLoading
                  ? "..."
                  : criticalAssets}
              </b>

            </div>

          </div>

        </div>

        {/* Recent alerts */}
        <div className="alerts-panel">

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                SECURITY EVENTS
              </p>

              <h2>
                Recent Alerts
              </h2>

            </div>

            <span className="alert-count">

              {alertsLoading
                ? "Loading..."
                : `${dashboardData.activeAlerts} active`}

            </span>

          </div>

          <div className="recent-alerts">

            {alertsLoading ? (

              <p className="loading-message">
                Loading alerts...
              </p>

            ) : recentAlerts.length === 0 ? (

              <p className="loading-message">
                No alerts found.
              </p>

            ) : (

              recentAlerts.map((alert) => (

                <div
                  className="recent-alert"
                  key={alert.id}
                >

                  <div
                    className={`alert-severity ${
                      alert.severity?.toLowerCase() ||
                      "unknown"
                    }`}
                  ></div>

                  <div className="alert-content">

                    <strong>
                      Asset #{alert.assetId}
                    </strong>

                    <p>
                      {alert.message ||
                        alert.alertType ||
                        "Infrastructure alert detected."}
                    </p>

                    <small>

                      {alert.alertType || "Alert"}

                      {" · "}

                      {alert.status || "UNKNOWN"}

                    </small>

                  </div>

                  <span
                    className={`alert-label ${
                      alert.severity?.toLowerCase() ||
                      "unknown"
                    }`}
                  >
                    {alert.severity || "UNKNOWN"}
                  </span>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

      {/* Network status information */}
      <div
        style={{
          marginTop: "24px",
          padding: "18px",
          borderRadius: "12px",
          background: "rgba(15,23,42,0.7)",
          border:
            "1px solid rgba(148,163,184,0.15)",
        }}
      >

        <p className="eyebrow">
          NETWORK STATUS
        </p>

        <h3>
          {networkLoading
            ? "Loading..."
            : networkStatus}
        </h3>

        {!networkLoading && latestNetwork && (

          <p
            style={{
              marginTop: "8px",
              color: "#94a3b8",
            }}
          >

            Incoming: {incomingTraffic} Mbps

            {" · "}

            Outgoing: {outgoingTraffic} Mbps

            {" · "}

            Latency: {latency} ms

            {" · "}

            Packet Loss: {packetLoss}%

          </p>

        )}

      </div>

    </div>
  )
}

export default Dashboard