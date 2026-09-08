import { useState, useEffect } from "react"
import { getIncidentSla } from "../../services/api"

function IncidentSlaPanel({ incidentId, incidentSlaData }) {
  const [sla, setSla] = useState(incidentSlaData || null)
  const [loading, setLoading] = useState(!incidentSlaData)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false

    if (!incidentId) {
      setLoading(false)
      return
    }

    if (incidentSlaData) {
      setSla(incidentSlaData)
      setLoading(false)
      setError("")
      return
    }

    setLoading(true)
    setError("")

    getIncidentSla(incidentId)
      .then((data) => {
        if (!ignore) {
          setSla(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load incident SLA:", err)
          setError(err.message || "Failed to load SLA information")
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [incidentId, incidentSlaData])

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 font-mono">
        Loading SLA information...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
        Unable to load SLA information: {error}
      </div>
    )
  }

  if (!sla) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-xs text-slate-500">
        No SLA information available.
      </div>
    )
  }

  const isBreached = sla.status === "SLA_BREACHED"

  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          SLA Status
        </span>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isBreached
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {sla.status || "UNKNOWN"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">
            Deadline
          </span>

          <span className="font-mono text-slate-200">
            {sla.deadline
              ? new Date(sla.deadline).toLocaleString()
              : "—"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">
            Remaining Time
          </span>

          <span className="font-mono text-cyan-400">
            {sla.remainingTime || "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default IncidentSlaPanel