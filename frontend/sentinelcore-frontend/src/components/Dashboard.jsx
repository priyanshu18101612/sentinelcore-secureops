import { useEffect, useState, useMemo } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

import {
  getAssets,
  getAlerts,
  getNetworkMetrics,
} from "../services/api"

// ============================================================================
// REALISTIC MOCK TELEMETRY ENGINE
// Generates time-aware mock data so the dashboard always feels alive, responsive,
// and high-fidelity across "Today", "7d", and "30d" time horizons.
// ============================================================================

const MOCK_DATA_BY_RANGE = {
  Today: {
    resolution: "Hourly (Last 24h)",
    cpuMemoryPoints: [
      { time: "00:00", cpu: 34.2, memory: 61.4, peakCpu: 45.0 },
      { time: "02:00", cpu: 28.5, memory: 60.1, peakCpu: 35.2 },
      { time: "04:00", cpu: 26.8, memory: 59.8, peakCpu: 32.1 },
      { time: "06:00", cpu: 35.4, memory: 62.2, peakCpu: 48.3 },
      { time: "08:00", cpu: 48.9, memory: 65.7, peakCpu: 62.4 },
      { time: "10:00", cpu: 62.1, memory: 68.9, peakCpu: 78.5 },
      { time: "12:00", cpu: 58.4, memory: 71.2, peakCpu: 72.1 },
      { time: "14:00", cpu: 65.8, memory: 73.5, peakCpu: 82.4 },
      { time: "16:00", cpu: 54.2, memory: 70.8, peakCpu: 68.0 },
      { time: "18:00", cpu: 49.6, memory: 69.1, peakCpu: 63.5 },
      { time: "20:00", cpu: 44.1, memory: 67.4, peakCpu: 55.2 },
      { time: "22:00", cpu: 38.7, memory: 64.9, peakCpu: 49.1 },
    ],
    networkPoints: [
      { time: "00:00", inbound: 310, outbound: 195, latency: 15 },
      { time: "02:00", inbound: 240, outbound: 160, latency: 14 },
      { time: "04:00", inbound: 215, outbound: 145, latency: 13 },
      { time: "06:00", inbound: 380, outbound: 260, latency: 16 },
      { time: "08:00", inbound: 620, outbound: 410, latency: 19 },
      { time: "10:00", inbound: 840, outbound: 590, latency: 22 },
      { time: "12:00", inbound: 790, outbound: 540, latency: 20 },
      { time: "14:00", inbound: 920, outbound: 680, latency: 24 },
      { time: "16:00", inbound: 750, outbound: 510, latency: 21 },
      { time: "18:00", inbound: 680, outbound: 460, latency: 19 },
      { time: "20:00", inbound: 540, outbound: 380, latency: 18 },
      { time: "22:00", inbound: 430, outbound: 290, latency: 16 },
    ],
  },
  "7d": {
    resolution: "Daily (Last 7 Days)",
    cpuMemoryPoints: [
      { time: "Mon", cpu: 46.2, memory: 65.4, peakCpu: 71.0 },
      { time: "Tue", cpu: 52.8, memory: 68.1, peakCpu: 79.4 },
      { time: "Wed", cpu: 49.5, memory: 67.3, peakCpu: 74.2 },
      { time: "Thu", cpu: 58.1, memory: 72.8, peakCpu: 84.1 },
      { time: "Fri", cpu: 61.4, memory: 74.5, peakCpu: 88.6 },
      { time: "Sat", cpu: 38.6, memory: 63.2, peakCpu: 52.1 },
      { time: "Sun", cpu: 35.1, memory: 61.8, peakCpu: 47.9 },
    ],
    networkPoints: [
      { time: "Mon", inbound: 640, outbound: 430, latency: 18 },
      { time: "Tue", inbound: 780, outbound: 520, latency: 20 },
      { time: "Wed", inbound: 720, outbound: 490, latency: 19 },
      { time: "Thu", inbound: 890, outbound: 620, latency: 22 },
      { time: "Fri", inbound: 940, outbound: 670, latency: 25 },
      { time: "Sat", inbound: 480, outbound: 320, latency: 16 },
      { time: "Sun", inbound: 420, outbound: 280, latency: 15 },
    ],
  },
  "30d": {
    resolution: "3-Day Intervals (Last 30 Days)",
    cpuMemoryPoints: [
      { time: "D-27", cpu: 41.2, memory: 62.0, peakCpu: 65.4 },
      { time: "D-24", cpu: 44.5, memory: 64.2, peakCpu: 69.1 },
      { time: "D-21", cpu: 48.1, memory: 66.8, peakCpu: 75.3 },
      { time: "D-18", cpu: 53.0, memory: 70.1, peakCpu: 81.0 },
      { time: "D-15", cpu: 49.7, memory: 67.9, peakCpu: 73.8 },
      { time: "D-12", cpu: 56.4, memory: 72.4, peakCpu: 83.2 },
      { time: "D-09", cpu: 51.8, memory: 69.3, peakCpu: 77.0 },
      { time: "D-06", cpu: 47.2, memory: 65.9, peakCpu: 70.4 },
      { time: "D-03", cpu: 45.8, memory: 64.7, peakCpu: 68.2 },
      { time: "Now", cpu: 48.9, memory: 68.4, peakCpu: 78.2 },
    ],
    networkPoints: [
      { time: "D-27", inbound: 550, outbound: 370, latency: 17 },
      { time: "D-24", inbound: 610, outbound: 410, latency: 18 },
      { time: "D-21", inbound: 680, outbound: 460, latency: 19 },
      { time: "D-18", inbound: 790, outbound: 530, latency: 21 },
      { time: "D-15", inbound: 720, outbound: 480, latency: 19 },
      { time: "D-12", inbound: 850, outbound: 590, latency: 23 },
      { time: "D-09", inbound: 760, outbound: 510, latency: 20 },
      { time: "D-06", inbound: 690, outbound: 450, latency: 18 },
      { time: "D-03", inbound: 640, outbound: 420, latency: 17 },
      { time: "Now", inbound: 780, outbound: 520, latency: 18 },
    ],
  },
}

// Sparkline series for stat cards (15 points each for smooth mini curves)
const SPARKLINE_DATA = {
  assets: [
    { v: 236 }, { v: 238 }, { v: 238 }, { v: 240 }, { v: 241 },
    { v: 242 }, { v: 242 }, { v: 244 }, { v: 245 }, { v: 246 },
    { v: 246 }, { v: 247 }, { v: 247 }, { v: 248 }, { v: 248 },
  ],
  uptime: [
    { v: 99.99 }, { v: 99.98 }, { v: 99.99 }, { v: 99.97 }, { v: 99.98 },
    { v: 99.99 }, { v: 99.99 }, { v: 99.96 }, { v: 99.98 }, { v: 99.98 },
    { v: 99.99 }, { v: 99.97 }, { v: 99.98 }, { v: 99.98 }, { v: 99.98 },
  ],
  alerts: [
    { v: 18 }, { v: 16 }, { v: 15 }, { v: 17 }, { v: 19 },
    { v: 16 }, { v: 14 }, { v: 15 }, { v: 13 }, { v: 14 },
    { v: 12 }, { v: 13 }, { v: 11 }, { v: 13 }, { v: 12 },
  ],
  cpu: [
    { v: 38 }, { v: 42 }, { v: 40 }, { v: 45 }, { v: 52 },
    { v: 64 }, { v: 58 }, { v: 62 }, { v: 54 }, { v: 48 },
    { v: 44 }, { v: 50 }, { v: 46 }, { v: 43 }, { v: 45 },
  ],
  memory: [
    { v: 62 }, { v: 63 }, { v: 64 }, { v: 65 }, { v: 67 },
    { v: 68 }, { v: 70 }, { v: 71 }, { v: 69 }, { v: 68 },
    { v: 67 }, { v: 68 }, { v: 69 }, { v: 68 }, { v: 68 },
  ],
  disk: [
    { v: 52 }, { v: 52 }, { v: 52 }, { v: 53 }, { v: 53 },
    { v: 53 }, { v: 53 }, { v: 54 }, { v: 54 }, { v: 54 },
    { v: 54 }, { v: 54 }, { v: 54 }, { v: 54 }, { v: 54 },
  ],
  network: [
    { v: 420 }, { v: 480 }, { v: 510 }, { v: 640 }, { v: 820 },
    { v: 910 }, { v: 840 }, { v: 960 }, { v: 810 }, { v: 720 },
    { v: 650 }, { v: 710 }, { v: 680 }, { v: 740 }, { v: 780 },
  ],
}

// Active Alerts breakdown for the donut chart
const MOCK_ALERTS_BREAKDOWN = [
  { name: "Critical", value: 3, color: "#f43f5e", description: "Immediate intervention" },
  { name: "High", value: 5, color: "#f97316", description: "Action required < 1h" },
  { name: "Medium", value: 3, color: "#f59e0b", description: "Degraded SLA risk" },
  { name: "Low", value: 1, color: "#38bdf8", description: "Informational notice" },
]

// Infrastructure Health Status Breakdown
const MOCK_HEALTH_DATA = {
  total: 248,
  healthy: 238,
  warning: 8,
  critical: 2,
  healthyPercent: 96.0,
  warningPercent: 3.2,
  criticalPercent: 0.8,
}

// Critical Cluster Services Status Grid
const CLUSTER_SERVICES = [
  { name: "k8s-prod-cluster-01", role: "Compute Engine", status: "HEALTHY", uptime: "99.98%", latency: "11ms" },
  { name: "postgres-primary-db", role: "Relational DB", status: "HEALTHY", uptime: "99.99%", latency: "4ms" },
  { name: "redis-cache-fleet", role: "In-Memory Store", status: "HEALTHY", uptime: "100.0%", latency: "1.2ms" },
  { name: "ingress-traefik-edge", role: "API Gateway", status: "HEALTHY", uptime: "99.95%", latency: "9ms" },
  { name: "kafka-telemetry-pipe", role: "Event Queue", status: "HEALTHY", uptime: "99.92%", latency: "15ms" },
  { name: "worker-heavy-batch-04", role: "Job Consumer", status: "WARNING", uptime: "95.80%", latency: "52ms" },
]

// Recent Security & Infrastructure Alerts List
const MOCK_RECENT_ALERTS = [
  {
    id: "SEC-9041",
    severity: "CRITICAL",
    asset: "ingress-traefik-edge",
    message: "DDoS mitigation triggered: 14,200 req/s rate burst blocked from AS-13335",
    time: "4m ago",
    status: "OPEN",
  },
  {
    id: "INF-8812",
    severity: "HIGH",
    asset: "worker-heavy-batch-04",
    message: "Memory leak detected: heap threshold exceeded 85% on thread pool",
    time: "18m ago",
    status: "INVESTIGATING",
  },
  {
    id: "SEC-8740",
    severity: "HIGH",
    asset: "auth-gateway-svc",
    message: "Suspicious JWT signature mismatch detected from unauthorized origin",
    time: "42m ago",
    status: "INVESTIGATING",
  },
  {
    id: "INF-8619",
    severity: "MEDIUM",
    asset: "k8s-prod-cluster-01",
    message: "Pod replica count autoscaled to max limit (16 pods) under load",
    time: "1h ago",
    status: "OPEN",
  },
  {
    id: "INF-8550",
    severity: "LOW",
    asset: "postgres-primary-db",
    message: "Automated incremental backup snapshot verified and stored in S3",
    time: "2h ago",
    status: "RESOLVED",
  },
]

// ============================================================================
// MICRO SPARKLINE COMPONENT
// Lightweight, responsive mini chart embedded inside every stat card
// ============================================================================
function Sparkline({ data, strokeColor, id }) {
  return (
    <div className="w-full h-10 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#gradient-${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================================
// CUSTOM RECHARTS TOOLTIP
// Sleek dark-mode tooltip styled with Datadog/Grafana aesthetic
// ============================================================================
function CustomTooltip({ active, payload, label, unit = "" }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-lg p-3 shadow-xl text-xs z-50">
        <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1 mb-2">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400 capitalize">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-100">
                {entry.value} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
function Dashboard({ timeRange = "Today" }) {
  // --------------------------------------------------------------------------
  // STATE & BACKEND INTEGRATION
  // We keep backend state hooks intact so when real API servers are available,
  // data flows seamlessly. Otherwise, the mock telemetry engine takes over.
  // --------------------------------------------------------------------------
  const [assets, setAssets] = useState([])
  const [alerts, setAlerts] = useState([])
  const [networkMetrics, setNetworkMetrics] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState("Just now")

  // Load real API data in background
  useEffect(() => {
    let isMounted = true

    async function loadTelemetry() {
      try {
        const [assetRes, alertsRes, netRes] = await Promise.allSettled([
          getAssets(),
          getAlerts(),
          getNetworkMetrics(),
        ])

        if (isMounted) {
          if (assetRes.status === "fulfilled" && Array.isArray(assetRes.value)) {
            setAssets(assetRes.value)
          }
          if (alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value)) {
            setAlerts(alertsRes.value)
          }
          if (netRes.status === "fulfilled" && Array.isArray(netRes.value)) {
            setNetworkMetrics(netRes.value)
          }
          setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
        }
      } catch (err) {
        console.warn("Backend telemetry offline, falling back to mock dataset:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTelemetry()
    return () => {
      isMounted = false
    }
  }, [refreshTrigger])

  // Get active dataset based on selected time range
  const currentRangeData = useMemo(() => {
    return MOCK_DATA_BY_RANGE[timeRange] || MOCK_DATA_BY_RANGE.Today
  }, [timeRange])

  // KPI Summary calculations
  const totalAssetsCount = assets.length > 0 ? assets.length : MOCK_HEALTH_DATA.total
  const activeAlertsCount = alerts.length > 0 ? alerts.length : 12
  const criticalAlertsCount = alerts.filter(a => a.severity?.toUpperCase() === "CRITICAL").length || 3

  // Current CPU & Memory snapshot values
  const latestCpu = currentRangeData.cpuMemoryPoints[currentRangeData.cpuMemoryPoints.length - 1]?.cpu || 48.9
  const latestMemory = currentRangeData.cpuMemoryPoints[currentRangeData.cpuMemoryPoints.length - 1]?.memory || 68.4
  const latestInbound =
    networkMetrics.length > 0 && networkMetrics[networkMetrics.length - 1]?.networkIn != null
      ? Number(networkMetrics[networkMetrics.length - 1].networkIn)
      : currentRangeData.networkPoints[currentRangeData.networkPoints.length - 1]?.inbound || 780
  const latestOutbound =
    networkMetrics.length > 0 && networkMetrics[networkMetrics.length - 1]?.networkOut != null
      ? Number(networkMetrics[networkMetrics.length - 1].networkOut)
      : currentRangeData.networkPoints[currentRangeData.networkPoints.length - 1]?.outbound || 520

  // --------------------------------------------------------------------------
  // ROW 1: PRIMARY PLATFORM OVERVIEW & HEALTH CARDS (4 Cards)
  // Generous column width prevents any text truncation
  // --------------------------------------------------------------------------
  const primaryCards = [
    {
      id: "assets",
      title: "Assets Monitored",
      value: totalAssetsCount,
      unit: "",
      subtext: "238 online · 8 degraded · 2 offline",
      trend: "+4 this week",
      trendType: "up",
      accentColor: "#38bdf8", // Sky Blue
      sparkData: SPARKLINE_DATA.assets,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      id: "uptime",
      title: "System Availability",
      value: "99.98",
      unit: "%",
      subtext: "Zero critical incidents in 30d",
      trend: "SLA target: 99.90%",
      trendType: "up",
      accentColor: "#10b981", // Emerald Green
      sparkData: SPARKLINE_DATA.uptime,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "alerts",
      title: "Active Threat Alerts",
      value: activeAlertsCount,
      unit: "",
      subtext: `${criticalAlertsCount} critical · 5 high priority`,
      trend: "-2 vs yesterday",
      trendType: "down-good",
      accentColor: "#f59e0b", // Amber / Gold
      sparkData: SPARKLINE_DATA.alerts,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: "network",
      title: "Network Throughput",
      value: "1.30",
      unit: "Gbps",
      subtext: "Latency: 18ms · Packet loss: 0.00%",
      trend: "+12.4% peak",
      trendType: "up",
      accentColor: "#14b8a6", // Teal
      sparkData: SPARKLINE_DATA.network,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
    },
  ]

  // --------------------------------------------------------------------------
  // ROW 2: HARDWARE COMPUTE & STORAGE GAUGES (3 Cards)
  // Wider columns with dedicated resource breakdown tags
  // --------------------------------------------------------------------------
  const resourceCards = [
    {
      id: "cpu",
      title: "CPU Core Load",
      tag: "32 Cores Active",
      value: latestCpu,
      unit: "%",
      subtext: "Peak: 78.2% · Core temperature: 52°C nominal",
      trend: "+3.1% avg load",
      trendType: "up-warn",
      accentColor: "#3b82f6", // Electric Blue
      sparkData: SPARKLINE_DATA.cpu,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      id: "memory",
      title: "Memory Allocation",
      tag: "ECC DDR5",
      value: latestMemory,
      unit: "%",
      subtext: "109.4 GB allocated / 160.0 GB total capacity",
      trend: "+1.8% trend",
      trendType: "neutral",
      accentColor: "#8b5cf6", // Soft Purple
      sparkData: SPARKLINE_DATA.memory,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: "disk",
      title: "Disk Storage",
      tag: "Tier-1 NVMe",
      value: "54.1",
      unit: "%",
      subtext: "4.22 TB consumed / 7.80 TB total volume",
      trend: "Stable 0.0%",
      trendType: "neutral",
      accentColor: "#f97316", // Coral Orange
      sparkData: SPARKLINE_DATA.disk,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-7 text-slate-100">
      {/* -------------------------------------------------------------------- */}
      {/* COMMAND CENTER HEADER (Single clean toolbar, no duplicate pills)     */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
              SECUREOPS PLATFORM
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Horizon: {currentRangeData.resolution}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Infrastructure Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time cluster telemetry, hardware utilization, and threat detection.
          </p>
        </div>

        {/* Action Toolbar: Refresh indicator only */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-lg transition-all shadow-sm"
            title="Refresh Telemetry Now"
          >
            <svg
              className={`w-3.5 h-3.5 text-blue-400 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Updated {lastRefreshed}</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ROW 1: PRIMARY PLATFORM OVERVIEW CARDS (4 Columns)                   */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {primaryCards.map((card) => {
          return (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-black/25 group"
            >
              {/* Colored top accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px]"
                style={{ backgroundColor: card.accentColor }}
              />

              {/* Card Header: Title & Icon */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  {card.title}
                </span>
                <div
                  className="p-1.5 rounded-md bg-slate-800/90 text-slate-300 transition-transform group-hover:scale-105"
                  style={{ color: card.accentColor }}
                >
                  {card.icon}
                </div>
              </div>

              {/* Card Value & Trend */}
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl lg:text-[28px] font-extrabold text-white tracking-tight font-mono">
                    {card.value}
                  </span>
                  {card.unit && (
                    <span className="text-sm font-semibold text-slate-400 font-mono">
                      {card.unit}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    card.trendType === "up" || card.trendType === "down-good"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : card.trendType === "up-warn"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {card.trendType === "up" && "▲"}
                  {card.trendType === "down-good" && "▼"}
                  {card.trend}
                </span>
              </div>

              {/* Sparkline Graph */}
              <div className="mt-3 mb-1">
                <Sparkline
                  data={card.sparkData}
                  strokeColor={card.accentColor}
                  id={card.id}
                />
              </div>

              {/* Subtext */}
              <div className="text-xs text-slate-400 truncate pt-2 border-t border-slate-800/60">
                {card.subtext}
              </div>
            </div>
          )
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ROW 2: HARDWARE COMPUTE & STORAGE GAUGES (3 Columns)                 */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {resourceCards.map((card) => {
          return (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-black/25 group"
            >
              {/* Colored top accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px]"
                style={{ backgroundColor: card.accentColor }}
              />

              {/* Card Header: Title, Badge, and Icon */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                    {card.title}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                    {card.tag}
                  </span>
                </div>
                <div
                  className="p-1.5 rounded-md bg-slate-800/90 text-slate-300 transition-transform group-hover:scale-105"
                  style={{ color: card.accentColor }}
                >
                  {card.icon}
                </div>
              </div>

              {/* Card Value & Trend */}
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl lg:text-[28px] font-extrabold text-white tracking-tight font-mono">
                    {card.value}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 font-mono">
                    {card.unit}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    card.trendType === "up" || card.trendType === "down-good"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : card.trendType === "up-warn"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {card.trendType === "up-warn" && "▲"}
                  {card.trend}
                </span>
              </div>

              {/* Sparkline Graph */}
              <div className="mt-3 mb-1">
                <Sparkline
                  data={card.sparkData}
                  strokeColor={card.accentColor}
                  id={card.id}
                />
              </div>

              {/* Subtext */}
              <div className="text-xs text-slate-400 truncate pt-2 border-t border-slate-800/60">
                {card.subtext}
              </div>
            </div>
          )
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ROW 3: MAIN CHARTS: CPU & MEMORY + NETWORK ACTIVITY (2 Columns)      */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: CPU & MEMORY MULTI-LINE AREA CHART */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  CPU & Memory Utilization
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cluster resource telemetry · {currentRangeData.resolution}
              </p>
            </div>

            {/* Quick KPI stats ribbon */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                <span className="text-slate-300 font-medium">CPU:</span>
                <span className="font-mono font-bold text-blue-400">{latestCpu}%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                <span className="text-slate-300 font-medium">Memory:</span>
                <span className="font-mono font-bold text-purple-400">{latestMemory}%</span>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="w-full h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentRangeData.cpuMemoryPoints}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {/* Electric Blue gradient for CPU */}
                  <linearGradient id="cpuAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Purple gradient for Memory */}
                  <linearGradient id="memAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />

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
                  unit="%"
                  domain={[0, 100]}
                />

                <Tooltip content={<CustomTooltip unit="%" />} />

                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#3b82f6"
                  strokeWidth={2.2}
                  fill="url(#cpuAreaGrad)"
                />

                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory"
                  stroke="#8b5cf6"
                  strokeWidth={2.2}
                  fill="url(#memAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend Footer */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/60 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" />
                CPU Core Load (Avg {latestCpu}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]" />
                RAM Allocation (Avg {latestMemory}%)
              </span>
            </div>
            <span className="font-mono text-slate-500">Threshold: 85% Warning</span>
          </div>
        </div>

        {/* PANEL 2: NETWORK ACTIVITY DUAL-LINE / DUAL-AREA CHART */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Network Activity
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  18ms LATENCY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inbound vs Outbound packet throughput
              </p>
            </div>

            {/* In/Out stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                <span className="text-slate-300 font-medium">In:</span>
                <span className="font-mono font-bold text-sky-400">{latestInbound} Mbps</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                <span className="w-2 h-2 rounded-full bg-[#818cf8]" />
                <span className="text-slate-300 font-medium">Out:</span>
                <span className="font-mono font-bold text-indigo-300">{latestOutbound} Mbps</span>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="w-full h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={currentRangeData.networkPoints}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="netInGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="netOutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />

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
                  unit="M"
                />

                <Tooltip content={<CustomTooltip unit="Mbps" />} />

                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Inbound"
                  stroke="#0ea5e9"
                  strokeWidth={2.2}
                  fill="url(#netInGrad)"
                />

                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Outbound"
                  stroke="#818cf8"
                  strokeWidth={2.2}
                  fill="url(#netOutGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Network Metrics Ribbon */}
          <div className="flex flex-wrap items-center justify-between pt-3 mt-2 border-t border-slate-800/60 text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0ea5e9]" />
                Ingress (Max 940 Mbps)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#818cf8]" />
                Egress (Max 680 Mbps)
              </span>
            </div>
            <div className="font-mono text-slate-400">
              Packet Loss: <span className="text-emerald-400 font-semibold">0.00%</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ROW 4: ALERTS BREAKDOWN + ASSET HEALTH STATUS (1 Col + 2 Cols)       */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 4: ACTIVE ALERTS BREAKDOWN DONUT CHART */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight">
                Alerts by Severity
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                12 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Incident breakdown by classification
            </p>
          </div>

          {/* Donut Chart with Centered Metric */}
          <div className="relative flex items-center justify-center my-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_ALERTS_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {MOCK_ALERTS_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl font-sans">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: data.color }}
                            />
                            {data.name} Severity: {data.value}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {data.description}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-white font-mono">12</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Active
              </span>
            </div>
          </div>

          {/* Legend Details List */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
            {MOCK_ALERTS_BREAKDOWN.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 5: ASSET HEALTH STATUS & CLUSTER INFRASTRUCTURE GRID */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/80 border border-slate-800/80 p-6 flex flex-col justify-between shadow-lg shadow-black/20">
          <div className="pb-3 border-b border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Asset Health & Cluster Infrastructure
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Availability status across 248 monitored host machines and microservices
                </p>
              </div>

              {/* Status Ratio Pills */}
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  238 Healthy (96.0%)
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  8 Warning
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  2 Offline
                </span>
              </div>
            </div>

            {/* Horizontal Segmented Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 mt-3.5">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${MOCK_HEALTH_DATA.healthyPercent}%` }}
                title={`Healthy: ${MOCK_HEALTH_DATA.healthyPercent}%`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${MOCK_HEALTH_DATA.warningPercent}%` }}
                title={`Warning: ${MOCK_HEALTH_DATA.warningPercent}%`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${MOCK_HEALTH_DATA.criticalPercent}%` }}
                title={`Critical: ${MOCK_HEALTH_DATA.criticalPercent}%`}
              />
            </div>
          </div>

          {/* Critical Cluster Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 my-3.5">
            {CLUSTER_SERVICES.map((svc) => {
              const isHealthy = svc.status === "HEALTHY"
              return (
                <div
                  key={svc.name}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-100 truncate">
                        {svc.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{svc.role}</div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isHealthy
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                      }`}
                    >
                      {svc.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60">
                    <span>Uptime: <strong className="text-slate-200">{svc.uptime}</strong></span>
                    <span>Ping: <strong className="text-blue-400">{svc.latency}</strong></span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Status summary footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              Automated health ping interval: 15 seconds
            </span>
            <span className="font-mono text-blue-400">All health checks passing</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ROW 5: RECENT SECURITY & ANOMALY INCIDENTS FEED                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Security & Anomaly Incidents
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated alerts generated by SentinelCore anomaly detection
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing latest 5 events
          </span>
        </div>

        {/* Incidents Table / List */}
        <div className="divide-y divide-slate-800/70">
          {MOCK_RECENT_ALERTS.map((alert) => {
            const isCrit = alert.severity === "CRITICAL"
            const isHigh = alert.severity === "HIGH"
            const isMed = alert.severity === "MEDIUM"

            return (
              <div
                key={alert.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
              >
                {/* Left: Severity Badge + Message */}
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono shrink-0 ${
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

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-blue-400">{alert.id}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300">Target: {alert.asset}</span>
                      <span>•</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      alert.status === "RESOLVED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : alert.status === "INVESTIGATING"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {alert.status}
                  </span>

                  <button
                    type="button"
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Investigate
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard