import { useEffect, useState } from "react"
import {
  getNetworkStatus,
  getNetworkMetrics,
} from "../services/api"

function NetworkMonitoring() {
  const [networkStatus, setNetworkStatus] = useState("UNKNOWN")
  const [networkMetrics, setNetworkMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNetworkData() {
      try {
        const [status, metrics] = await Promise.all([
          getNetworkStatus(),
          getNetworkMetrics(),
        ])

        setNetworkStatus(status || "UNKNOWN")

        if (Array.isArray(metrics) && metrics.length > 0) {
          setNetworkMetrics(metrics[0])
        } else {
          setNetworkMetrics(null)
        }
      } catch (error) {
        console.error("Failed to fetch network data:", error)
        setNetworkStatus("UNKNOWN")
        setNetworkMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    loadNetworkData()
  }, [])

  const incomingTraffic = Number(
    networkMetrics?.networkIn || 0
  )

  const outgoingTraffic = Number(
    networkMetrics?.networkOut || 0
  )

  const latency = Number(
    networkMetrics?.latency || 0
  )

  const packetLoss = Number(
    networkMetrics?.packetLoss || 0
  )

  const networkName =
    networkMetrics?.networkName || "Network"

  const isNetworkUp =
    networkStatus?.toUpperCase() === "UP"

  return (
    <div className="monitoring-page">

      {/* Page introduction */}
      <div className="monitoring-intro">
        <div>
          <p className="eyebrow">NETWORK INFRASTRUCTURE</p>

          <h1>Network Monitoring</h1>

          <p className="monitoring-subtitle">
            Monitor network health, traffic, latency, and bandwidth
            across the infrastructure.
          </p>
        </div>

        <div className="dashboard-live">
          <span className="status-dot"></span>
          NETWORK MONITORING
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <section className="dashboard-section">
          <div className="table-container">
            <p className="loading-message">
              Loading network data...
            </p>
          </div>
        </section>
      )}

      {!loading && (
        <>
          {/* Network overview */}
          <section className="dashboard-section">

            <div className="section-heading">
              <div>
                <p className="eyebrow">NETWORK OVERVIEW</p>
                <h2>Network Health</h2>
              </div>

              <span className="section-badge">
                LIVE STATUS
              </span>
            </div>

            <div className="health-summary">

              {/* Status */}
              <div className="health-card network-healthy">
                <h3>Network Status</h3>

                <p>{networkStatus}</p>

                <span className="network-card-description">
                  {isNetworkUp
                    ? "All network services operational"
                    : "Network requires attention"}
                </span>
              </div>

              {/* Incoming */}
              <div className="health-card network-blue">
                <h3>Incoming Traffic</h3>

                <p>
                  {incomingTraffic} Mbps
                </p>

                <span className="network-card-description">
                  Inbound network traffic
                </span>
              </div>

              {/* Outgoing */}
              <div className="health-card network-purple">
                <h3>Outgoing Traffic</h3>

                <p>
                  {outgoingTraffic} Mbps
                </p>

                <span className="network-card-description">
                  Outbound network traffic
                </span>
              </div>

            </div>

          </section>

          {/* Network performance */}
          <section className="dashboard-section">

            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  NETWORK PERFORMANCE
                </p>

                <h2>Performance Metrics</h2>
              </div>

              <span className="section-badge">
                LIVE DATA
              </span>
            </div>

            <div className="network-metrics-grid">

              {/* Latency */}
              <div className="network-metric-card latency-card">

                <div className="network-metric-icon">
                  ↔
                </div>

                <div>
                  <h3>Latency</h3>

                  <p className="network-metric-value">
                    {latency}
                    <span> ms</span>
                  </p>

                  <small>
                    Network response time
                  </small>
                </div>

              </div>

              {/* Packet Loss */}
              <div className="network-metric-card packet-card">

                <div className="network-metric-icon">
                  %
                </div>

                <div>
                  <h3>Packet Loss</h3>

                  <p className="network-metric-value">
                    {packetLoss}
                    <span>%</span>
                  </p>

                  <small>
                    Packets lost during transmission
                  </small>
                </div>

              </div>

              {/* Bandwidth */}
              <div className="network-metric-card bandwidth-card">

                <div className="network-metric-icon">
                  ↑
                </div>

                <div>
                  <h3>Bandwidth Usage</h3>

                  <p className="network-metric-value">
                    N/A
                  </p>

                  <small>
                    Not provided by current API
                  </small>
                </div>

              </div>

            </div>

          </section>

          {/* Traffic overview */}
          <section className="dashboard-section">

            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  TRAFFIC ACTIVITY
                </p>

                <h2>Network Traffic</h2>
              </div>

              <span className="section-badge">
                {networkName}
              </span>
            </div>

            <div className="traffic-panel">

              {/* Incoming traffic */}
              <div className="traffic-row">

                <div className="traffic-info">
                  <strong>
                    Incoming Traffic
                  </strong>

                  <span>
                    {incomingTraffic} Mbps
                  </span>
                </div>

                <div className="traffic-bar">
                  <div
                    className="traffic-fill incoming"
                    style={{
                      width: `${Math.min(
                        incomingTraffic / 2,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>

              </div>

              {/* Outgoing traffic */}
              <div className="traffic-row">

                <div className="traffic-info">
                  <strong>
                    Outgoing Traffic
                  </strong>

                  <span>
                    {outgoingTraffic} Mbps
                  </span>
                </div>

                <div className="traffic-bar">
                  <div
                    className="traffic-fill outgoing"
                    style={{
                      width: `${Math.min(
                        outgoingTraffic / 2,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>

              </div>

            </div>

          </section>

          {/* Last updated */}
          {networkMetrics?.timestamp && (
            <section className="dashboard-section">

              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    MONITORING INFORMATION
                  </p>

                  <h2>Last Updated</h2>
                </div>

                <span className="section-badge">
                  LIVE
                </span>
              </div>

              <div className="table-container">
                <p>
                  {networkMetrics.timestamp}
                </p>
              </div>

            </section>
          )}
        </>
      )}

    </div>
  )
}

export default NetworkMonitoring