import { useEffect, useState, useMemo, useCallback } from "react"
import { getAssets, getHealth, getSla } from "../services/api"
import { LoadingState, ErrorState, EmptyState } from "./StatusFeedback"

function HealthMonitoring() {
  const [healthChecks, setHealthChecks] = useState([])
  const [slaData, setSlaData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  const fetchHealthData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [assets, sla] = await Promise.all([
        getAssets(),
        getSla().catch(() => null),
      ])

      setSlaData(sla)

      if (Array.isArray(assets) && assets.length > 0) {
        const results = await Promise.all(
          assets.map(async (asset) => {
            try {
              const health = await getHealth(asset.id)
              return {
                id: asset.id,
                name: asset.name,
                type: asset.type || "WORKLOAD",
                ip: asset.ipAddress || "—",
                status: (health?.status || asset.status || "HEALTHY").toUpperCase(),
                checkedAt: health?.checkedAt || "Recent",
              }
            } catch {
              return {
                id: asset.id,
                name: asset.name,
                type: asset.type || "WORKLOAD",
                ip: asset.ipAddress || "—",
                status: (asset.status || "HEALTHY").toUpperCase(),
                checkedAt: "Recent",
              }
            }
          })
        )
        setHealthChecks(results)
      } else {
        setHealthChecks([])
      }
    } catch (err) {
      console.error("Failed to load health telemetry from backend:", err)
      setError(err)
      setHealthChecks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([
      getAssets(),
      getSla().catch(() => null),
    ])
      .then(async ([assets, sla]) => {
        if (ignore) return
        setSlaData(sla)
        if (Array.isArray(assets) && assets.length > 0) {
          const results = await Promise.all(
            assets.map(async (asset) => {
              try {
                const health = await getHealth(asset.id)
                return {
                  id: asset.id,
                  name: asset.name,
                  type: asset.type || "WORKLOAD",
                  ip: asset.ipAddress || "—",
                  status: (health?.status || asset.status || "HEALTHY").toUpperCase(),
                  checkedAt: health?.checkedAt || "Recent",
                }
              } catch {
                return {
                  id: asset.id,
                  name: asset.name,
                  type: asset.type || "WORKLOAD",
                  ip: asset.ipAddress || "—",
                  status: (asset.status || "HEALTHY").toUpperCase(),
                  checkedAt: "Recent",
                }
              }
            })
          )
          if (!ignore) {
            setHealthChecks(results)
            setLoading(false)
          }
        } else {
          if (!ignore) {
            setHealthChecks([])
            setLoading(false)
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load health telemetry from backend:", err)
          setError(err)
          setHealthChecks([])
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const filteredChecks = useMemo(() => {
    if (selectedStatus === "ALL") return healthChecks
    return healthChecks.filter((c) => c.status === selectedStatus)
  }, [healthChecks, selectedStatus])

  const totalChecks = healthChecks.length
  const healthyChecks = healthChecks.filter((c) => c.status === "HEALTHY").length
  const warningChecks = healthChecks.filter((c) => c.status === "WARNING").length
  const criticalChecks = healthChecks.filter(
    (c) => c.status === "CRITICAL" || c.status === "UNHEALTHY"
  ).length

  const healthPercent = totalChecks > 0 ? Math.round((healthyChecks / totalChecks) * 100) : 0
  const complianceScore = slaData?.slaPercentage != null ? `${slaData.slaPercentage}%` : `${healthPercent}%`

  return (
    <div className="space-y-7 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
              CLUSTER AVAILABILITY
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Spring Boot Probes: {totalChecks} Active Targets
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Infrastructure Health
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Asset uptime verification, health statuses, and SLA compliance calculated live from PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealthData}
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
          title="Could Not Connect to Health Check Service"
          message="Failed to fetch assets or asset health from Spring Boot. Ensure PostgreSQL is active."
          error={error}
          onRetry={fetchHealthData}
        />
      )}

      {/* 4 Health Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Overall Health Score */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Overall Health Score</span>
            <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-white font-mono">{complianceScore}</span>
          </div>
          <div className="text-xs text-emerald-400 mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span>SLA Status</span>
            <span className="text-slate-400 font-mono">
              {slaData?.compliant ? "COMPLIANT" : "MONITORING"}
            </span>
          </div>
        </div>

        {/* Operational Nodes */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Operational Nodes</span>
            <div className="p-1.5 rounded bg-slate-800 text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {healthyChecks} / {totalChecks}
          </div>
          <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            Healthy infrastructure targets
          </div>
        </div>

        {/* Warning / Degraded */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-amber-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Degraded Targets</span>
            <div className="p-1.5 rounded bg-slate-800 text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {warningChecks}
          </div>
          <div className="text-xs text-amber-400 mt-2 pt-2 border-t border-slate-800/60">
            Assets requiring attention
          </div>
        </div>

        {/* Critical / Unhealthy */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-rose-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Critical / Unhealthy</span>
            <div className="p-1.5 rounded bg-slate-800 text-rose-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {criticalChecks}
          </div>
          <div className="text-xs text-rose-400 mt-2 pt-2 border-t border-slate-800/60">
            Unhealthy health probe returns
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between shadow-md shadow-black/20">
        <div className="text-xs text-slate-400">
          Filter health checks by operational state:
        </div>

        <div className="flex items-center gap-2 text-xs">
          {["ALL", "HEALTHY", "WARNING", "UNHEALTHY"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedStatus === status
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Health Probes Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Live Health Verification Probes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredChecks.length} of {healthChecks.length} asset health records
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Querying Spring Boot health probes..." />
        ) : healthChecks.length === 0 ? (
          <EmptyState
            title="No Monitored Assets Available"
            message="No assets are present in the PostgreSQL database to perform health checks against. Register an asset to initiate monitoring."
            actionText="Refresh Health Probes"
            onAction={fetchHealthData}
          />
        ) : filteredChecks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No health probes match the specified filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Target Asset</th>
                  <th className="py-3 px-5">Target ID</th>
                  <th className="py-3 px-5">Workload Type</th>
                  <th className="py-3 px-5">Endpoint / IP</th>
                  <th className="py-3 px-5">Health Status</th>
                  <th className="py-3 px-5">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredChecks.map((check) => {
                  const isHealthy = check.status === "HEALTHY"
                  const isWarning = check.status === "WARNING"

                  return (
                    <tr key={check.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white">
                        {check.name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                        #{check.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {check.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {check.ip}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isHealthy
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : isWarning
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                          }`}
                        >
                          {check.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {check.checkedAt}
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

export default HealthMonitoring