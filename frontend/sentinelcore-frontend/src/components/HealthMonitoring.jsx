import { useEffect, useState } from "react"
import { getAssets, getHealth } from "../services/api"

function HealthMonitoring() {
  const [healthData, setHealthData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHealthData() {
      try {
        // Get all registered assets
        const assets = await getAssets()

        // Get health information for each asset
        const healthResults = await Promise.all(
          assets.map(async (asset) => {
            try {
              const health = await getHealth(asset.id)

              return {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                status: health.status || "UNKNOWN",
                checkedAt: health.checkedAt || "N/A",
              }
            } catch (error) {
              console.error(
                `Failed to fetch health for asset ${asset.id}:`,
                error
              )

              return {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                status: "UNKNOWN",
                checkedAt: "N/A",
              }
            }
          })
        )

        setHealthData(healthResults)
      } catch (error) {
        console.error("Failed to fetch health data:", error)
        setHealthData([])
      } finally {
        setLoading(false)
      }
    }

    loadHealthData()
  }, [])

  // Calculate health counts
  const healthyCount = healthData.filter(
    (asset) => asset.status?.toUpperCase() === "HEALTHY"
  ).length

  const warningCount = healthData.filter(
    (asset) => asset.status?.toUpperCase() === "WARNING"
  ).length

  const criticalCount = healthData.filter(
    (asset) => asset.status?.toUpperCase() === "CRITICAL"
  ).length

  const totalAssets = healthData.length

  // Calculate percentage of healthy assets
  const healthPercentage =
    totalAssets > 0
      ? Math.round((healthyCount / totalAssets) * 100)
      : 0

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

      {/* Loading */}
      {loading && (
        <section className="dashboard-section">
          <div className="asset-table-wrapper">
            <p className="loading-message">
              Loading health data...
            </p>
          </div>
        </section>
      )}

      {/* Health overview */}
      {!loading && (
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

            {/* Healthy */}
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

            {/* Warning */}
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

            {/* Critical */}
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

            {/* Health Score */}
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
      )}

      {/* Asset health table */}
      {!loading && (
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

          {healthData.length === 0 ? (
            <div className="asset-table-wrapper">
              <p className="loading-message">
                No health data found.
              </p>
            </div>
          ) : (
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
                        <strong className="asset-name">
                          {asset.name}
                        </strong>
                      </td>

                      <td>
                        {asset.type}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            asset.status?.toLowerCase() || "unknown"
                          }`}
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
          )}

        </section>
      )}

    </div>
  )
}

export default HealthMonitoring