import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

function Dashboard() {
  // Temporary mock data for Milestone 1.
  // This will be replaced with real API data later.

  const dashboardData = {
    assetsMonitored: 2847,
    uptime: "99.99%",
    activeAlerts: 12,
    cpu: 23,
    memory: 47,
    disk: 67,
    network: 12,
  }

  // Mock historical monitoring data for charts.
  const performanceData = [
    { time: "10:00", cpu: 35, memory: 48 },
    { time: "10:05", cpu: 42, memory: 51 },
    { time: "10:10", cpu: 38, memory: 49 },
    { time: "10:15", cpu: 55, memory: 54 },
    { time: "10:20", cpu: 47, memory: 52 },
    { time: "10:25", cpu: 31, memory: 48 },
    { time: "10:30", cpu: 23, memory: 47 },
  ]

  const networkData = [
    { time: "10:00", incoming: 80, outgoing: 55 },
    { time: "10:05", incoming: 95, outgoing: 62 },
    { time: "10:10", incoming: 72, outgoing: 48 },
    { time: "10:15", incoming: 110, outgoing: 70 },
    { time: "10:20", incoming: 98, outgoing: 65 },
    { time: "10:25", incoming: 88, outgoing: 60 },
    { time: "10:30", incoming: 120, outgoing: 86 },
  ]

  const healthData = {
    healthy: 23,
    warning: 4,
    critical: 1,
  }

  const recentAlerts = [
    {
      id: 1,
      asset: "Application Server",
      message: "CPU usage above threshold",
      severity: "Warning",
      time: "5 min ago",
    },
    {
      id: 2,
      asset: "Network Router",
      message: "Network connectivity issue",
      severity: "Critical",
      time: "12 min ago",
    },
    {
      id: 3,
      asset: "Database Server",
      message: "Disk usage increasing",
      severity: "Warning",
      time: "24 min ago",
    },
  ]

  return (
    <div className="dashboard">

      {/* Dashboard introduction */}
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">SYSTEM OVERVIEW</p>

          <h1>Infrastructure Command Center</h1>

          <p className="dashboard-subtitle">
            Real-time visibility into your infrastructure,
            resources and system health.
          </p>
        </div>

        <div className="dashboard-live">
          <span className="status-dot"></span>
          Monitoring Active
        </div>
      </div>

      {/* Summary cards */}
      <div className="card-grid">

        <div className="card">
          <h3>Assets Monitored</h3>
          <p className="card-value">
            {dashboardData.assetsMonitored}
          </p>
        </div>

        <div className="card">
          <h3>System Uptime</h3>
          <p className="card-value">
            {dashboardData.uptime}
          </p>
        </div>

        <div className="card">
          <h3>Active Alerts</h3>
          <p className="card-value">
            {dashboardData.activeAlerts}
          </p>
        </div>

        <div className="card">
          <h3>CPU Usage</h3>
          <p className="card-value">
            {dashboardData.cpu}%
          </p>
        </div>

        <div className="card">
          <h3>Memory Usage</h3>
          <p className="card-value">
            {dashboardData.memory}%
          </p>
        </div>

        <div className="card">
          <h3>Disk Usage</h3>
          <p className="card-value">
            {dashboardData.disk}%
          </p>
        </div>

        <div className="card">
          <h3>Network Usage</h3>
          <p className="card-value">
            {dashboardData.network}%
          </p>
        </div>

      </div>

      {/* Performance charts */}
      <div className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">RESOURCE PERFORMANCE</p>
            <h2>Infrastructure Metrics</h2>
          </div>

          <span className="section-badge">LIVE DATA</span>
        </div>

        <div className="chart-grid">

          {/* CPU / Memory chart */}
          <div className="chart-card">

            <div className="chart-header">
              <div>
                <h3>CPU & Memory</h3>
                <p>Recent resource utilization</p>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.1)"
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={11}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    unit="%"
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111a2b",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="memory"
                    stroke="#a78bfa"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              <span>
                <i className="legend-dot cpu-dot"></i>
                CPU
              </span>

              <span>
                <i className="legend-dot memory-dot"></i>
                Memory
              </span>
            </div>

          </div>

          {/* Network chart */}
          <div className="chart-card">

            <div className="chart-header">
              <div>
                <h3>Network Activity</h3>
                <p>Inbound and outbound traffic</p>
              </div>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={networkData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.1)"
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={11}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111a2b",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="incoming"
                    stroke="#38bdf8"
                    fill="rgba(56,189,248,0.12)"
                    strokeWidth={2}
                  />

                  <Area
                    type="monotone"
                    dataKey="outgoing"
                    stroke="#a78bfa"
                    fill="rgba(167,139,250,0.08)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              <span>
                <i className="legend-dot cpu-dot"></i>
                Incoming
              </span>

              <span>
                <i className="legend-dot memory-dot"></i>
                Outgoing
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Health and alerts */}
      <div className="dashboard-bottom">

        {/* Infrastructure health */}
        <div className="health-panel">

          <div className="section-heading">
            <div>
              <p className="eyebrow">ASSET HEALTH</p>
              <h2>Infrastructure Status</h2>
            </div>
          </div>

          <div className="health-status-list">

            <div className="health-status-item">
              <span className="health-indicator healthy"></span>

              <div>
                <strong>Healthy</strong>
                <small>Operational assets</small>
              </div>

              <b>{healthData.healthy}</b>
            </div>

            <div className="health-status-item">
              <span className="health-indicator warning"></span>

              <div>
                <strong>Warning</strong>
                <small>Needs attention</small>
              </div>

              <b>{healthData.warning}</b>
            </div>

            <div className="health-status-item">
              <span className="health-indicator critical"></span>

              <div>
                <strong>Critical</strong>
                <small>Immediate attention</small>
              </div>

              <b>{healthData.critical}</b>
            </div>

          </div>

        </div>

        {/* Recent alerts */}
        <div className="alerts-panel">

          <div className="section-heading">

            <div>
              <p className="eyebrow">SECURITY EVENTS</p>
              <h2>Recent Alerts</h2>
            </div>

            <span className="alert-count">
              {dashboardData.activeAlerts} active
            </span>

          </div>

          <div className="recent-alerts">

            {recentAlerts.map((alert) => (
              <div
                className="recent-alert"
                key={alert.id}
              >

                <div
                  className={`alert-severity ${alert.severity.toLowerCase()}`}
                ></div>

                <div className="alert-content">

                  <strong>{alert.asset}</strong>

                  <p>{alert.message}</p>

                  <small>{alert.time}</small>

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

      </div>

    </div>
  )
}

export default Dashboard