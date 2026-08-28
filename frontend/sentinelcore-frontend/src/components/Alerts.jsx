function Alerts() {
  // Temporary mock data for Milestone 1.
  // Later this will come from GET /api/alerts
  const alerts = [
    {
      id: 1,
      asset: "DB-SRV-12",
      metric: "CPU Usage",
      value: 94,
      threshold: 90,
      severity: "CRITICAL",
      status: "RESOLVED",
      message: "CPU usage exceeded the critical threshold.",
      autoScaled: true,
      time: "5 min ago",
    },
    {
      id: 2,
      asset: "APP-47",
      metric: "Memory Usage",
      value: 82,
      threshold: 80,
      severity: "WARNING",
      status: "ACTIVE",
      message: "Memory usage is above the warning threshold.",
      autoScaled: false,
      time: "12 min ago",
    },
    {
      id: 3,
      asset: "DB-05",
      metric: "Disk Usage",
      value: 91,
      threshold: 85,
      severity: "CRITICAL",
      status: "ACTIVE",
      message: "Disk usage is critically high.",
      autoScaled: false,
      time: "18 min ago",
    },
  ]

  const activeAlerts = alerts.filter(
    (alert) => alert.status === "ACTIVE"
  ).length

  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "CRITICAL"
  ).length

  const warningAlerts = alerts.filter(
    (alert) => alert.severity === "WARNING"
  ).length

  const resolvedAlerts = alerts.filter(
    (alert) => alert.status === "RESOLVED"
  ).length

  return (
    <div className="alerts-page">

      {/* Introduction */}
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">SECURITY EVENTS</p>

          <h1>Infrastructure Alerts</h1>

          <p className="dashboard-subtitle">
            Monitor infrastructure events, threshold violations,
            and automated system responses.
          </p>
        </div>

        <div className="dashboard-live">
          <span className="status-dot"></span>
          ALERT MONITORING
        </div>
      </div>

      {/* Alert overview */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">ALERT OVERVIEW</p>

            <h2>Security Events</h2>
          </div>

          <span className="alert-count">
            {activeAlerts} ACTIVE
          </span>
        </div>

        <div className="alert-summary">

          <div className="alert-card alert-card-active">
            <div className="alert-card-icon">
              !
            </div>

            <h3>Active Alerts</h3>

            <p>{activeAlerts}</p>

            <small>Require attention</small>
          </div>

          <div className="alert-card alert-card-critical">
            <div className="alert-card-icon">
              !
            </div>

            <h3>Critical</h3>

            <p>{criticalAlerts}</p>

            <small>High severity events</small>
          </div>

          <div className="alert-card alert-card-warning">
            <div className="alert-card-icon">
              !
            </div>

            <h3>Warnings</h3>

            <p>{warningAlerts}</p>

            <small>Threshold warnings</small>
          </div>

          <div className="alert-card alert-card-resolved">
            <div className="alert-card-icon">
              ✓
            </div>

            <h3>Resolved</h3>

            <p>{resolvedAlerts}</p>

            <small>Previously detected</small>
          </div>

        </div>
      </section>

      {/* Recent alerts */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENT EVENTS</p>

            <h2>Alert Activity</h2>
          </div>

          <span className="section-badge">
            LIVE EVENTS
          </span>
        </div>

        <div className="alerts-panel">

          <div className="recent-alerts">

            {alerts.map((alert) => (
              <div
                className="recent-alert"
                key={alert.id}
              >

                <div
                  className={`alert-severity ${alert.severity.toLowerCase()}`}
                ></div>

                <div className="alert-content">

                  <strong>
                    {alert.asset} — {alert.metric}
                  </strong>

                  <p>
                    {alert.message}
                  </p>

                  <small>
                    {alert.value}% detected ·
                    Threshold {alert.threshold}% ·
                    {alert.time}
                  </small>

                </div>

                <span
                  className={`alert-label ${alert.severity.toLowerCase()}`}
                >
                  {alert.severity}
                </span>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* Alert details table */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">EVENT DETAILS</p>

            <h2>Alert History</h2>
          </div>
        </div>

        <div className="asset-table-wrapper">

          <table className="asset-table">

            <thead>
              <tr>
                <th>Asset</th>
                <th>Metric</th>
                <th>Value</th>
                <th>Threshold</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Response</th>
              </tr>
            </thead>

            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>

                  <td>{alert.asset}</td>

                  <td>{alert.metric}</td>

                  <td>{alert.value}%</td>

                  <td>{alert.threshold}%</td>

                  <td>
                    <span
                      className={`status-badge ${alert.severity.toLowerCase()}`}
                    >
                      {alert.severity}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`alert-status ${
                        alert.status.toLowerCase()
                      }`}
                    >
                      {alert.status}
                    </span>
                  </td>

                  <td>
                    {alert.autoScaled
                      ? "Auto-scaled"
                      : "No action"}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </section>

    </div>
  )
}

export default Alerts