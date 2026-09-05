import { useState, useEffect } from "react"
import { getIncidentAudit } from "../../services/api"

function IncidentAuditPanel({ incidentId, incidentAuditLogs }) {
  const [fetchedLogs, setFetchedLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [dependencyPending, setDependencyPending] = useState(false)

  const logs = incidentAuditLogs && incidentAuditLogs.length > 0 ? incidentAuditLogs : fetchedLogs

  useEffect(() => {
    let ignore = false

    if ((incidentAuditLogs && incidentAuditLogs.length > 0) || !incidentId) {
      return
    }

    getIncidentAudit(incidentId)
      .then((data) => {
        if (!ignore) {
          setFetchedLogs(Array.isArray(data) ? data : [])
          setDependencyPending(false)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.warn("Incident audit endpoint not available yet (Member 4 dependency):", err)
          setDependencyPending(true)
          setFetchedLogs([])
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [incidentId, incidentAuditLogs])

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center gap-2 text-xs text-slate-400 font-mono">
        <svg className="w-4 h-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading audit history from backend...
      </div>
    )
  }

  if (dependencyPending) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          BACKEND DEPENDENCY — MEMBER 4
        </div>
        <p className="text-slate-300 mt-1.5 leading-relaxed">
          Incident audit action logging is pending implementation by Member 4.
          Zero simulated audit entries are manufactured on the frontend.
        </p>
        <div className="mt-2 text-[10px] text-slate-400 font-mono">
          Contract: <code className="text-amber-300">GET /api/incidents/{incidentId}/audit</code>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-xs bg-slate-800/30 rounded-xl border border-slate-800">
        No audit history recorded for this incident yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Audit Log Trail
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {logs.map((log, idx) => (
          <div
            key={log.id || idx}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs flex items-start justify-between gap-3"
          >
            <div>
              <span className="font-semibold text-white block">
                {log.action || "Action"}
              </span>
              <span className="text-slate-400 text-[11px]">
                {log.actor || "System"} • {log.details || "No details"}
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px] shrink-0">
              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IncidentAuditPanel
