import { useState } from "react"
import {
  updateIncidentSeverity,
  assignIncident,
  updateIncidentStatus,
  resolveIncident,
} from "../../services/api"

function IncidentActionsModal({
  isOpen,
  actionType,
  incident,
  onClose,
  onSuccess,
}) {
  const [severity, setSeverity] = useState(incident?.severity || "MEDIUM")
  const [assignedTeam, setAssignedTeam] = useState(incident?.assignedTeam || "")
  const [status, setStatus] = useState(incident?.status || "INVESTIGATING")
  const [resolutionNotes, setResolutionNotes] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !incident) return null

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (actionType === "SEVERITY") {
        await updateIncidentSeverity(incident.id, severity)
      } else if (actionType === "ASSIGN") {
        if (!assignedTeam.trim()) {
          setError("Please specify a team name.")
          setLoading(false)
          return
        }
        await assignIncident(incident.id, assignedTeam.trim())
      } else if (actionType === "STATUS") {
        await updateIncidentStatus(incident.id, status)
      } else if (actionType === "RESOLVE") {
        await resolveIncident(incident.id, resolutionNotes.trim() || "Resolved")
      }

      setLoading(false)
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error(`Failed to execute ${actionType} action on incident:`, err)
      setError(err.message || `Failed to update incident on backend.`)
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (actionType) {
      case "SEVERITY":
        return "Update Incident Severity"
      case "ASSIGN":
        return "Assign / Reassign Team"
      case "STATUS":
        return "Transition Incident Status"
      case "RESOLVE":
        return "Resolve & Remediate Incident"
      default:
        return "Incident Workflow Action"
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              #INC-{incident.id}
            </span>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
              {getTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleActionSubmit} className="p-5 space-y-4 text-xs">
          {/* SEVERITY ACTION */}
          {actionType === "SEVERITY" && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                New Severity Classification
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <span className="text-[11px] text-slate-500 block mt-1.5">
                Contract: PATCH /api/incidents/{incident.id}/severity
              </span>
            </div>
          )}

          {/* ASSIGN ACTION */}
          {actionType === "ASSIGN" && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Assigned Team or Group
              </label>
              <input
                type="text"
                required
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                placeholder="e.g. SecOps Tier 1, Incident Response, Cloud Security"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["SecOps Tier 1", "Threat Response", "Network Security", "Cloud DevOps"].map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setAssignedTeam(team)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition"
                  >
                    + {team}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 block mt-2">
                Contract: PATCH /api/incidents/{incident.id}/assign
              </span>
            </div>
          )}

          {/* STATUS ACTION */}
          {actionType === "STATUS" && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Transition Lifecycle State
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="OPEN">OPEN</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
              <span className="text-[11px] text-slate-500 block mt-1.5">
                Contract: PATCH /api/incidents/{incident.id}/status
              </span>
            </div>
          )}

          {/* RESOLVE ACTION */}
          {actionType === "RESOLVE" && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Remediation / Resolution Notes
              </label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail the root cause, remediation steps applied, and verification..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
              <span className="text-[11px] text-slate-500 block mt-1.5">
                Contract: PATCH /api/incidents/{incident.id}/resolve
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50"
            >
              {loading && (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>Confirm Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IncidentActionsModal
