import { useMemo } from "react"

function IncidentStats({ incidents = [] }) {
  const stats = useMemo(() => {
    const total = incidents.length
    const active = incidents.filter(
      (i) => (i.status || "").toUpperCase() !== "RESOLVED"
    ).length
    const critical = incidents.filter(
      (i) =>
        (i.severity || "").toUpperCase() === "CRITICAL" &&
        (i.status || "").toUpperCase() !== "RESOLVED"
    ).length
    const resolved = incidents.filter(
      (i) => (i.status || "").toUpperCase() === "RESOLVED"
    ).length
    const breached = incidents.filter((i) => {
      const sla = (i.slaStatus || "").toUpperCase()
      return sla === "BREACHED" || sla === "SLA_BREACHED" || i.slaBreached === true
    }).length

    // MTTR calculation strictly from real database timestamps
    const resolvedWithTimes = incidents.filter((i) => {
      if ((i.status || "").toUpperCase() !== "RESOLVED") return false
      return i.createdAt && i.resolvedAt
    })

    let mttrText = "—"
    if (resolvedWithTimes.length > 0) {
      const totalDurationMs = resolvedWithTimes.reduce((acc, curr) => {
        const start = new Date(curr.createdAt).getTime()
        const end = new Date(curr.resolvedAt).getTime()
        const diff = end - start
        return acc + (diff > 0 ? diff : 0)
      }, 0)

      const avgMs = totalDurationMs / resolvedWithTimes.length
      const avgMinutes = Math.round(avgMs / (1000 * 60))
      if (avgMinutes < 60) {
        mttrText = `${avgMinutes}m`
      } else {
        const hours = (avgMinutes / 60).toFixed(1)
        mttrText = `${hours}h`
      }
    }

    return {
      total,
      active,
      critical,
      resolved,
      breached,
      mttr: mttrText,
    }
  }, [incidents])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Active Incidents */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20 hover:border-blue-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500" />
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <span>Active Incidents</span>
          <div className="p-1.5 rounded bg-slate-800 text-blue-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white font-mono mt-2">
          {stats.active}
        </div>
        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
          <span>Open or Investigating</span>
          <span className="text-slate-500 font-mono text-[11px]">{stats.total} total</span>
        </div>
      </div>

      {/* 2. Critical Incidents */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20 hover:border-rose-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-rose-500" />
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <span>Critical Severity</span>
          <div className="p-1.5 rounded bg-slate-800 text-rose-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-rose-400 font-mono mt-2">
          {stats.critical}
        </div>
        <div className="text-xs text-rose-400/80 mt-2 pt-2 border-t border-slate-800/60">
          Immediate response required
        </div>
      </div>

      {/* 3. Resolved Incidents */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20 hover:border-emerald-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500" />
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <span>Resolved</span>
          <div className="p-1.5 rounded bg-slate-800 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">
          {stats.resolved}
        </div>
        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
          Closed & remediated
        </div>
      </div>

      {/* 4. MTTR */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20 hover:border-cyan-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-cyan-500" />
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <span>MTTR (Resolution)</span>
          <div className="p-1.5 rounded bg-slate-800 text-cyan-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white font-mono mt-2">
          {stats.mttr}
        </div>
        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
          Mean time to resolve
        </div>
      </div>

      {/* 5. SLA Breached */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-md shadow-black/20 hover:border-amber-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-amber-500" />
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wide">
          <span>SLA Breached</span>
          <div className="p-1.5 rounded bg-slate-800 text-amber-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-amber-400 font-mono mt-2">
          {stats.breached}
        </div>
        <div className="text-xs text-amber-400/80 mt-2 pt-2 border-t border-slate-800/60">
          Threshold violations
        </div>
      </div>
    </div>
  )
}

export default IncidentStats
