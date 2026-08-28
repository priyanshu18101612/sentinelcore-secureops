import { useState } from "react"
import "./App.css"

import Dashboard from "./components/Dashboard"
import Assets from "./components/Assets"
import HealthMonitoring from "./components/HealthMonitoring"
import Alerts from "./components/Alerts"
import CloudMonitoring from "./components/CloudMonitoring"
import NetworkMonitoring from "./components/NetworkMonitoring"

function App() {
  const [activePage, setActivePage] = useState("Dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    {
      name: "Dashboard",
      icon: "◈",
      description: "Overview",
    },
    {
      name: "Assets",
      icon: "▣",
      description: "Asset Inventory",
    },
    {
      name: "Health Monitoring",
      icon: "◉",
      description: "Infrastructure Health",
    },
    {
      name: "Alerts",
      icon: "⚠",
      description: "Security Alerts",
    },
    {
      name: "Cloud Monitoring",
      icon: "☁",
      description: "Cloud Resources",
    },
    {
      name: "Network Monitoring",
      icon: "⌁",
      description: "Network Status",
    },
  ]

  const handleNavigation = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">S</div>

          <div>
            <h1>SentinelCore</h1>
            <span>SecureOps</span>
          </div>
        </div>

        <div className="sidebar-section-title">
          MONITORING
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => handleNavigation(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>

              <span className="nav-text">
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-indicator">
            <span className="status-dot"></span>

            <div>
              <strong>System Operational</strong>
              <small>All services online</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main application */}
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

          <div className="topbar-status">
            <span className="status-dot"></span>
            <span>LIVE</span>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          {activePage === "Dashboard" && <Dashboard />}

          {activePage === "Assets" && <Assets />}

          {activePage === "Health Monitoring" && (
            <HealthMonitoring />
          )}

          {activePage === "Alerts" && <Alerts />}

          {activePage === "Cloud Monitoring" && (
            <CloudMonitoring />
          )}

          {activePage === "Network Monitoring" && (
            <NetworkMonitoring />
          )}
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