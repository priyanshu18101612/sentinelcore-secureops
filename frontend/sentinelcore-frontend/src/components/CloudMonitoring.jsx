import { useEffect, useState } from "react"
import {
  getCloudResources,
  getCloudHealth,
} from "../services/api"

function CloudMonitoring() {

  // --------------------------------------------------
  // MOCK DATA
  // Used only when backend/CORS is unavailable.
  // --------------------------------------------------

  const mockCloudResources = [
    {
      id: 1,
      name: "Production EC2",
      provider: "AWS",
      type: "Compute",
      status: "HEALTHY",
      cpu: 38,
      region: "us-east-1",
    },
    {
      id: 2,
      name: "Production RDS",
      provider: "AWS",
      type: "Database",
      status: "HEALTHY",
      cpu: 52,
      region: "us-east-1",
    },
    {
      id: 3,
      name: "AKS Cluster",
      provider: "Azure",
      type: "Container",
      status: "WARNING",
      cpu: 78,
      region: "East US",
    },
  ]

  const mockCloudHealth = "HEALTHY"

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [cloudResources, setCloudResources] = useState([])
  const [cloudHealth, setCloudHealth] = useState("UNKNOWN")
  const [loading, setLoading] = useState(true)

  // --------------------------------------------------
  // LOAD CLOUD DATA
  // --------------------------------------------------

  useEffect(() => {

    async function loadCloudData() {

      try {

        const [resources, health] = await Promise.all([
          getCloudResources(),
          getCloudHealth(),
        ])

        // Use backend resources when available.
        if (
          Array.isArray(resources) &&
          resources.length > 0
        ) {

          setCloudResources(resources)

        } else {

          // Backend responded but returned no resources.
          setCloudResources(mockCloudResources)

        }

        // Use backend health when available.
        if (health) {

          setCloudHealth(health)

        } else {

          setCloudHealth(mockCloudHealth)

        }

      } catch (error) {

        console.log(
          "Backend cloud unavailable. Using mock cloud data."
        )

        setCloudResources(mockCloudResources)
        setCloudHealth(mockCloudHealth)

      } finally {

        setLoading(false)

      }
    }

    loadCloudData()

  }, [])

  // --------------------------------------------------
  // CLOUD COUNTS
  // --------------------------------------------------

  const healthyResources = cloudResources.filter(
    (resource) =>
      resource.status?.toUpperCase() === "HEALTHY"
  ).length

  const warningResources = cloudResources.filter(
    (resource) =>
      resource.status?.toUpperCase() === "WARNING"
  ).length

  const criticalResources = cloudResources.filter(
    (resource) =>
      resource.status?.toUpperCase() === "CRITICAL"
  ).length

  const totalResources = cloudResources.length

  // --------------------------------------------------
  // AVERAGE CPU
  // --------------------------------------------------

  const averageCpu =
    totalResources > 0
      ? Math.round(
          cloudResources.reduce(
            (total, resource) =>
              total + Number(resource.cpu || 0),
            0
          ) / totalResources
        )
      : 0

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="cloud-page">

      {/* Page introduction */}
      <div className="dashboard-intro">

        <div>

          <p className="eyebrow">
            CLOUD INFRASTRUCTURE
          </p>

          <h1>
            Cloud Monitoring
          </h1>

          <p className="dashboard-subtitle">
            Monitor cloud resources, infrastructure health,
            and resource utilization across connected providers.
          </p>

        </div>

        <div className="dashboard-live">

          <span className="status-dot"></span>

          CLOUD MONITORING

        </div>

      </div>


      {/* Loading */}
      {loading && (

        <section className="dashboard-section">

          <div className="table-container">

            <p className="loading-message">
              Loading cloud resources...
            </p>

          </div>

        </section>

      )}


      {/* Cloud overview */}
      {!loading && (

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                RESOURCE OVERVIEW
              </p>

              <h2>
                Cloud Health
              </h2>

            </div>

            <span className="section-badge">
              {totalResources} RESOURCES
            </span>

          </div>


          <div className="health-summary">

            {/* Healthy */}
            <div className="health-card cloud-healthy">

              <div className="health-card-icon">
                ●
              </div>

              <h3>
                Healthy Resources
              </h3>

              <p>
                {healthyResources}
              </p>

              <small>
                Operational resources
              </small>

            </div>


            {/* Warning */}
            <div className="health-card cloud-warning">

              <div className="health-card-icon">
                ●
              </div>

              <h3>
                Warning Resources
              </h3>

              <p>
                {warningResources}
              </p>

              <small>
                Need attention
              </small>

            </div>


            {/* Critical */}
            <div className="health-card cloud-critical">

              <div className="health-card-icon">
                ●
              </div>

              <h3>
                Critical Resources
              </h3>

              <p>
                {criticalResources}
              </p>

              <small>
                Immediate attention
              </small>

            </div>


            {/* Average CPU */}
            <div className="health-card cloud-cpu">

              <div className="health-card-icon">
                ◈
              </div>

              <h3>
                Average CPU
              </h3>

              <p>
                {averageCpu}%
              </p>

              <small>
                Across cloud resources
              </small>

            </div>

          </div>


          {/* Overall cloud health */}
          <div className="section-heading">

            <div>

              <p className="eyebrow">
                OVERALL STATUS
              </p>

              <h2>
                Cloud Infrastructure Health
              </h2>

            </div>

            <span
              className={`status-badge ${
                cloudHealth?.toLowerCase() || "unknown"
              }`}
            >
              {cloudHealth}
            </span>

          </div>

        </section>

      )}


      {/* Cloud resources */}
      {!loading && (

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                CONNECTED RESOURCES
              </p>

              <h2>
                Cloud Resources
              </h2>

            </div>

            <span className="section-badge">
              LIVE STATUS
            </span>

          </div>


          {cloudResources.length === 0 ? (

            <div className="table-container">

              <p className="loading-message">
                No cloud resources found.
              </p>

            </div>

          ) : (

            <div className="asset-table-wrapper">

              <table className="asset-table">

                <thead>

                  <tr>

                    <th>
                      Resource
                    </th>

                    <th>
                      Provider
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Region
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      CPU
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {cloudResources.map((resource) => (

                    <tr key={resource.id}>

                      <td>
                        {resource.name}
                      </td>

                      <td>
                        {resource.provider}
                      </td>

                      <td>
                        {resource.type}
                      </td>

                      <td>
                        {resource.region}
                      </td>

                      <td>

                        <span
                          className={`status-badge ${
                            resource.status?.toLowerCase() ||
                            "unknown"
                          }`}
                        >
                          {resource.status || "UNKNOWN"}
                        </span>

                      </td>

                      <td>
                        {resource.cpu ?? 0}%
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

export default CloudMonitoring