import { useEffect, useState, useMemo, useCallback } from "react"
import { getAlerts, acknowledgeAlert, detectAnomalies } from "../services/api"
import { LoadingState, ErrorState, EmptyState } from "./StatusFeedback"

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("ALL")

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAlerts()
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load alerts from backend:", err)
      setError(err)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    getAlerts()
      .then((data) => {
        if (!ignore) {
          setAlerts(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load alerts from backend:", err)
          setError(err)
          setAlerts([])
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const handleAcknowledge = async (id) => {
    setActionLoading(id)
    try {
      const updated = await acknowledgeAlert(id)
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated, status: "ACKNOWLEDGED" } : a))
      )
    } catch (err) {
      console.error("Failed to acknowledge alert:", err)
      alert(`Could not acknowledge alert: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunDetection = async () => {
    setLoading(true)
    try {
      await detectAnomalies()
      await fetchAlerts()
    } catch (err) {
      console.error("Failed to run anomaly detection:", err)
      setError(err)
      setLoading(false)
    }
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const message = alert.message || ""
      const category = alert.alertType || ""
      const asset = alert.assetId != null ? `Asset #${alert.assetId}` : "System"
      const id = String(alert.id || "")
      const severity = (alert.severity || "MEDIUM").toUpperCase()
      const status = (alert.status || "OPEN").toUpperCase()

      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        message.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        asset.toLowerCase().includes(q) ||
        id.includes(q)

      const matchesSeverity =
        selectedSeverity === "ALL" ||
        (selectedSeverity === "ACKNOWLEDGED"
          ? status === "ACKNOWLEDGED"
          : selectedSeverity === "RESOLVED"
          ? status === "RESOLVED"
          : severity === selectedSeverity && status !== "RESOLVED")

      return matchesSearch && matchesSeverity
    })
  }, [alerts, searchQuery, selectedSeverity])

  const activeCount = alerts.filter(
    (a) => (a.status || "").toUpperCase() !== "RESOLVED"
  ).length
  const criticalCount = alerts.filter(
    (a) =>
      (a.severity || "").toUpperCase() === "CRITICAL" &&
      (a.status || "").toUpperCase() !== "RESOLVED"
  ).length
  const highCount = alerts.filter(
    (a) =>
      (a.severity || "").toUpperCase() === "HIGH" &&
      (a.status || "").toUpperCase() !== "RESOLVED"
  ).length
  const resolvedCount = alerts.filter(
    (a) =>
      (a.status || "").toUpperCase() === "RESOLVED" ||
      (a.status || "").toUpperCase() === "ACKNOWLEDGED"
  ).length

  return (
    <div className="space-y-7 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase">
              SECURITY OPERATIONS CENTER
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Active Events: {alerts.length} Records
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Infrastructure Security Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time intrusion detection, anomaly threshold violations, and incident response tracking from Spring Boot API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunDetection}
            disabled={loading}
            title="Trigger anomaly detection on current infrastructure metrics in backend"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Trigger Anomaly Scan
          </button>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Could Not Connect to Security Alerts Engine"
          message="Failed to fetch incidents from GET /api/alerts. Ensure Spring Boot and PostgreSQL are active."
          error={error}
          onRetry={fetchAlerts}
        />
      )}

      {/* 4 Alert Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Alerts */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Total Active Alerts</span>
            <div className="p-1.5 rounded bg-slate-800 text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {activeCount}
          </div>
          <div className="text-xs text-blue-400 mt-2 pt-2 border-t border-slate-800/60">
            Requiring SecOps triage
          </div>
        </div>

        {/* Critical Severity */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-rose-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Critical Severity</span>
            <div className="p-1.5 rounded bg-slate-800 text-rose-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {criticalCount}
          </div>
          <div className="text-xs text-rose-400 mt-2 pt-2 border-t border-slate-800/60">
            Immediate mitigation SLA (&lt;15m)
          </div>
        </div>

        {/* High Severity */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-orange-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>High Severity</span>
            <div className="p-1.5 rounded bg-slate-800 text-orange-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {highCount}
          </div>
          <div className="text-xs text-orange-400 mt-2 pt-2 border-t border-slate-800/60">
            Action required within 1 hour
          </div>
        </div>

        {/* Resolved / Acknowledged */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Remediated / Acknowledged</span>
            <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {resolvedCount}
          </div>
          <div className="text-xs text-emerald-400 mt-2 pt-2 border-t border-slate-800/60">
            Acknowledged or closed events
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md shadow-black/20">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search alerts by incident ID, message, or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Severity:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "ACKNOWLEDGED", "RESOLVED"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedSeverity === sev
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Security & Infrastructure Incidents
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredAlerts.length} of {alerts.length} live database records
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Reset search
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState message="Querying PostgreSQL alerts table via Spring Boot..." />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No Security Incidents Found"
            message="No alerts have been recorded in the database. When threshold violations occur or when anomaly scans run, incidents appear here."
            actionText="Run Anomaly Scan Now"
            onAction={handleRunDetection}
          />
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No alerts found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Alert ID</th>
                  <th className="py-3 px-5">Type / Category</th>
                  <th className="py-3 px-5">Asset</th>
                  <th className="py-3 px-5">Message</th>
                  <th className="py-3 px-5">Detected At</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredAlerts.map((alert) => {
                  const severity = (alert.severity || "MEDIUM").toUpperCase()
                  const status = (alert.status || "OPEN").toUpperCase()
                  const isCrit = severity === "CRITICAL"
                  const isHigh = severity === "HIGH"
                  const isMed = severity === "MEDIUM"
                  const isAck = status === "ACKNOWLEDGED" || status === "RESOLVED"

                  return (
                    <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isCrit
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : isHigh
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : isMed
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-blue-400 font-bold text-[11px]">
                        #{alert.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {alert.alertType || "SYSTEM_ALERT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {alert.assetId != null ? `Asset #${alert.assetId}` : "System"}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-100 max-w-md">
                        {alert.message}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 text-[11px] whitespace-nowrap">
                        {alert.createdAt
                          ? new Date(alert.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : status === "ACKNOWLEDGED"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {isAck ? (
                          <span className="text-[11px] text-slate-500 italic">
                            Acknowledged
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={actionLoading === alert.id}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 hover:border-blue-500/40 transition-colors cursor-pointer"
                          >
                            {actionLoading === alert.id ? "Saving..." : "Acknowledge"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Alerts