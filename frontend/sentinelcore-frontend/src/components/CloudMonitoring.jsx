function CloudMonitoring() {
  // Temporary mock data for Milestone 1.
  // Later this will come from:
  // GET /api/cloud/resources
  // GET /api/cloud/health

  const cloudResources = [
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

  const healthyResources = cloudResources.filter(
    (resource) => resource.status === "HEALTHY"
  ).length

  const warningResources = cloudResources.filter(
    (resource) => resource.status === "WARNING"
  ).length

  const criticalResources = cloudResources.filter(
    (resource) => resource.status === "CRITICAL"
  ).length

  const totalResources = cloudResources.length

  const averageCpu = Math.round(
    cloudResources.reduce(
      (total, resource) => total + resource.cpu,
      0
    ) / totalResources
  )

  return (
    <div className="cloud-page">

      {/* Page introduction */}
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">CLOUD INFRASTRUCTURE</p>

          <h1>Cloud Monitoring</h1>

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

      {/* Cloud overview */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">RESOURCE OVERVIEW</p>

            <h2>Cloud Health</h2>
          </div>

          <span className="section-badge">
            {totalResources} RESOURCES
          </span>
        </div>

        <div className="health-summary">

          <div className="health-card cloud-healthy">
            <div className="health-card-icon">
              ●
            </div>

            <h3>Healthy Resources</h3>

            <p>{healthyResources}</p>

            <small>
              Operational resources
            </small>
          </div>

          <div className="health-card cloud-warning">
            <div className="health-card-icon">
              ●
            </div>

            <h3>Warning Resources</h3>

            <p>{warningResources}</p>

            <small>
              Need attention
            </small>
          </div>

          <div className="health-card cloud-critical">
            <div className="health-card-icon">
              ●
            </div>

            <h3>Critical Resources</h3>

            <p>{criticalResources}</p>

            <small>
              Immediate attention
            </small>
          </div>

          <div className="health-card cloud-cpu">
            <div className="health-card-icon">
              ◈
            </div>

            <h3>Average CPU</h3>

            <p>{averageCpu}%</p>

            <small>
              Across cloud resources
            </small>
          </div>

        </div>
      </section>

      {/* Cloud resources */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">CONNECTED RESOURCES</p>

            <h2>Cloud Resources</h2>
          </div>

          <span className="section-badge">
            LIVE STATUS
          </span>
        </div>

        <div className="asset-table-wrapper">

          <table className="asset-table">

            <thead>
              <tr>
                <th>Resource</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Region</th>
                <th>Status</th>
                <th>CPU</th>
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
                      className={`status-badge ${resource.status.toLowerCase()}`}
                    >
                      {resource.status}
                    </span>
                  </td>

                  <td>
                    {resource.cpu}%
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

export default CloudMonitoring