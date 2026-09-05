import { useState, useEffect } from "react"
import { getIncidentSla } from "../../services/api"

function IncidentSlaPanel({ incidentId, incidentSlaData }) {
  const [fetchedSla, setFetchedSla] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dependencyPending, setDependencyPending] = useState(false)

  const sla = incidentSlaData || fetchedSla

  useEffect(() => {
    let ignore = false

    if (incidentSlaData || !incidentId) {
      return
    }

    getIncidentSla(incidentId)
      .then((data) => {
        if (!ignore) {
          setFetchedSla(data)
          setDependencyPending(false)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          // If 404 or connection failure, mark as backend dependency required
          console.warn("Incident SLA endpoint not available yet (Member 4 dependency):", err)
          setDependencyPending(true)
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [incidentId, incidentSlaData])

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-400 font-mono">
        <svg className="w-4 h-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading SLA information from backend...
      </div>
    )
  }

  if (dependencyPending || !sla) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          BACKEND DEPENDENCY — MEMBER 4
        </div>
        <p className="text-slate-300 mt-1.5 leading-relaxed">
          Incident SLA calculation endpoint is pending implementation by Member 4.
          No simulated SLA values are manufactured on the frontend.
        </p>
        <div className="mt-2 text-[10px] text-slate-400 font-mono">
          Contract: <code className="text-amber-300">GET /api/incidents/{incidentId}/sla</code>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          SLA Status
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            sla.status === "BREACHED"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {sla.status || "WITHIN SLA"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Deadline</span>
          <span className="font-mono text-slate-200">
            {sla.deadline ? new Date(sla.deadline).toLocaleString() : "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Remaining Time</span>
          <span className="font-mono text-cyan-400">
            {sla.remainingTime || "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default IncidentSlaPanel
