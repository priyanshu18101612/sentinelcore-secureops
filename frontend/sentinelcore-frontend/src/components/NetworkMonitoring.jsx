import { useEffect, useState, useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  getNetworkStatus,
  getNetworkMetrics,
} from "../services/api"

// Mock rolling 24-hour network traffic telemetry (Inbound / Outbound in Mbps)
const TIME_SERIES_TRAFFIC = [
  { time: "00:00", inbound: 420, outbound: 260, dropped: 0 },
  { time: "02:00", inbound: 360, outbound: 210, dropped: 0 },
  { time: "04:00", inbound: 290, outbound: 180, dropped: 0 },
  { time: "06:00", inbound: 410, outbound: 240, dropped: 1 },
  { time: "08:00", inbound: 680, outbound: 420, dropped: 0 },
  { time: "10:00", inbound: 890, outbound: 580, dropped: 2 },
  { time: "12:00", inbound: 940, outbound: 620, dropped: 1 },
  { time: "14:00", inbound: 860, outbound: 570, dropped: 0 },
  { time: "16:00", inbound: 920, outbound: 610, dropped: 3 },
  { time: "18:00", inbound: 840, outbound: 540, dropped: 1 },
  { time: "20:00", inbound: 710, outbound: 460, dropped: 0 },
  { time: "22:00", inbound: 540, outbound: 350, dropped: 0 },
]

// Network Interfaces inventory
const BASE_INTERFACES = [
  {
    name: "eth0",
    label: "Primary Gateway Uplink",
    type: "PHYSICAL",
    mac: "52:54:00:8f:91:a1",
    ip: "192.168.1.10/24",
    speed: "10 Gbps SFP+",
    rxRate: "684.2 Mbps",
    txRate: "419.6 Mbps",
    rxPercent: 68,
    txPercent: 42,
    mtu: 9000,
    dropped: "0 pkts",
    status: "UP",
  },
  {
    name: "eth1",
    label: "Internal East-West Mesh",
    type: "PHYSICAL",
    mac: "52:54:00:8f:91:a2",
    ip: "10.0.10.15/24",
    speed: "10 Gbps DAC",
    rxRate: "340.5 Mbps",
    txRate: "280.1 Mbps",
    rxPercent: 34,
    txPercent: 28,
    mtu: 9000,
    dropped: "0 pkts",
    status: "UP",
  },
  {
    name: "wg0",
    label: "SecOps Zero-Trust VPN",
    type: "VIRTUAL",
    mac: "00:00:00:00:00:00",
    ip: "10.88.0.1/32",
    speed: "Encrypted Mesh",
    rxRate: "48.2 Mbps",
    txRate: "36.4 Mbps",
    rxPercent: 18,
    txPercent: 14,
    mtu: 1420,
    dropped: "0 pkts",
    status: "UP",
  },
  {
    name: "flannel.1",
    label: "Kubernetes CNI Overlay",
    type: "CONTAINER",
    mac: "ba:41:8c:12:ef:90",
    ip: "10.244.0.1/32",
    speed: "VXLAN Tunnel",
    rxRate: "215.8 Mbps",
    txRate: "198.3 Mbps",
    rxPercent: 22,
    txPercent: 20,
    mtu: 1450,
    dropped: "0 pkts",
    status: "UP",
  },
  {
    name: "docker0",
    label: "Local Bridge Network",
    type: "CONTAINER",
    mac: "02:42:e8:11:bc:55",
    ip: "172.17.0.1/16",
    speed: "Virtual Bridge",
    rxRate: "12.4 Mbps",
    txRate: "9.2 Mbps",
    rxPercent: 5,
    txPercent: 4,
    mtu: 1500,
    dropped: "0 pkts",
    status: "UP",
  },
]

// Protocol breakdown statistics
const PROTOCOLS = [
  { name: "HTTPS (Port 443)", share: 62, volume: "1.04 Gbps", color: "bg-cyan-500", text: "text-cyan-400" },
  { name: "DNS / DoH (Port 53)", share: 15, volume: "252 Mbps", color: "bg-emerald-500", text: "text-emerald-400" },
  { name: "SSH / Bastion (Port 22)", share: 11, volume: "185 Mbps", color: "bg-indigo-500", text: "text-indigo-400" },
  { name: "gRPC Microservices", share: 8, volume: "134 Mbps", color: "bg-violet-500", text: "text-violet-400" },
  { name: "ICMP / Telemetry", share: 4, volume: "67 Mbps", color: "bg-amber-500", text: "text-amber-400" },
]

function NetworkMonitoring() {
  const [networkStatus, setNetworkStatus] = useState("UP")
  const [networkMetrics, setNetworkMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    async function loadInitialNetworkData() {
      try {
        const [status, metrics] = await Promise.all([
          getNetworkStatus(),
          getNetworkMetrics(),
        ])

        setNetworkStatus(status || "UP")

        if (Array.isArray(metrics) && metrics.length > 0) {
          setNetworkMetrics(metrics[0])
        } else {
          setNetworkMetrics(null)
        }
      } catch (error) {
        console.warn("Using baseline network telemetry data:", error)
        setNetworkStatus("UP")
        setNetworkMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    loadInitialNetworkData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [status, metrics] = await Promise.all([
        getNetworkStatus(),
        getNetworkMetrics(),
      ])

      setNetworkStatus(status || "UP")

      if (Array.isArray(metrics) && metrics.length > 0) {
        setNetworkMetrics(metrics[0])
      }
    } catch (error) {
      console.warn("Using baseline network telemetry data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Dynamic values: use API metrics if available, otherwise high-fidelity baseline
  const incomingTraffic = Number(networkMetrics?.networkIn) || 684.2
  const outgoingTraffic = Number(networkMetrics?.networkOut) || 419.6
  const latency = Number(networkMetrics?.latency) || 14.2
  const packetLoss = Number(networkMetrics?.packetLoss) || 0.02
  const networkName = networkMetrics?.networkName || "Prod-VPC-US-East"
  const isNetworkUp = networkStatus?.toUpperCase() === "UP"

  // Filter interfaces based on search & category
  const filteredInterfaces = useMemo(() => {
    return BASE_INTERFACES.filter((iface) => {
      const matchesSearch =
        iface.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iface.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iface.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iface.mac.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType =
        selectedType === "ALL" || iface.type === selectedType

      return matchesSearch && matchesType
    })
  }, [searchQuery, selectedType])

  return (
    <div className="space-y-7 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
              GLOBAL TELEMETRY & ROUTING
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              eBPF & NetFlow Synchronized
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Network Traffic & Gateway Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time packet inspection, gateway throughput, latency distribution, and edge ingress/egress metrics.
          </p>
        </div>

        {/* Live Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{isNetworkUp ? "NetFlow Probe Active" : "Network Degraded"}</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefreshing ? "Probing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inbound Bandwidth */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ingress Bandwidth (RX)
            </span>
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {incomingTraffic}
            </span>
            <span className="text-xs font-semibold text-slate-400">Mbps</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-emerald-400 font-medium">↑ +8.4% vs 1h baseline</span>
            <span className="text-slate-400 font-mono">Peak: 1.28 Gbps</span>
          </div>
        </div>

        {/* Card 2: Outbound Bandwidth */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Egress Bandwidth (TX)
            </span>
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {outgoingTraffic}
            </span>
            <span className="text-xs font-semibold text-slate-400">Mbps</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400 font-medium">↓ -2.1% vs 1h baseline</span>
            <span className="text-slate-400 font-mono">Peak: 890 Mbps</span>
          </div>
        </div>

        {/* Card 3: Roundtrip Latency */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Average Roundtrip Latency
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {latency}
            </span>
            <span className="text-xs font-semibold text-slate-400">ms</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-emerald-400 font-medium">Target: &lt; 25ms</span>
            <span className="text-slate-400 font-mono">Jitter: 0.8ms</span>
          </div>
        </div>

        {/* Card 4: Packet Loss */}
        <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Packet Loss & Frame Drops
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              {packetLoss}%
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-medium">Nominal</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">VPC: {networkName}</span>
            <span className="text-emerald-400 font-mono">0 dropped frames</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Traffic Throughput AreaChart & Protocol Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-Hour Ingress / Egress Throughput Chart */}
        <div className="lg:col-span-8 bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/60">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                24-Hour Throughput Telemetry
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time ingress (RX) and egress (TX) flow rates across all cluster gateways
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TIME_SERIES_TRAFFIC} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  tickFormatter={(val) => `${val}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1527",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    fontSize: "12px",
                    color: "#f8fafc",
                  }}
                  formatter={(val, name) => [
                    `${val} Mbps`,
                    name === "inbound" ? "Ingress Traffic" : "Egress Traffic",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ingressGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#egressGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Protocol Distribution & Gateway Routing Health */}
        <div className="lg:col-span-4 space-y-4">
          {/* Protocol Distribution */}
          <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20">
            <h2 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-slate-800/60">
              Protocol & Port Distribution
            </h2>
            <div className="mt-4 space-y-3.5">
              {PROTOCOLS.map((proto) => (
                <div key={proto.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">{proto.name}</span>
                    <span className="font-mono text-slate-400">{proto.share}% ({proto.volume})</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${proto.color}`}
                      style={{ width: `${proto.share}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gateway Routing Status */}
          <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20">
            <h2 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-slate-800/60">
              Gateway Routing Status
            </h2>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-mono text-slate-300">BGP Peer Router-01</span>
                </div>
                <span className="font-semibold text-emerald-400">ESTABLISHED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-mono text-slate-300">Cloudflare Magic Transit</span>
                </div>
                <span className="font-semibold text-emerald-400">ACTIVE (0 Drops)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="font-mono text-slate-300">WireGuard Mesh wg0</span>
                </div>
                <span className="font-semibold text-cyan-400">SYNCED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interfaces & Gateways Catalog */}
      <div className="bg-[#131b2e] border border-slate-800/80 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Network Interfaces & Routing Adapters
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live link speeds, MTU configurations, and hardware drop telemetry
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search interfaces, IP, MAC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 lg:w-64 bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              {["ALL", "PHYSICAL", "VIRTUAL", "CONTAINER"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedType === type
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b101c] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Interface / Device</th>
                <th className="py-3 px-4">IP Address / CIDR</th>
                <th className="py-3 px-4">Link Speed & Type</th>
                <th className="py-3 px-4">Ingress (RX)</th>
                <th className="py-3 px-4">Egress (TX)</th>
                <th className="py-3 px-4">MTU & Drops</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading network interface telemetry...
                  </td>
                </tr>
              ) : filteredInterfaces.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No interfaces match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredInterfaces.map((iface) => (
                  <tr key={iface.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-md bg-slate-800 border border-slate-700 font-mono font-bold text-white text-[11px]">
                          {iface.name}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100">{iface.label}</div>
                          <div className="font-mono text-[10px] text-slate-500">{iface.mac}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">
                      {iface.ip}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-slate-300 font-medium text-[11px]">
                        {iface.speed}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-200">{iface.rxRate}</div>
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${iface.rxPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-200">{iface.txRate}</div>
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${iface.txPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <div>MTU: {iface.mtu}</div>
                      <div className="text-[10px] text-emerald-400">{iface.dropped}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {iface.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default NetworkMonitoring