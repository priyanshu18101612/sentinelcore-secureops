function NetworkMonitoring() {
  // Temporary mock data for Milestone 1.
  // Later these values will come from:
  // GET /api/network/status
  // GET /api/network/metrics

  const networkData = {
    overallStatus: "HEALTHY",
    incomingTraffic: 120.4,
    outgoingTraffic: 85.6,
    latency: 24,
    packetLoss: 0.2,
    bandwidth: 78,
  }

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

            <p>{networkData.overallStatus}</p>

            <span className="network-card-description">
              All network services operational
            </span>
          </div>


          {/* Incoming */}
          <div className="health-card network-blue">
            <h3>Incoming Traffic</h3>

            <p>{networkData.incomingTraffic} Mbps</p>

            <span className="network-card-description">
              Inbound network traffic
            </span>
          </div>


          {/* Outgoing */}
          <div className="health-card network-purple">
            <h3>Outgoing Traffic</h3>

            <p>{networkData.outgoingTraffic} Mbps</p>

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
            <p className="eyebrow">NETWORK PERFORMANCE</p>
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
                {networkData.latency}
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
                {networkData.packetLoss}
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
                {networkData.bandwidth}
                <span>%</span>
              </p>

              <small>
                Current network utilization
              </small>
            </div>

          </div>

        </div>

      </section>


      {/* Traffic overview */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">TRAFFIC ACTIVITY</p>
            <h2>Network Traffic</h2>
          </div>
        </div>


        <div className="traffic-panel">

          <div className="traffic-row">

            <div className="traffic-info">
              <strong>Incoming Traffic</strong>

              <span>
                {networkData.incomingTraffic} Mbps
              </span>
            </div>

            <div className="traffic-bar">
              <div
                className="traffic-fill incoming"
                style={{
                  width: `${Math.min(
                    networkData.incomingTraffic / 2,
                    100
                  )}%`,
                }}
              ></div>
            </div>

          </div>


          <div className="traffic-row">

            <div className="traffic-info">
              <strong>Outgoing Traffic</strong>

              <span>
                {networkData.outgoingTraffic} Mbps
              </span>
            </div>

            <div className="traffic-bar">
              <div
                className="traffic-fill outgoing"
                style={{
                  width: `${Math.min(
                    networkData.outgoingTraffic / 2,
                    100
                  )}%`,
                }}
              ></div>
            </div>

          </div>

        </div>

      </section>

    </div>
  )
}

export default NetworkMonitoring