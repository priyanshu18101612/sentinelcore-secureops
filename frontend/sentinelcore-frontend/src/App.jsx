import { useState } from "react"
import "./App.css"

import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import Assets from "./components/Assets"
import HealthMonitoring from "./components/HealthMonitoring"
import Alerts from "./components/Alerts"
import CloudMonitoring from "./components/CloudMonitoring"
import NetworkMonitoring from "./components/NetworkMonitoring"
import IncidentManagement from "./components/incidents/IncidentManagement"

function App() {
  // Get the currently logged-in user from localStorage, or supply a default demo user
  // so the dashboard is immediately viewable and looks alive out-of-the-box.
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("sentinelcore_current_user")
    if (savedUser) {
      try {
        return JSON.parse(savedUser)
      } catch (e) {
        console.error("Failed to parse saved user", e)
      }
    }
    // Default SecOps demo user for instant preview
    return {
      name: "Alex Vance",
      email: "alex.vance@sentinelcore.io",
      role: "Lead SecOps Engineer",
    }
  })

  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== "undefined" && window.location.pathname.toLowerCase() === "/incidents") {
      return "Incidents"
    }
    return "Dashboard"
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Time range filter for dashboard telemetry: Today / 7d / 30d
  const [timeRange, setTimeRange] = useState("Today")

  // Navigation items with clean, consistent SVG icons
  const navigationItems = [
    {
      name: "Dashboard",
      description: "Command Center",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      ),
    },
    {
      name: "Incidents",
      description: "Incident Management",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
        </svg>
      ),
    },
    {
      name: "Assets",
      description: "Asset Inventory",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      name: "Health Monitoring",
      description: "Infrastructure Health",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      name: "Alerts",
      description: "Security Alerts",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      name: "Cloud Monitoring",
      description: "Cloud Resources",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
    },
    {
      name: "Network Monitoring",
      description: "Network Status",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
    },
  ]

  const handleNavigation = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
    if (typeof window !== "undefined" && window.history) {
      if (page === "Incidents") {
        window.history.pushState({}, "", "/incidents")
      } else if (page === "Dashboard") {
        window.history.pushState({}, "", "/")
      }
    }
  }

  // Login handler
  const handleLogin = () => {
    const savedUser = localStorage.getItem("sentinelcore_current_user")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("sentinelcore_current_user")
    setCurrentUser(null)
    setActivePage("Dashboard")
  }

  // Show Login page when no user is logged in
  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1>SentinelCore</h1>
            <span>SECUREOPS PLATFORM</span>
          </div>
        </div>

        <div className="sidebar-section-title">
          MONITORING & CONTROL
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const isActive = activePage === item.name
            return (
              <button
                key={item.name}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavigation(item.name)}
              >
                <span className={`nav-icon ${isActive ? "text-blue-400" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                <span className="nav-text">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="system-indicator">
            <span className="status-dot"></span>
            <div>
              <strong>Cluster Operational</strong>
              <small>All telemetry pipelines nominal</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main application area */}
      <div className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div className="topbar-title">
            <span>INFRASTRUCTURE MONITORING</span>
            <h2>{activePage}</h2>
          </div>

          {/* Right side of topbar */}
          <div className="topbar-right">
            {/* Quick date/time range selector (Today / 7d / 30d) */}
            <div className="time-range-group" role="group" aria-label="Time range filter">
              <span className="range-icon" title="Time Horizon">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              {["Today", "7d", "30d"].map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`range-pill ${timeRange === range ? "active" : ""}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Live status with pulsing radar indicator */}
            <div className="topbar-status">
              <span className="live-beacon">
                <span className="live-ping"></span>
                <span className="live-core"></span>
              </span>
              <span>LIVE</span>
            </div>

            {/* Current user */}
            <div className="user-profile">
              <div className="user-avatar">
                {currentUser.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="user-details">
                <strong>{currentUser.name}</strong>
                <small>{currentUser.email}</small>
              </div>

              <button
                className="logout-button"
                onClick={handleLogout}
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          {activePage === "Dashboard" && (
            <Dashboard timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          )}

          {activePage === "Incidents" && <IncidentManagement />}

          {activePage === "Assets" && <Assets />}

          {activePage === "Health Monitoring" && <HealthMonitoring />}

          {activePage === "Alerts" && <Alerts />}

          {activePage === "Cloud Monitoring" && <CloudMonitoring />}

          {activePage === "Network Monitoring" && <NetworkMonitoring />}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default App