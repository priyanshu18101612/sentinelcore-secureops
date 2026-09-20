import { useState, useEffect, useCallback } from "react"
import { getAuditLogs, verifyAuditChain, getAuditStats } from "../../services/api"

export default function AuditLogIntegrityView() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("ALL")
  const [entityType, setEntityType] = useState("ALL")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [logsData, statsData] = await Promise.all([
        getAuditLogs({
          category: category !== "ALL" ? category : undefined,
          entityType: entityType !== "ALL" ? entityType : undefined,
          search: search.trim() || undefined,
        }),
        getAuditStats(),
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (err) {
      console.error("Failed to load audit data", err)
      setError(err.message || "Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }, [category, entityType, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 200)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleVerifyChain = async () => {
    try {
      setVerifying(true)
      const res = await verifyAuditChain()
      setVerificationResult(res)
      // Refresh stats
      const updatedStats = await getAuditStats()
      setStats(updatedStats)
    } catch (err) {
      console.error("Verification failed", err)
      setVerificationResult({
        status: "ERROR",
        tamperDetected: true,
        message: err.message || "Verification request failed",
      })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Audit Logs</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stats ? stats.totalLogs.toLocaleString() : "--"}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            Actual Database Records
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chain Integrity</div>
          <div className="text-2xl font-bold mt-1">
            {stats && stats.tamperDetected ? (
              <span className="text-rose-400">TAMPER DETECTED</span>
            ) : (
              <span className="text-emerald-400">VERIFIED</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">SHA-256 Block Chained</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Retention Policy</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stats ? `${stats.retentionYears} Years` : "7 Years"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Regulatory Standard</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">At-Rest Protection</div>
          <div className="text-2xl font-bold text-white mt-1">AES-256</div>
          <div className="text-xs text-emerald-400 mt-1">Encrypted Store</div>
        </div>
      </div>

      {/* Verification Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Cryptographic Tamper-Evidence Verification
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Iterates through the entire sequential audit chain to verify that no historical log entry has been altered or deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={handleVerifyChain}
          disabled={verifying}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {verifying ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Verifying Chain...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Verify Chain Integrity
            </>
          )}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            verificationResult.tamperDetected
              ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
              : "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
          }`}
        >
          <div className="mt-0.5">
            {verificationResult.tamperDetected ? (
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div>
            <strong className="block text-sm font-semibold">
              {verificationResult.tamperDetected ? "TAMPER DETECTED" : "VERIFIED — IMMUTABLE CHAIN VALID"}
            </strong>
            <p className="text-xs opacity-90 mt-0.5">{verificationResult.message}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search action, actor, details, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="INCIDENT_MANAGEMENT">Incident Management</option>
            <option value="VULNERABILITY_MANAGEMENT">Vulnerability Management</option>
            <option value="ACCESS_CONTROL">Access Control</option>
            <option value="SECURITY_EVENT">Security Event</option>
            <option value="COMPLIANCE_EVALUATION">Compliance Evaluation</option>
            <option value="GOVERNANCE_REPORTING">Governance Reporting</option>
          </select>

          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Entities</option>
            <option value="INCIDENT">Incident</option>
            <option value="VULNERABILITY">Vulnerability</option>
            <option value="AUTH">Authentication</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="REPORT">Report</option>
            <option value="SECURITY_REVIEW">Security Review</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Loading immutable audit logs...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            Error loading audit logs: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No audit records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 font-mono">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "--"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">
                      {log.actor || "System"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {log.entityType || "INCIDENT"}
                      {log.entityId ? ` #${log.entityId}` : ""}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {log.category || "SECURITY_EVENT"}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={log.details}>
                      {log.details || "--"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap" title={`Prev: ${log.previousHash || 'None'}`}>
                      {log.hash ? `${log.hash.substring(0, 16)}...` : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
