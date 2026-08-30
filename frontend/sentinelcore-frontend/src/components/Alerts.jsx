import { useEffect, useState } from "react"
import { getAlerts } from "../services/api"

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await getAlerts()

        setAlerts(
          Array.isArray(data) ? data : []
        )
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [])

  const activeAlerts = alerts.filter(
    (alert) =>
      alert.status?.toUpperCase() === "ACTIVE" ||
      alert.status?.toUpperCase() === "OPEN"
  ).length

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert.severity?.toUpperCase() === "CRITICAL"
  ).length

  const warningAlerts = alerts.filter(
    (alert) =>
      alert.severity?.toUpperCase() === "WARNING"
  ).length

  const resolvedAlerts = alerts.filter(
    (alert) =>
      alert.status?.toUpperCase() === "RESOLVED" ||
      alert.status?.toUpperCase() === "CLOSED"
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

      {/* Loading */}
      {loading && (
        <section className="dashboard-section">
          <div className="table-container">
            <p className="loading-message">
              Loading alerts...
            </p>
          </div>
        </section>
      )}

      {!loading && (
        <>
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

              {/* Active */}
              <div className="alert-card alert-card-active">
                <div className="alert-card-icon">
                  !
                </div>

                <h3>Active Alerts</h3>

                <p>{activeAlerts}</p>

                <small>Require attention</small>
              </div>

              {/* Critical */}
              <div className="alert-card alert-card-critical">
                <div className="alert-card-icon">
                  !
                </div>

                <h3>Critical</h3>

                <p>{criticalAlerts}</p>

                <small>High severity events</small>
              </div>

              {/* Warning */}
              <div className="alert-card alert-card-warning">
                <div className="alert-card-icon">
                  !
                </div>

                <h3>Warnings</h3>

                <p>{warningAlerts}</p>

                <small>Threshold warnings</small>
              </div>

              {/* Resolved */}
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

                {alerts.length === 0 ? (
                  <p className="loading-message">
                    No alerts found.
                  </p>
                ) : (
                  alerts.map((alert) => (
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
                          Asset #{alert.assetId} —{" "}
                          {alert.alertType || "Alert"}
                        </strong>

                        <p>
                          {alert.message ||
                            "Infrastructure alert detected."}
                        </p>

                        <small>
                          Severity:{" "}
                          {alert.severity || "UNKNOWN"}{" "}
                          · Status:{" "}
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
          </section>

          {/* Alert details table */}
          <section className="dashboard-section">

            <div className="section-heading">
              <div>
                <p className="eyebrow">EVENT DETAILS</p>

                <h2>Alert History</h2>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="table-container">
                <p className="loading-message">
                  No alerts found.
                </p>
              </div>
            ) : (
              <div className="asset-table-wrapper">

                <table className="asset-table">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Asset</th>
                      <th>Alert Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id}>

                        <td>{alert.id}</td>

                        <td>
                          Asset #{alert.assetId}
                        </td>

                        <td>
                          {alert.alertType || "N/A"}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              alert.severity?.toLowerCase() ||
                              "unknown"
                            }`}
                          >
                            {alert.severity || "UNKNOWN"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`alert-status ${
                              alert.status?.toLowerCase() ||
                              "unknown"
                            }`}
                          >
                            {alert.status || "UNKNOWN"}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>
            )}

          </section>
        </>
      )}

    </div>
  )
}

export default Alerts