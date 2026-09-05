import { useEffect, useState, useMemo, useCallback } from "react"
import { getAssets, getAllInfrastructureMetrics } from "../services/api"
import { LoadingState, ErrorState, EmptyState } from "./StatusFeedback"

function Assets() {
  const [assets, setAssets] = useState([])
  const [metricsMap, setMetricsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [assetsData, metricsData] = await Promise.all([
        getAssets(),
        getAllInfrastructureMetrics().catch(() => []),
      ])

      if (Array.isArray(assetsData)) {
        setAssets(assetsData)
      } else {
        setAssets([])
      }

      // Map latest metric by assetId
      if (Array.isArray(metricsData) && metricsData.length > 0) {
        const map = {}
        metricsData.forEach((m) => {
          if (m.assetId != null) {
            map[m.assetId] = m
          }
        })
        setMetricsMap(map)
      } else {
        setMetricsMap({})
      }
    } catch (err) {
      console.error("Failed to load assets from backend:", err)
      setError(err)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([
      getAssets(),
      getAllInfrastructureMetrics().catch(() => []),
    ])
      .then(([assetsData, metricsData]) => {
        if (!ignore) {
          setAssets(Array.isArray(assetsData) ? assetsData : [])
          if (Array.isArray(metricsData) && metricsData.length > 0) {
            const map = {}
            metricsData.forEach((m) => {
              if (m.assetId != null) {
                map[m.assetId] = m
              }
            })
            setMetricsMap(map)
          } else {
            setMetricsMap({})
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load assets from backend:", err)
          setError(err)
          setAssets([])
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const name = asset.name || ""
      const type = asset.type || ""
      const ip = asset.ipAddress || ""
      const location = asset.location || ""
      const status = (asset.status || "HEALTHY").toUpperCase()
      const id = String(asset.id || "")

      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        ip.toLowerCase().includes(q) ||
        location.toLowerCase().includes(q) ||
        id.includes(q)

      const matchesType =
        selectedType === "ALL" || type.toUpperCase().includes(selectedType)

      const matchesStatus =
        selectedStatus === "ALL" || status === selectedStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [assets, searchQuery, selectedType, selectedStatus])

  const totalCount = assets.length
  const healthyCount = assets.filter((a) => (a.status || "").toUpperCase() === "HEALTHY").length
  const warningCount = assets.filter((a) => (a.status || "").toUpperCase() === "WARNING").length
  const criticalCount = assets.filter(
    (a) => (a.status || "").toUpperCase() === "CRITICAL" || (a.status || "").toUpperCase() === "UNHEALTHY"
  ).length

  return (
    <div className="space-y-7 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
              INVENTORY MANAGEMENT
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Active: {totalCount} Host Units
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Asset Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time topology, node health statuses, and runtime telemetry directly from the Spring Boot API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssets}
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
          title="Could Not Connect to Asset Registry"
          message="Failed to fetch assets from GET /api/assets. Ensure the backend and database are active."
          error={error}
          onRetry={fetchAssets}
        />
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Assets */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Total Assets</span>
            <div className="p-1.5 rounded bg-slate-800 text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {totalCount}
          </div>
          <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
            Registered in PostgreSQL database
          </div>
        </div>

        {/* Healthy Assets */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Healthy Workloads</span>
            <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {healthyCount}
          </div>
          <div className="text-xs text-emerald-400 mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span>Operating nominally</span>
            <span className="font-mono font-bold">
              {totalCount > 0 ? `${Math.round((healthyCount / totalCount) * 100)}%` : "0%"}
            </span>
          </div>
        </div>

        {/* Warning / Degraded */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-amber-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Degraded / Warning</span>
            <div className="p-1.5 rounded bg-slate-800 text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {warningCount}
          </div>
          <div className="text-xs text-amber-400 mt-2 pt-2 border-t border-slate-800/60">
            Assets with warning state
          </div>
        </div>

        {/* Critical */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-rose-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Critical / Offline</span>
            <div className="p-1.5 rounded bg-slate-800 text-rose-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {criticalCount}
          </div>
          <div className="text-xs text-rose-400 mt-2 pt-2 border-t border-slate-800/60">
            Critical or unhealthy state
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md shadow-black/20">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, IP, location, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status & Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Status:</span>
            {["ALL", "HEALTHY", "WARNING", "CRITICAL"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedStatus === status
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-3">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Type:</span>
            {["ALL", "SERVER", "DATABASE", "VIRTUAL MACHINE", "CONTAINER"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  selectedType === type
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Inventory Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Registered Infrastructure Assets
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredAssets.length} of {assets.length} live database records
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
          <LoadingState message="Querying PostgreSQL assets table via Spring Boot..." />
        ) : assets.length === 0 ? (
          <EmptyState
            title="No Assets Found"
            message="No assets have been created in the database. Use POST /api/assets to register your first asset."
            actionText="Refresh Catalog"
            onAction={fetchAssets}
          />
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No assets match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Asset Name</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">IP Address</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Live CPU Load</th>
                  <th className="py-3 px-5">Live RAM Load</th>
                  <th className="py-3 px-5">Health</th>
                  <th className="py-3 px-5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredAssets.map((asset) => {
                  const status = (asset.status || "HEALTHY").toUpperCase()
                  const isHealthy = status === "HEALTHY"
                  const isWarning = status === "WARNING"
                  const metric = metricsMap[asset.id]

                  return (
                    <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                        #{asset.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-white">{asset.name}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {asset.type || "SERVER"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300 text-[11px]">
                        {asset.ipAddress || "—"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 text-[11px]">
                        {asset.location || "—"}
                      </td>
                      {/* Real CPU Metric from backend if recorded */}
                      <td className="py-3.5 px-5">
                        {metric && metric.cpuUsage != null ? (
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>{metric.cpuUsage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  metric.cpuUsage > 80 ? "bg-amber-400" : "bg-blue-400"
                                }`}
                                style={{ width: `${Math.min(100, metric.cpuUsage)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      {/* Real RAM Metric from backend if recorded */}
                      <td className="py-3.5 px-5">
                        {metric && metric.memoryUsage != null ? (
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>{metric.memoryUsage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  metric.memoryUsage > 85 ? "bg-amber-400" : "bg-purple-400"
                                }`}
                                style={{ width: `${Math.min(100, metric.memoryUsage)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
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
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : "—"}
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

export default Assets