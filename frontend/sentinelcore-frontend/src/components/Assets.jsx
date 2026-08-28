import { useEffect, useState } from "react"
import { getAssets } from "../services/api"

function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  // Temporary mock data for frontend development.
  // This will be replaced automatically when the backend API is available.
  const mockAssets = [
    {
      id: 1,
      name: "Web Server 01",
      type: "Server",
      status: "Healthy",
    },
    {
      id: 2,
      name: "Database Server",
      type: "Database",
      status: "Healthy",
    },
    {
      id: 3,
      name: "Application Server",
      type: "Server",
      status: "Warning",
    },
    {
      id: 4,
      name: "Cloud VM 01",
      type: "Cloud",
      status: "Healthy",
    },
    {
      id: 5,
      name: "Network Router",
      type: "Network",
      status: "Critical",
    },
  ]

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await getAssets()

        // Use backend data when available.
        if (Array.isArray(data) && data.length > 0) {
          setAssets(data)
        } else {
          // Backend responded but returned no assets.
          setAssets(mockAssets)
        }
      } catch (error) {
        // Backend is unavailable, so use mock data.
        console.log("Backend unavailable. Using mock asset data.")
        setAssets(mockAssets)
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

        {!loading && (
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