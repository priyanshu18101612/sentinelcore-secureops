import { useState, useEffect } from "react"
import { getIncidentAudit } from "../../services/api"

function IncidentAuditPanel({ incidentId, incidentAuditLogs }) {
  const [logs, setLogs] = useState(
    Array.isArray(incidentAuditLogs) ? incidentAuditLogs : []
  )
  const [loading, setLoading] = useState(!incidentAuditLogs)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false

    if (!incidentId) {
      setLoading(false)
      return
    }

    if (Array.isArray(incidentAuditLogs)) {
      setLogs(incidentAuditLogs)
      setLoading(false)
      setError("")
      return
    }

    setLoading(true)
    setError("")

    getIncidentAudit(incidentId)
      .then((data) => {
        if (!ignore) {
          setLogs(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load incident audit history:", err)
          setError(err.message || "Failed to load audit history")
          setLogs([])
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [incidentId, incidentAuditLogs])

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 font-mono">
        Loading audit history...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
        Unable to load audit history: {error}
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
              {log.timestamp
                ? new Date(log.timestamp).toLocaleString()
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IncidentAuditPanel