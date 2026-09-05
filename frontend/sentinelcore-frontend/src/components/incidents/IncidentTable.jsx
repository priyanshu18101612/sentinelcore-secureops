function IncidentTable({
  incidents = [],
  onSelectIncident,
  onOpenActionModal,
}) {
  const getSeverityBadge = (severity) => {
    const sev = (severity || "").toUpperCase()
    switch (sev) {
      case "CRITICAL":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
            CRITICAL
          </span>
        )
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
            HIGH
          </span>
        )
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
            MEDIUM
          </span>
        )
      case "LOW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
            LOW
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
            {severity || "UNKNOWN"}
          </span>
        )
    }
  }

  const getStatusBadge = (status) => {
    const st = (status || "").toUpperCase()
    switch (st) {
      case "OPEN":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider">
            OPEN
          </span>
        )
      case "ASSIGNED":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 tracking-wider">
            ASSIGNED
          </span>
        )
      case "INVESTIGATING":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wider animate-pulse">
            INVESTIGATING
          </span>
        )
      case "RESOLVED":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-wider">
            RESOLVED
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 tracking-wider">
            {status || "UNKNOWN"}
          </span>
        )
    }
  }

  const getSlaBadge = (incident) => {
    const sla = (incident.slaStatus || "").toUpperCase()
    if (sla === "BREACHED" || incident.slaBreached === true) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          BREACHED
        </span>
      )
    }
    if (sla === "AT_RISK") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          AT RISK
        </span>
      )
    }
    if (sla === "WITHIN_SLA" || sla === "HEALTHY") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          WITHIN SLA
        </span>
      )
    }
    return (
      <span className="text-slate-500 font-mono text-[11px]">
        {incident.slaStatus || "N/A"}
      </span>
    )
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      return d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return String(dateStr)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
          <tr>
            <th className="py-3.5 px-5">Incident ID</th>
            <th className="py-3.5 px-5">Title & Summary</th>
            <th className="py-3.5 px-5">Severity</th>
            <th className="py-3.5 px-5">Status</th>
            <th className="py-3.5 px-5">Assigned Team</th>
            <th className="py-3.5 px-5">Created Time</th>
            <th className="py-3.5 px-5">SLA</th>
            <th className="py-3.5 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {incidents.map((incident) => {
            const isResolved = (incident.status || "").toUpperCase() === "RESOLVED"

            return (
              <tr
                key={incident.id}
                className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => onSelectIncident(incident)}
              >
                {/* ID */}
                <td className="py-3.5 px-5 font-mono text-cyan-400 font-bold whitespace-nowrap">
                  #INC-{incident.id}
                </td>

                {/* Title / Description */}
                <td className="py-3.5 px-5 max-w-xs">
                  <div className="font-semibold text-white truncate">
                    {incident.title || `Incident #${incident.id}`}
                  </div>
                  {incident.description && (
                    <div className="text-slate-400 text-[11px] truncate mt-0.5">
                      {incident.description}
                    </div>
                  )}
                </td>

                {/* Severity */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  {getSeverityBadge(incident.severity)}
                </td>

                {/* Status */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  {getStatusBadge(incident.status)}
                </td>

                {/* Assigned Team */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  {incident.assignedTeam ? (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700/60">
                      {incident.assignedTeam}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Created Time */}
                <td className="py-3.5 px-5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                  {formatDate(incident.createdAt)}
                </td>

                {/* SLA Status */}
                <td className="py-3.5 px-5 whitespace-nowrap">
                  {getSlaBadge(incident)}
                </td>

                {/* Actions */}
                <td
                  className="py-3.5 px-5 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Details */}
                    <button
                      onClick={() => onSelectIncident(incident)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition"
                      title="View complete incident details"
                    >
                      Details
                    </button>

                    {/* Quick Workflow Actions */}
                    {!isResolved && (
                      <>
                        <button
                          onClick={() => onOpenActionModal("ASSIGN", incident)}
                          className="px-2.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition"
                          title="Assign or reassign team"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => onOpenActionModal("STATUS", incident)}
                          className="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition"
                          title="Transition lifecycle status"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => onOpenActionModal("RESOLVE", incident)}
                          className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                          title="Resolve incident"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default IncidentTable
