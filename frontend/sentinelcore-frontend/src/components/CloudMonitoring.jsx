import { useEffect, useState, useMemo, useCallback } from "react"
import { getCloudResources, getCloudHealth } from "../services/api"
import { LoadingState, ErrorState, EmptyState } from "./StatusFeedback"

function CloudMonitoring() {
  const [cloudResources, setCloudResources] = useState([])
  const [cloudHealth, setCloudHealth] = useState("HEALTHY")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchCloudData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [resources, health] = await Promise.all([
        getCloudResources(),
        getCloudHealth().catch(() => "HEALTHY"),
      ])
      if (Array.isArray(resources)) {
        setCloudResources(resources)
      } else {
        setCloudResources([])
      }
      setCloudHealth(typeof health === "string" ? health : "HEALTHY")
    } catch (err) {
      console.error("Failed to load cloud resources from backend:", err)
      setError(err)
      setCloudResources([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([
      getCloudResources(),
      getCloudHealth().catch(() => "HEALTHY"),
    ])
      .then(([resources, health]) => {
        if (!ignore) {
          setCloudResources(Array.isArray(resources) ? resources : [])
          setCloudHealth(typeof health === "string" ? health : "HEALTHY")
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load cloud resources from backend:", err)
          setError(err)
          setCloudResources([])
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const filteredResources = useMemo(() => {
    return cloudResources.filter((res) => {
      const name = res.name || ""
      const provider = (res.provider || "").toUpperCase()
      const region = res.region || ""
      const type = res.resourceType || ""
      const id = String(res.id || "")

      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        provider.toLowerCase().includes(q) ||
        region.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        id.includes(q)

      const matchesProvider =
        selectedProvider === "ALL" || provider === selectedProvider

      return matchesSearch && matchesProvider
    })
  }, [cloudResources, searchQuery, selectedProvider])

  const totalCount = cloudResources.length
  const healthyCount = cloudResources.filter(
    (r) => (r.status || "").toUpperCase() === "HEALTHY"
  ).length
  const warningCount = cloudResources.filter(
    (r) => (r.status || "").toUpperCase() === "WARNING"
  ).length
  const distinctProviders = Array.from(
    new Set(cloudResources.map((r) => (r.provider || "").toUpperCase()).filter(Boolean))
  )
  const distinctRegions = new Set(cloudResources.map((r) => r.region).filter(Boolean)).size

  // Group counts by provider
  const providerStats = useMemo(() => {
    const counts = { AWS: 0, GCP: 0, AZURE: 0 }
    cloudResources.forEach((r) => {
      const p = (r.provider || "").toUpperCase()
      if (counts[p] != null) counts[p]++
    })
    return counts
  }, [cloudResources])

  return (
    <div className="space-y-7 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-sky-400 uppercase">
              MULTI-CLOUD TOPOLOGY
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Active: {totalCount} Registered Resources
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Cloud Infrastructure Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Cross-cloud resource telemetry and multi-region availability directly from the Spring Boot API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              cloudHealth === "HEALTHY"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cloudHealth === "HEALTHY"
                  ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  : "bg-rose-400 shadow-[0_0_6px_#f43f5e]"
              }`}
            />
            Global Cloud: {cloudHealth}
          </span>
          <button
            onClick={fetchCloudData}
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
          title="Could Not Connect to Cloud Resources API"
          message="Failed to fetch cloud records from GET /api/cloud/resources. Ensure Spring Boot and PostgreSQL are active."
          error={error}
          onRetry={fetchCloudData}
        />
      )}

      {/* 4 Cloud KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Connected Providers */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Active Providers</span>
            <div className="p-1.5 rounded bg-slate-800 text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {distinctProviders.length}
          </div>
          <div className="text-xs text-blue-400 mt-2 pt-2 border-t border-slate-800/60">
            {distinctProviders.length > 0 ? distinctProviders.join(" · ") : "No providers registered"}
          </div>
        </div>

        {/* Total Cloud Workloads */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Registered Instances</span>
            <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {totalCount}
          </div>
          <div className="text-xs text-emerald-400 mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span>Healthy: {healthyCount}</span>
            <span className="text-slate-400 font-mono">
              {totalCount > 0 ? `${Math.round((healthyCount / totalCount) * 100)}%` : "0%"}
            </span>
          </div>
        </div>

        {/* Regions */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-teal-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Distinct Regions</span>
            <div className="p-1.5 rounded bg-slate-800 text-teal-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            {distinctRegions}
          </div>
          <div className="text-xs text-teal-400 mt-2 pt-2 border-t border-slate-800/60">
            Availability zones configured
          </div>
        </div>

        {/* Warning / Degraded */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-amber-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Warning / Attention</span>
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
            Degraded cloud workloads
          </div>
        </div>
      </div>

      {/* Cloud Providers Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              AWS Cloud
            </span>
            <span className="text-xs font-mono text-slate-400">PostgreSQL</span>
          </div>
          <div className="text-xl font-bold text-white mt-3">Amazon Web Services</div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800/60 font-mono">
            <span>Registered Workloads:</span>
            <strong className="text-white text-sm">{providerStats.AWS}</strong>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              GCP Cloud
            </span>
            <span className="text-xs font-mono text-slate-400">PostgreSQL</span>
          </div>
          <div className="text-xl font-bold text-white mt-3">Google Cloud Platform</div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800/60 font-mono">
            <span>Registered Workloads:</span>
            <strong className="text-white text-sm">{providerStats.GCP}</strong>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Azure Cloud
            </span>
            <span className="text-xs font-mono text-slate-400">PostgreSQL</span>
          </div>
          <div className="text-xl font-bold text-white mt-3">Microsoft Azure</div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800/60 font-mono">
            <span>Registered Workloads:</span>
            <strong className="text-white text-sm">{providerStats.AZURE}</strong>
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
            placeholder="Search cloud resources by name, type, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Provider:</span>
          {["ALL", "AWS", "GCP", "AZURE"].map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvider(prov)}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                selectedProvider === prov
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60"
              }`}
            >
              {prov}
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Workloads Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Cloud Compute & Storage Instances
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredResources.length} of {cloudResources.length} live database records
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
          <LoadingState message="Querying PostgreSQL cloud_resources table via Spring Boot..." />
        ) : cloudResources.length === 0 ? (
          <EmptyState
            title="No Cloud Resources Found"
            message="No cloud resources have been registered in the database. When workloads are provisioned in the cloud_resources table, they will appear here."
            actionText="Refresh Cloud Inventory"
            onAction={fetchCloudData}
          />
        ) : filteredResources.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No cloud instances found matching the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Provider</th>
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Workload Name</th>
                  <th className="py-3 px-5">Resource Type</th>
                  <th className="py-3 px-5">Region</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredResources.map((res) => {
                  const status = (res.status || "HEALTHY").toUpperCase()
                  const isHealthy = status === "HEALTHY"
                  const isWarning = status === "WARNING"
                  const prov = (res.provider || "AWS").toUpperCase()

                  return (
                    <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            prov === "AWS"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : prov === "GCP"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {prov}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                        #{res.id}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white">
                        {res.name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {res.resourceType || "COMPUTE"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                        {res.region || "—"}
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
                        {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : "—"}
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

export default CloudMonitoring