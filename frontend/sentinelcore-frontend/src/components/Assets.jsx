import { useEffect, useState } from "react"
import { getAssets } from "../services/api"

function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await getAssets()
        setAssets(data)
      } catch (error) {
        console.error("Failed to fetch assets:", error)
        setAssets([])
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
  }, [])

  return (
    <div className="monitoring-page">

      {/* Page introduction */}
      <div className="monitoring-intro">
        <div>
          <p className="eyebrow">INFRASTRUCTURE INVENTORY</p>

          <h1>Asset Inventory</h1>

          <p className="monitoring-subtitle">
            View and monitor all infrastructure assets currently registered
            in SentinelCore SecureOps.
          </p>
        </div>

        <div className="dashboard-live">
          <span className="status-dot"></span>
          ASSET MONITORING
        </div>
      </div>

      {/* Asset summary */}
      {!loading && (
        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <p className="eyebrow">ASSET OVERVIEW</p>
              <h2>Infrastructure Assets</h2>
            </div>

            <span className="section-badge">
              {assets.length} ASSETS
            </span>
          </div>

          <div className="health-summary">

            {/* Total */}
            <div className="health-card network-blue">
              <h3>Total Assets</h3>
              <p>{assets.length}</p>
            </div>

            {/* Healthy */}
            <div className="health-card">
              <h3>Healthy</h3>
              <p>
                {
                  assets.filter(
                    (asset) =>
                      asset.status?.toLowerCase() === "healthy"
                  ).length
                }
              </p>
            </div>

            {/* Warning */}
            <div className="health-card">
              <h3>Warning</h3>
              <p>
                {
                  assets.filter(
                    (asset) =>
                      asset.status?.toLowerCase() === "warning"
                  ).length
                }
              </p>
            </div>

          </div>

        </section>
      )}

      {/* Asset table */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">REGISTERED ASSETS</p>
            <h2>Asset List</h2>
          </div>
        </div>

        {loading && (
          <div className="table-container">
            <p className="loading-message">
              Loading assets...
            </p>
          </div>
        )}

        {!loading && assets.length === 0 && (
          <div className="table-container">
            <p className="loading-message">
              No assets found.
            </p>
          </div>
        )}

        {!loading && assets.length > 0 && (
          <div className="table-container">
            <table className="asset-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>

                    <td>{asset.id}</td>

                    <td>
                      <strong className="asset-name">
                        {asset.name}
                      </strong>
                    </td>

                    <td>{asset.type}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          asset.status?.toLowerCase() || "unknown"
                        }`}
                      >
                        {asset.status || "UNKNOWN"}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </section>

    </div>
  )
}

export default Assets