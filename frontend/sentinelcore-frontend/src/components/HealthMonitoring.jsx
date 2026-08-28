function HealthMonitoring() {
  // Temporary mock data for Milestone 1.
  // This will later come from the backend health API.
  const healthData = [
    {
      id: 1,
      name: "SRV-12",
      type: "Server",
      status: "HEALTHY",
      checkedAt: "2026-08-26 16:30",
    },
    {
      id: 2,
      name: "APP-47",
      type: "Server",
      status: "WARNING",
      checkedAt: "2026-08-26 16:29",
    },
    {
      id: 3,
      name: "DB-05",
      type: "Database",
      status: "CRITICAL",
      checkedAt: "2026-08-26 16:28",
    },
    {
      id: 4,
      name: "WEB-01",
      type: "Server",
      status: "HEALTHY",
      checkedAt: "2026-08-26 16:30",
    },
  ]

  // Calculate health counts from the mock data
  const healthyCount = healthData.filter(
    (asset) => asset.status === "HEALTHY"
  ).length

  const warningCount = healthData.filter(
    (asset) => asset.status === "WARNING"
  ).length

  const criticalCount = healthData.filter(
    (asset) => asset.status === "CRITICAL"
  ).length

  const totalAssets = healthData.length

  const healthPercentage = Math.round(
    (healthyCount / totalAssets) * 100
  )

  return (
    <div className="health-page">

      {/* Page introduction */}
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">ASSET HEALTH</p>

          <h1>Infrastructure Health</h1>

          <p className="dashboard-subtitle">
            Real-time health visibility across monitored
            infrastructure assets and services.
          </p>
        </div>

        <div className="dashboard-live">
          <span className="status-dot"></span>
          HEALTH MONITORING
        </div>
      </div>

      {/* Health overview */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">SYSTEM STATUS</p>

            <h2>Health Overview</h2>
          </div>

          <span className="section-badge">
            {totalAssets} ASSETS
          </span>
        </div>

        <div className="health-summary">

          <div className="health-card health-card-healthy">
            <div className="health-card-icon">
              ●
            </div>

            <h3>Healthy</h3>

            <p>{healthyCount}</p>

            <small>
              Operational assets
            </small>
          </div>

          <div className="health-card health-card-warning">
            <div className="health-card-icon">
              ●
            </div>

            <h3>Warning</h3>

            <p>{warningCount}</p>

            <small>
              Needs attention
            </small>
          </div>

          <div className="health-card health-card-critical">
            <div className="health-card-icon">
              ●
            </div>

            <h3>Critical</h3>

            <p>{criticalCount}</p>

            <small>
              Immediate attention
            </small>
          </div>

          <div className="health-card health-card-overall">
            <div className="health-card-icon">
              ◈
            </div>

            <h3>Health Score</h3>

            <p>{healthPercentage}%</p>

            <small>
              Overall healthy assets
            </small>
          </div>

        </div>
      </section>

      {/* Asset health table */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">MONITORED ASSETS</p>

            <h2>Infrastructure Status</h2>
          </div>

          <span className="section-badge">
            LIVE STATUS
          </span>
        </div>

        <div className="asset-table-wrapper">

          <table className="asset-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Checked</th>
              </tr>
            </thead>

            <tbody>
              {healthData.map((asset) => (
                <tr key={asset.id}>

                  <td>
                    #{String(asset.id).padStart(2, "0")}
                  </td>

                  <td>
                    {asset.name}
                  </td>

                  <td>
                    {asset.type}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${asset.status.toLowerCase()}`}
                    >
                      {asset.status}
                    </span>
                  </td>

                  <td>
                    {asset.checkedAt}
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

export default HealthMonitoring