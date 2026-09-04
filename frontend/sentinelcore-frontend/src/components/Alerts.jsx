import { useEffect, useState, useMemo } from "react"
import { getAlerts } from "../services/api"

const BASE_MOCK_ALERTS = [
  { id: "SEC-9041", severity: "CRITICAL", asset: "ingress-traefik-edge", category: "DDoS Mitigation", message: "DDoS rate burst detected: 14,200 req/s from AS-13335 blocked by rate limiter", time: "4m ago", status: "OPEN" },
  { id: "SEC-9038", severity: "CRITICAL", asset: "auth-gateway-svc", category: "Brute Force", message: "SSH credential stuffing attempt: 48 failed attempts from IP 194.26.29.112 blocked", time: "12m ago", status: "INVESTIGATING" },
  { id: "INF-8812", severity: "HIGH", asset: "worker-heavy-batch-04", category: "Memory Leak", message: "Heap threshold exceeded 85% on batch thread pool worker queue", time: "18m ago", status: "INVESTIGATING" },
  { id: "SEC-8740", severity: "HIGH", asset: "auth-gateway-svc", category: "Auth Anomaly", message: "Suspicious JWT signature mismatch detected from unauthorized external origin", time: "42m ago", status: "INVESTIGATING" },
  { id: "INF-8692", severity: "HIGH", asset: "postgres-primary-cluster", category: "Disk Pressure", message: "WAL archive directory disk usage reached 82% capacity threshold", time: "55m ago", status: "OPEN" },
  { id: "INF-8619", severity: "MEDIUM", asset: "k8s-prod-cluster-01", category: "Autoscaling Event", message: "HPA reached max replica limit (16 pods) during morning traffic surge", time: "1h ago", status: "OPEN" },
  { id: "INF-8605", severity: "MEDIUM", asset: "redis-cluster-cache", category: "Cache Eviction", message: "Key eviction rate spike: 1,420 keys evicted/sec under volatile memory policy", time: "1h 20m ago", status: "OPEN" },
  { id: "INF-8580", severity: "MEDIUM", asset: "kafka-telemetry-pipe-01", category: "Consumer Lag", message: "Partition 4 consumer group lag exceeded 10,000 offset threshold", time: "1h 45m ago", status: "OPEN" },
  { id: "INF-8550", severity: "LOW", asset: "postgres-primary-cluster", category: "Snapshot Verified", message: "Automated incremental backup snapshot verified and uploaded to encrypted S3 bucket", time: "2h ago", status: "RESOLVED" },
  { id: "SEC-8490", severity: "LOW", asset: "ingress-traefik-edge", category: "TLS Renewal", message: "TLS certificate auto-renewed successfully for api.sentinelcore.io", time: "3h ago", status: "RESOLVED" },
]

function Alerts() {
  const [apiAlerts, setApiAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("ALL")

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await getAlerts()
        if (Array.isArray(data)) {
          setApiAlerts(data)
        }
      } catch (error) {
        console.warn("Using baseline security alerts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [])

  // Combine backend alerts with rich security events
  const allAlerts = useMemo(() => {
    const formattedApiAlerts = apiAlerts.map((alert) => ({
      id: `SEC-${alert.id}`,
      severity: (alert.severity || "MEDIUM").toUpperCase(),
      asset: `Asset #${alert.assetId || "system"}`,
      category: alert.alertType || "Threshold Violation",
      message: alert.message || "Automated infrastructure alert generated.",
      time: "Recent",
      status: (alert.status || "OPEN").toUpperCase(),
    }))

    const combined = [...formattedApiAlerts]
    BASE_MOCK_ALERTS.forEach((item) => {
      if (!combined.some((a) => a.id === item.id)) {
        combined.push(item)
      }
    })
    return combined
  }, [apiAlerts])

  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((alert) => {
      const matchesSearch =
        alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesSeverity =
        selectedSeverity === "ALL" ||
        (selectedSeverity === "RESOLVED"
          ? alert.status === "RESOLVED"
          : alert.severity === selectedSeverity && alert.status !== "RESOLVED")

      return matchesSearch && matchesSeverity
    })
  }, [allAlerts, searchQuery, selectedSeverity])

  const activeCount = allAlerts.filter((a) => a.status !== "RESOLVED").length
  const criticalCount = allAlerts.filter((a) => a.severity === "CRITICAL" && a.status !== "RESOLVED").length
  const highCount = allAlerts.filter((a) => a.severity === "HIGH" && a.status !== "RESOLVED").length
  const resolvedCount = allAlerts.filter((a) => a.status === "RESOLVED").length

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
              Detection Engine: Continuous Machine Learning
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Infrastructure Security Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time intrusion detection, anomaly threshold violations, and incident response tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
            {activeCount} Active Threats
          </span>
        </div>
      </div>

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

        {/* Resolved */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Auto-Remediated / Resolved</span>
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
            Verified in current window
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
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "RESOLVED"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
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
              Showing {filteredAlerts.length} events
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-blue-400 hover:underline"
            >
              Reset search
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading incident feed...
          </div>
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
                  <th className="py-3 px-5">Incident Tag</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Target Workload</th>
                  <th className="py-3 px-5">Summary Message</th>
                  <th className="py-3 px-5">Detected</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredAlerts.map((alert) => {
                  const isCrit = alert.severity === "CRITICAL"
                  const isHigh = alert.severity === "HIGH"
                  const isMed = alert.severity === "MEDIUM"

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
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-blue-400 font-bold text-[11px]">
                        {alert.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {alert.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {alert.asset}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-100 max-w-md">
                        {alert.message}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 text-[11px] whitespace-nowrap">
                        {alert.time}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            alert.status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : alert.status === "INVESTIGATING"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          Investigate
                        </button>
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