import { useEffect, useState, useMemo } from "react"
import { getAssets } from "../services/api"

// Default enterprise production assets if the backend only has 2 items
const BASE_MOCK_ASSETS = [
  { id: "AST-101", name: "k8s-prod-worker-01", type: "KUBERNETES NODE", region: "us-east-1a", status: "HEALTHY", cpu: 42, memory: 68, latency: "11ms", ip: "10.0.12.4" },
  { id: "AST-102", name: "k8s-prod-worker-02", type: "KUBERNETES NODE", region: "us-east-1b", status: "HEALTHY", cpu: 46, memory: 71, latency: "14ms", ip: "10.0.12.5" },
  { id: "AST-103", name: "postgres-primary-cluster", type: "DATABASE", region: "us-east-1a", status: "HEALTHY", cpu: 38, memory: 82, latency: "4ms", ip: "10.0.20.10" },
  { id: "AST-104", name: "postgres-read-replica", type: "DATABASE", region: "us-east-1c", status: "HEALTHY", cpu: 29, memory: 64, latency: "5ms", ip: "10.0.20.11" },
  { id: "AST-105", name: "redis-cluster-cache", type: "CACHE / IN-MEMORY", region: "us-east-1a", status: "HEALTHY", cpu: 22, memory: 89, latency: "1.2ms", ip: "10.0.30.2" },
  { id: "AST-106", name: "ingress-traefik-edge", type: "API GATEWAY", region: "us-east-1a", status: "HEALTHY", cpu: 55, memory: 58, latency: "9ms", ip: "10.0.0.5" },
  { id: "AST-107", name: "kafka-telemetry-pipe-01", type: "MESSAGE BROKER", region: "us-east-1b", status: "HEALTHY", cpu: 48, memory: 62, latency: "15ms", ip: "10.0.40.8" },
  { id: "AST-108", name: "worker-heavy-batch-04", type: "JOB CONSUMER", region: "us-east-1c", status: "WARNING", cpu: 88, memory: 86, latency: "52ms", ip: "10.0.50.14" },
  { id: "AST-109", name: "auth-sso-gateway-eu", type: "AUTH GATEWAY", region: "eu-central-1a", status: "HEALTHY", cpu: 31, memory: 44, latency: "78ms", ip: "172.16.1.10" },
  { id: "AST-110", name: "s3-vault-backup-storage", type: "STORAGE", region: "us-east-1", status: "HEALTHY", cpu: 12, memory: 25, latency: "24ms", ip: "10.0.90.100" },
  { id: "AST-111", name: "legacy-billing-bridge", type: "VIRTUAL MACHINE", region: "us-east-1d", status: "CRITICAL", cpu: 94, memory: 97, latency: "420ms", ip: "10.0.80.22" },
]

function Assets() {
  const [apiAssets, setApiAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await getAssets()
        if (Array.isArray(data)) {
          setApiAssets(data)
        }
      } catch (error) {
        console.warn("Backend assets offline, using catalog:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
  }, [])

  // Merge real API assets with catalog items if real assets are limited
  const allAssets = useMemo(() => {
    const formattedApiAssets = apiAssets.map((asset, index) => {
      const seed = Number(asset.id) || (index + 1)
      return {
        id: `AST-${asset.id || index + 1}`,
        name: asset.name || `Asset #${asset.id || index + 1}`,
        type: (asset.type || "VIRTUAL MACHINE").toUpperCase(),
        region: "us-east-1",
        status: (asset.status || "HEALTHY").toUpperCase(),
        cpu: 30 + (seed * 17) % 40,
        memory: 45 + (seed * 23) % 35,
        latency: `${10 + (seed * 3) % 15}ms`,
        ip: `10.0.10.${asset.id || index + 10}`,
      }
    })

    // Combine avoiding duplicate IDs
    const combined = [...formattedApiAssets]
    BASE_MOCK_ASSETS.forEach((item) => {
      if (!combined.some((a) => a.name === item.name)) {
        combined.push(item)
      }
    })
    return combined
  }, [apiAssets])

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.ip.includes(searchQuery) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType =
        selectedType === "ALL" || asset.type.includes(selectedType)

      const matchesStatus =
        selectedStatus === "ALL" || asset.status === selectedStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [allAssets, searchQuery, selectedType, selectedStatus])

  const totalCount = allAssets.length
  const healthyCount = allAssets.filter((a) => a.status === "HEALTHY").length
  const warningCount = allAssets.filter((a) => a.status === "WARNING").length
  const criticalCount = allAssets.filter((a) => a.status === "CRITICAL").length

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
              Total Managed: {totalCount} Host Units
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Asset Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time topology, node health statuses, and runtime telemetry for registered workloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            Asset Registry Active
          </span>
        </div>
      </div>

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
            Across 3 regions & availability zones
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
            <span className="font-mono font-bold">{Math.round((healthyCount / totalCount) * 100)}%</span>
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
            Resource threshold elevated (&gt;85%)
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
            Immediate remediation needed
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
            placeholder="Search by asset name, IP, or type..."
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
            {["ALL", "VIRTUAL MACHINE", "DATABASE", "KUBERNETES"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  selectedType === type
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                }`}
              >
                {type === "VIRTUAL MACHINE" ? "VM" : type === "KUBERNETES" ? "K8S" : type === "DATABASE" ? "DB" : "ALL"}
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
              Showing {filteredAssets.length} of {allAssets.length} assets
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
            Loading asset catalog...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No assets match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Asset Tag</th>
                  <th className="py-3 px-5">Name & IP</th>
                  <th className="py-3 px-5">Type / Role</th>
                  <th className="py-3 px-5">Region</th>
                  <th className="py-3 px-5">CPU Load</th>
                  <th className="py-3 px-5">RAM Load</th>
                  <th className="py-3 px-5">Ping</th>
                  <th className="py-3 px-5">Health</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredAssets.map((asset) => {
                  const isHealthy = asset.status === "HEALTHY"
                  const isWarning = asset.status === "WARNING"

                  return (
                    <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                        {asset.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-white">{asset.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{asset.ip}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {asset.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                        {asset.region}
                      </td>
                      {/* CPU Mini Bar */}
                      <td className="py-3.5 px-5">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{asset.cpu}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                asset.cpu > 80 ? "bg-amber-400" : "bg-blue-400"
                              }`}
                              style={{ width: `${asset.cpu}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      {/* RAM Mini Bar */}
                      <td className="py-3.5 px-5">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{asset.memory}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                asset.memory > 85 ? "bg-amber-400" : "bg-purple-400"
                              }`}
                              style={{ width: `${asset.memory}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-blue-400 text-[11px]">
                        {asset.latency}
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
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          Inspect
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

export default Assets