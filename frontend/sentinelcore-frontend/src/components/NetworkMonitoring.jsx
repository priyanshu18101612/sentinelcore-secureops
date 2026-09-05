import { useEffect, useState, useMemo, useCallback } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { getNetworkStatus, getNetworkMetrics } from "../services/api"
import { LoadingState, ErrorState, EmptyState } from "./StatusFeedback"

function NetworkMonitoring() {
  const [networkStatus, setNetworkStatus] = useState("UP")
  const [networkMetrics, setNetworkMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchNetworkData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [status, metrics] = await Promise.all([
        getNetworkStatus().catch(() => "UP"),
        getNetworkMetrics(),
      ])

      setNetworkStatus(typeof status === "string" ? status : "UP")
      if (Array.isArray(metrics)) {
        setNetworkMetrics(metrics)
      } else {
        setNetworkMetrics([])
      }
    } catch (err) {
      console.error("Failed to load network telemetry from backend:", err)
      setError(err)
      setNetworkMetrics([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    Promise.all([
      getNetworkStatus().catch(() => "UP"),
      getNetworkMetrics(),
    ])
      .then(([status, metrics]) => {
        if (!ignore) {
          setNetworkStatus(typeof status === "string" ? status : "UP")
          setNetworkMetrics(Array.isArray(metrics) ? metrics : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load network telemetry from backend:", err)
          setError(err)
          setNetworkMetrics([])
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  // Latest snapshot metrics from real backend data
  const latestMetric = useMemo(() => {
    if (networkMetrics.length === 0) return null
    return networkMetrics[networkMetrics.length - 1]
  }, [networkMetrics])

  const incomingTraffic = latestMetric?.networkIn != null ? Number(latestMetric.networkIn) : null
  const outgoingTraffic = latestMetric?.networkOut != null ? Number(latestMetric.networkOut) : null
  const latency = latestMetric?.latency != null ? Number(latestMetric.latency) : null
  const packetLoss = latestMetric?.packetLoss != null ? Number(latestMetric.packetLoss) : null
  const activeInterfaceName = latestMetric?.networkName || "—"

  // Time-series chart points derived strictly from backend timestamps & throughput
  const chartData = useMemo(() => {
    if (networkMetrics.length === 0) return []
    return networkMetrics.map((m, index) => {
      let timeLabel = `#${index + 1}`
      if (m.timestamp) {
        try {
          const d = new Date(m.timestamp)
          timeLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        } catch {
          timeLabel = String(m.timestamp)
        }
      }
      return {
        time: timeLabel,
        inbound: Number(m.networkIn) || 0,
        outbound: Number(m.networkOut) || 0,
        latency: Number(m.latency) || 0,
      }
    })
  }, [networkMetrics])

  // Filtered network metrics list
  const filteredMetrics = useMemo(() => {
    if (!searchQuery) return networkMetrics
    const q = searchQuery.toLowerCase()
    return networkMetrics.filter((m) => {
      const name = m.networkName || ""
      const status = m.status || ""
      const id = String(m.id || "")
      return name.toLowerCase().includes(q) || status.toLowerCase().includes(q) || id.includes(q)
    })
  }, [networkMetrics, searchQuery])

  // Telemetry summaries from real records
  const peakInbound = useMemo(() => {
    if (networkMetrics.length === 0) return 0
    return Math.max(...networkMetrics.map((m) => Number(m.networkIn) || 0))
  }, [networkMetrics])

  const peakOutbound = useMemo(() => {
    if (networkMetrics.length === 0) return 0
    return Math.max(...networkMetrics.map((m) => Number(m.networkOut) || 0))
  }, [networkMetrics])

  const avgLatency = useMemo(() => {
    if (networkMetrics.length === 0) return 0
    const sum = networkMetrics.reduce((acc, m) => acc + (Number(m.latency) || 0), 0)
    return (sum / networkMetrics.length).toFixed(1)
  }, [networkMetrics])

  const isUp = networkStatus === "UP"

  return (
    <div className="space-y-7 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
              NETWORK OPERATIONS CENTER
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Telemetry: {networkMetrics.length} Samples
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Network Status & Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time ingress/egress flow rates, latency probes, and packet telemetry from Spring Boot API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              isUp
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isUp
                  ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  : "bg-rose-400 shadow-[0_0_6px_#f43f5e]"
              }`}
            />
            Network Backbone: {networkStatus}
          </div>

          <button
            onClick={fetchNetworkData}
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
          title="Could Not Connect to Network Telemetry Service"
          message="Failed to fetch network status or metrics from GET /api/network/*. Ensure Spring Boot is running."
          error={error}
          onRetry={fetchNetworkData}
        />
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Inbound Bandwidth */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ingress Rate (RX)
            </span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {incomingTraffic != null ? incomingTraffic : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-400">Mbps</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Latest recorded ingress</span>
            <span className="text-slate-400 font-mono">Peak: {peakInbound} Mbps</span>
          </div>
        </div>

        {/* Card 2: Outbound Bandwidth */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Egress Rate (TX)
            </span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {outgoingTraffic != null ? outgoingTraffic : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-400">Mbps</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Latest recorded egress</span>
            <span className="text-slate-400 font-mono">Peak: {peakOutbound} Mbps</span>
          </div>
        </div>

        {/* Card 3: Roundtrip Latency */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Roundtrip Latency
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {latency != null ? latency : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-400">ms</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-emerald-400 font-medium">Avg: {avgLatency} ms</span>
            <span className="text-slate-400 font-mono">{networkMetrics.length} probes</span>
          </div>
        </div>

        {/* Card 4: Packet Loss */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Packet Loss
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {packetLoss != null ? `${packetLoss}%` : "—"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Active Segment: {activeInterfaceName}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Traffic Throughput AreaChart & Telemetry Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real Ingress / Egress Throughput Chart */}
        <div className="lg:col-span-8 bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Throughput Telemetry
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingress (RX) and egress (TX) flow rates plotted from PostgreSQL network_metrics
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-500"></span>
                <span className="text-slate-300">Ingress (Mbps)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500"></span>
                <span className="text-slate-300">Egress (Mbps)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span>No network throughput telemetry points recorded in database.</span>
                <span className="text-slate-600 text-[11px] mt-1">Populate network_metrics table to view graphs.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ingressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="egressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    name="Ingress"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#ingressGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    name="Egress"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#egressGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Real Telemetry Summary */}
        <div className="lg:col-span-4 bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Network Telemetry Summary
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live statistics derived from PostgreSQL network_metrics
            </p>

            <div className="mt-5 space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Telemetry Samples</span>
                  <span className="font-mono text-white font-bold">{networkMetrics.length}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Peak Ingress Rate</span>
                  <span className="font-mono text-cyan-400 font-bold">{peakInbound} Mbps</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Peak Egress Rate</span>
                  <span className="font-mono text-indigo-400 font-bold">{peakOutbound} Mbps</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Average Latency</span>
                  <span className="font-mono text-emerald-400 font-bold">{avgLatency} ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
            <span>Interface Link:</span>
            <span className="font-mono text-slate-200">{activeInterfaceName}</span>
          </div>
        </div>
      </div>

      {/* Network Metrics Inventory Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Network Metric Logs
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredMetrics.length} of {networkMetrics.length} database metric samples
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by network name or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Querying PostgreSQL network_metrics table via Spring Boot..." />
        ) : networkMetrics.length === 0 ? (
          <EmptyState
            title="No Network Metrics Found"
            message="No network metrics have been logged in the database yet. When the network probe runs, telemetry will appear here."
            actionText="Refresh Network Telemetry"
            onAction={fetchNetworkData}
          />
        ) : filteredMetrics.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No metrics match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Metric ID</th>
                  <th className="py-3 px-5">Network Name</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Ingress (RX)</th>
                  <th className="py-3 px-5">Egress (TX)</th>
                  <th className="py-3 px-5">Latency</th>
                  <th className="py-3 px-5">Packet Loss</th>
                  <th className="py-3 px-5">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredMetrics.map((metric) => {
                  const status = (metric.status || "UP").toUpperCase()
                  const statusUp = status === "UP"

                  return (
                    <tr key={metric.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px]">
                        #{metric.id}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-white font-mono">
                        {metric.networkName}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            statusUp
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-cyan-400">
                        {metric.networkIn != null ? `${metric.networkIn} Mbps` : "—"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-indigo-400">
                        {metric.networkOut != null ? `${metric.networkOut} Mbps` : "—"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {metric.latency != null ? `${metric.latency} ms` : "—"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">
                        {metric.packetLoss != null ? `${metric.packetLoss}%` : "—"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {metric.timestamp ? new Date(metric.timestamp).toLocaleString() : "—"}
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

export default NetworkMonitoring