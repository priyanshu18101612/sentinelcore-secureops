import IncidentSlaPanel from "./IncidentSlaPanel"
import IncidentAuditPanel from "./IncidentAuditPanel"

function IncidentDetailsDrawer({
  incident,
  onClose,
  onOpenActionModal,
}) {
  if (!incident) return null

  const isResolved = (incident.status || "").toUpperCase() === "RESOLVED"

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    try {
      return new Date(dateStr).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return String(dateStr)
    }
  }

  const getSeverityBadge = (severity) => {
    const sev = (severity || "").toUpperCase()
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30"
      case "HIGH":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30"
      case "MEDIUM":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30"
      case "LOW":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30"
      default:
        return "bg-slate-800 text-slate-400 border-slate-700"
    }
  }

  const getStatusBadge = (status) => {
    const st = (status || "").toUpperCase()
    switch (st) {
      case "OPEN":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
      case "ASSIGNED":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
      case "INVESTIGATING":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
      case "RESOLVED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      default:
        return "bg-slate-800 text-slate-300 border-slate-700"
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl shadow-black overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                #INC-{incident.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                  incident.severity
                )}`}
              >
                {incident.severity || "MEDIUM"}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wider ${getStatusBadge(
                  incident.status
                )}`}
              >
                {incident.status || "OPEN"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {incident.title || `Incident #${incident.id}`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Close details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary / Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Incident Description
            </h3>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-200 text-xs leading-relaxed">
              {incident.description || "No description provided."}
            </div>
          </div>

          {/* Workflow & Assignment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Assigned Team
              </span>
              <span className="text-sm font-bold text-white mt-1 block">
                {incident.assignedTeam || (
                  <span className="text-slate-500 italic font-normal text-xs">
                    Unassigned
                  </span>
                )}
              </span>
              {incident.assignedAt && (
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  Assigned: {formatDate(incident.assignedAt)}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Status
              </span>
              <span className="text-sm font-bold text-white mt-1 block">
                {incident.status || "OPEN"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Updated: {formatDate(incident.updatedAt || incident.createdAt)}
              </span>
            </div>
          </div>

          {/* Resolution Details (if resolved) */}
          {isResolved && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span>Remediation & Resolution</span>
                <span className="font-mono text-[10px] text-emerald-500">
                  {formatDate(incident.resolvedAt)}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {incident.resolutionNotes || "Remediated without specific notes."}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-2 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Timeline Metadata
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block">Created At</span>
                <span className="font-mono text-slate-300">
                  {formatDate(incident.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Modified</span>
                <span className="font-mono text-slate-300">
                  {formatDate(incident.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* SLA Tracking Component */}
          <div>
            <IncidentSlaPanel
              incidentId={incident.id}
              incidentSlaData={incident.sla}
            />
          </div>

          {/* Audit History Component */}
          <div>
            <IncidentAuditPanel
              incidentId={incident.id}
              incidentAuditLogs={incident.auditLogs}
            />
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Close
          </button>

          {!isResolved && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenActionModal("SEVERITY", incident)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                Severity
              </button>
              <button
                onClick={() => onOpenActionModal("ASSIGN", incident)}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
              >
                Assign
              </button>
              <button
                onClick={() => onOpenActionModal("STATUS", incident)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
              >
                Status
              </button>
              <button
                onClick={() => onOpenActionModal("RESOLVE", incident)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IncidentDetailsDrawer
