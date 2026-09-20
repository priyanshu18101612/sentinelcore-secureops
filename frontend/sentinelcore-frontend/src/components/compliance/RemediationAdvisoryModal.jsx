import { useState, useEffect } from "react"
import { getRemediationAdvisories } from "../../services/api"

export default function RemediationAdvisoryModal({ isOpen, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [filter, setFilter] = useState("ALL") // ALL, VULNERABILITY, INCIDENT

  useEffect(() => {
    if (!isOpen) return
    let ignore = false
    getRemediationAdvisories()
      .then((res) => {
        if (!ignore) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load advisories", err)
          setError(err.message || "Failed to load remediation advisories")
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [isOpen])

  const handleRefresh = () => {
    setLoading(true)
    setError(null)
    getRemediationAdvisories()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load advisories", err)
        setError(err.message || "Failed to load remediation advisories")
        setLoading(false)
      })
  }

  if (!isOpen) return null

  const advisories = data?.advisories || []
  const filteredAdvisories = advisories.filter((adv) => {
    if (filter === "ALL") return true
    return adv.category === filter
  })

  const handleCopy = (id, text) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30"
      case "HIGH":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "LOW":
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider uppercase">
                Phase 6 Governance Engine
              </span>
              <span className="text-xs text-slate-400">
                Host: <strong className="text-slate-200">{data?.monitoredHost || "LOCAL-WORKSTATION-HOST"}</strong>
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Automated Remediation Advisory & Playbooks
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-lg"
          >
            âœ•
          </button>
        </div>

        {/* Informational Disclaimer Banner */}
        <div className="p-3.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {data?.disclaimer ||
              "Informational remediation advisory only. No automatic code changes, package mutations, or system state modifications are performed."}
          </span>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950 border-b border-slate-800/80 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Current Readiness</span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {data ? `${data.currentReadinessScore.toFixed(1)} / 100` : "--"}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Max Potential Recovery</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
              {data ? `+${data.totalPotentialRecovery.toFixed(1)} pts` : "--"}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Advisories</span>
            <span className="text-lg font-bold text-indigo-400 mt-0.5 block">
              {data ? data.totalAdvisories : "--"}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Audit Attribution</span>
            <span className="text-xs font-semibold text-slate-300 mt-1 block">
              LOCAL-WORKSTATION
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              All ({advisories.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("VULNERABILITY")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === "VULNERABILITY"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Vulnerabilities ({advisories.filter((a) => a.category === "VULNERABILITY").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("INCIDENT")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === "INCIDENT"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Incidents ({advisories.filter((a) => a.category === "INCIDENT").length})
            </button>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Advisories"}
          </button>
        </div>

        {/* Modal Body / Advisory List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Calculating live remediation advisories and projected Readiness Score deltas...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/50 border border-rose-800 text-rose-200 rounded-xl">
              {error}
            </div>
          ) : filteredAdvisories.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              No active remediation advisories match the selected filter.
            </div>
          ) : (
            filteredAdvisories.map((adv) => (
              <div
                key={adv.id}
                className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-3"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getSeverityBadgeClass(
                        adv.severity
                      )}`}
                    >
                      {adv.severity}
                    </span>
                    <span className="font-mono font-semibold text-white text-xs">
                      {adv.cveId !== "N/A" ? adv.cveId : adv.findingId}
                    </span>
                    <span className="text-slate-400 text-[11px]">â€¢ {adv.scanSource}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                      +{adv.projectedScoreDelta.toFixed(1)} pts Î”Score
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Projected: <strong className="text-slate-200">{adv.projectedReadinessScore.toFixed(1)}</strong>
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-xs font-semibold text-white">{adv.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{adv.riskSummary}</p>
                </div>

                {/* Technical Specs: Component, Installed Version, Fixed Version */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Component:</span>
                    <span className="font-mono text-slate-300 truncate block" title={adv.component}>
                      {adv.component}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Installed Version:</span>
                    <span className="font-mono text-slate-300">
                      {adv.installedVersion || "Not available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Recommended Fixed Version:</span>
                    <span
                      className={`font-mono font-medium ${
                        adv.fixedVersion && adv.fixedVersion !== "Not available"
                          ? "text-emerald-300"
                          : "text-slate-400"
                      }`}
                    >
                      {adv.fixedVersion || "Not available"}
                    </span>
                  </div>
                </div>

                {/* Playbook Action & Copy Button */}
                <div className="flex items-start justify-between gap-3 p-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-lg">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-indigo-400 font-bold text-xs mt-0.5">â–¶</span>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block">
                        Recommended Remediation Playbook
                      </span>
                      <p className="text-xs text-indigo-200 mt-0.5 font-sans leading-relaxed">
                        {adv.remediationAction}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(adv.id, adv.remediationAction)}
                    className="px-2.5 py-1 shrink-0 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-md text-[11px] font-medium transition-colors flex items-center gap-1"
                  >
                    {copiedId === adv.id ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Action
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Showing {filteredAdvisories.length} of {advisories.length} advisories
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
