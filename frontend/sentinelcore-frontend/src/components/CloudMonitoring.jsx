import { useEffect, useState, useMemo } from "react"
import { getCloudResources, getCloudHealth } from "../services/api"

const BASE_CLOUD_RESOURCES = [
  { id: "i-09f182c1a", name: "aws-prod-api-cluster-01", provider: "AWS", region: "us-east-1a", instanceType: "c6i.2xlarge", cpu: 44, memory: 68, cost: "$182/mo", status: "HEALTHY", ip: "54.210.14.92" },
  { id: "i-08a94bc72", name: "aws-prod-api-cluster-02", provider: "AWS", region: "us-east-1b", instanceType: "c6i.2xlarge", cpu: 41, memory: 65, cost: "$182/mo", status: "HEALTHY", ip: "54.210.14.93" },
  { id: "i-022dfa411", name: "aws-aurora-postgres-writer", provider: "AWS", region: "us-east-1a", instanceType: "r6g.4xlarge", cpu: 38, memory: 82, cost: "$540/mo", status: "HEALTHY", ip: "10.0.2.14" },
  { id: "gcp-vm-0149", name: "gcp-europe-telemetry-pipe", provider: "GCP", region: "europe-west3-a", instanceType: "n2-standard-8", cpu: 52, memory: 74, cost: "$290/mo", status: "HEALTHY", ip: "34.141.88.12" },
  { id: "gcp-k8s-pool", name: "gcp-europe-worker-node-01", provider: "GCP", region: "europe-west3-b", instanceType: "e2-standard-4", cpu: 35, memory: 58, cost: "$98/mo", status: "HEALTHY", ip: "34.141.88.45" },
  { id: "az-vm-9921b", name: "azure-ad-identity-sync", provider: "AZURE", region: "westus2", instanceType: "Standard_D4s_v5", cpu: 28, memory: 51, cost: "$145/mo", status: "HEALTHY", ip: "20.120.44.18" },
  { id: "az-vm-8814a", name: "azure-backup-vault-sync", provider: "AZURE", region: "westus2", instanceType: "Standard_E4s_v5", cpu: 84, memory: 89, cost: "$210/mo", status: "WARNING", ip: "20.120.44.77" },
  { id: "aws-s3-prod", name: "aws-s3-secure-audit-logs", provider: "AWS", region: "us-east-1", instanceType: "S3 Intelligent", cpu: 12, memory: 22, cost: "$340/mo", status: "HEALTHY", ip: "s3.amazonaws.com" },
]

function CloudMonitoring() {
  const [cloudResources, setCloudResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadCloudData() {
      try {
        const [resources] = await Promise.all([
          getCloudResources(),
          getCloudHealth(),
        ])
        if (Array.isArray(resources) && resources.length > 0) {
          setCloudResources(resources)
        }
      } catch (error) {
        console.warn("Using baseline cloud resources data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCloudData()
  }, [])

  // Combine backend resources with multi-cloud resources
  const allResources = useMemo(() => {
    const formattedApiResources = cloudResources.map((res, index) => ({
      id: res.id ? `cloud-${res.id}` : `res-${index + 1}`,
      name: res.name || res.resourceName || "Cloud Workload",
      provider: (res.provider || "AWS").toUpperCase(),
      region: res.region || "us-east-1",
      instanceType: res.type || "General Compute",
      cpu: Number(res.cpu) || 38,
      memory: 64,
      cost: "$140/mo",
      status: (res.status || "HEALTHY").toUpperCase(),
      ip: res.ip || "10.0.0.1",
    }))

    const combined = [...formattedApiResources]
    BASE_CLOUD_RESOURCES.forEach((item) => {
      if (!combined.some((r) => r.name === item.name)) {
        combined.push(item)
      }
    })
    return combined
  }, [cloudResources])

  const filteredResources = useMemo(() => {
    return allResources.filter((res) => {
      const matchesSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesProvider =
        selectedProvider === "ALL" || res.provider === selectedProvider

      return matchesSearch && matchesProvider
    })
  }, [allResources, searchQuery, selectedProvider])

  const totalCount = allResources.length
  const healthyCount = allResources.filter((r) => r.status === "HEALTHY").length
  const warningCount = allResources.filter((r) => r.status === "WARNING").length

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
              AWS · GCP · Azure Synchronized
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Cloud Infrastructure Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Cross-cloud resource telemetry, cost allocation, and multi-region availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
            Multi-Cloud Connected
          </span>
        </div>
      </div>

      {/* 4 Cloud KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Connected Providers */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Cloud Providers</span>
            <div className="p-1.5 rounded bg-slate-800 text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            3 Active
          </div>
          <div className="text-xs text-blue-400 mt-2 pt-2 border-t border-slate-800/60">
            AWS · Google Cloud · Microsoft Azure
          </div>
        </div>

        {/* Total Cloud Workloads */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Monitored Instances</span>
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
            <span>Healthy: {healthyCount} · Warning: {warningCount}</span>
            <span className="text-slate-400 font-mono">{Math.round((healthyCount / totalCount) * 100)}%</span>
          </div>
        </div>

        {/* Average CPU Load */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-teal-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Average Compute Load</span>
            <div className="p-1.5 rounded bg-slate-800 text-teal-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-white font-mono">41.8</span>
            <span className="text-sm font-semibold text-slate-400 font-mono">%</span>
          </div>
          <div className="text-xs text-teal-400 mt-2 pt-2 border-t border-slate-800/60">
            Across 14 regions globally
          </div>
        </div>

        {/* Monthly Cloud Spend */}
        <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-purple-500" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
            <span>Monthly Run-Rate</span>
            <div className="p-1.5 rounded bg-slate-800 text-purple-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">
            $4,820
          </div>
          <div className="text-xs text-purple-400 mt-2 pt-2 border-t border-slate-800/60">
            -4.2% optimized this billing cycle
          </div>
        </div>
      </div>

      {/* Cloud Providers Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              AWS EC2 & ECS
            </span>
            <span className="text-[10px] font-bold text-emerald-400">HEALTHY</span>
          </div>
          <div className="text-xl font-bold text-white mt-3">Amazon Web Services</div>
          <div className="text-xs text-slate-400 mt-1">us-east-1 · us-west-2</div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/60 font-mono">
            <span>Workloads: <strong>42</strong></span>
            <span>Uptime: <strong className="text-emerald-400">99.99%</strong></span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              GCP Compute Engine
            </span>
            <span className="text-[10px] font-bold text-emerald-400">HEALTHY</span>
          </div>
          <div className="text-xl font-bold text-white mt-3">Google Cloud Platform</div>
          <div className="text-xs text-slate-400 mt-1">europe-west3 (Frankfurt)</div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/60 font-mono">
            <span>Workloads: <strong>28</strong></span>
            <span>Uptime: <strong className="text-emerald-400">99.98%</strong></span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-md shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Azure Virtual Machines
            </span>
            <span className="text-[10px] font-bold text-amber-400">1 WARNING</span>
          </div>
          <div className="text-xl font-bold text-white mt-3">Microsoft Azure</div>
          <div className="text-xs text-slate-400 mt-1">westus2 (Washington)</div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/60 font-mono">
            <span>Workloads: <strong>16</strong></span>
            <span>Uptime: <strong className="text-amber-400">97.40%</strong></span>
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
            placeholder="Search cloud resources by instance ID, name, or region..."
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
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
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
              Showing {filteredResources.length} of {allResources.length} cloud instances
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
            Loading cloud instances...
          </div>
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
                  <th className="py-3 px-5">Instance ID</th>
                  <th className="py-3 px-5">Workload Name</th>
                  <th className="py-3 px-5">Region</th>
                  <th className="py-3 px-5">Machine Profile</th>
                  <th className="py-3 px-5">CPU Load</th>
                  <th className="py-3 px-5">Estimated Cost</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredResources.map((res) => {
                  const isHealthy = res.status === "HEALTHY"
                  const isAws = res.provider === "AWS"
                  const isGcp = res.provider === "GCP"

                  return (
                    <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isAws
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : isGcp
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {res.provider}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                        {res.id}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white">
                        {res.name}
                        <div className="text-[10px] font-mono text-slate-400">{res.ip}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300 text-[11px]">
                        {res.region}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {res.instanceType}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>{res.cpu}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                res.cpu > 80 ? "bg-amber-400" : "bg-blue-400"
                              }`}
                              style={{ width: `${res.cpu}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {res.cost}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isHealthy
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          Console
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

export default CloudMonitoring