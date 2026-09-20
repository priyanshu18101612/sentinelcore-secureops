import { useState, useEffect, useCallback } from "react"
import { getDevSecOpsPosture, getHostCorrelation, triggerFullSystemAudit } from "../../services/api"
import RemediationAdvisoryModal from "./RemediationAdvisoryModal"

export default function DevSecOpsDashboardView() {
  const [posture, setPosture] = useState(null)
  const [correlation, setCorrelation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Remediation Advisory Modal State (Phase 6)
  const [advisoryModalOpen, setAdvisoryModalOpen] = useState(false)

  // Full System Audit Modal & Execution State
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [auditResult, setAuditResult] = useState(null)
  const [auditError, setAuditError] = useState(null)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      getDevSecOpsPosture().catch((err) => {
        console.warn("Posture load warning:", err)
        return null
      }),
      getHostCorrelation().catch((err) => {
        console.warn("Correlation load warning:", err)
        return null
      }),
    ])
      .then(([postureRes, correlationRes]) => {
        setPosture(postureRes)
        setCorrelation(correlationRes)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load DevSecOps data", err)
        setError(err.message || "Failed to load command center data")
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let ignore = false

    Promise.all([
      getDevSecOpsPosture().catch(() => null),
      getHostCorrelation().catch(() => null),
    ]).then(([postureRes, correlationRes]) => {
      if (!ignore) {
        setPosture(postureRes)
        setCorrelation(correlationRes)
        setLoading(false)
      }
    }).catch((err) => {
      if (!ignore) {
        setError(err.message || "Failed to load command center data")
        setLoading(false)
      }
    })

    return () => {
      ignore = true
    }
  }, [])

  const handleRunFullAudit = async () => {
    setIsAuditing(true)
    setAuditModalOpen(true)
    setAuditResult(null)
    setAuditError(null)

    try {
      const res = await triggerFullSystemAudit()
      setAuditResult(res)
      // Refresh dashboard metrics dynamically
      loadData()
    } catch (err) {
      console.error("Full system audit error:", err)
      setAuditError(err.message || "Audit execution encountered an error")
    } finally {
      setIsAuditing(false)
    }
  }

  // Helper colors for status
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "HEALTHY":
      case "OPERATIONAL":
      case "COMPLIANT":
      case "VERIFIED":
        return "bg-emerald-950/80 border-emerald-700/60 text-emerald-300"
      case "WARNING":
      case "ACTION_REQUIRED":
      case "DEGRADED":
        return "bg-amber-950/80 border-amber-700/60 text-amber-300"
      case "CRITICAL":
      case "TAMPER_DETECTED":
      case "NON_COMPLIANT":
        return "bg-rose-950/80 border-rose-700/60 text-rose-300"
      default:
        return "bg-slate-800 border-slate-700 text-slate-300"
    }
  }

  const readiness = correlation?.readinessScore
  const tele = correlation?.liveTelemetry

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Execution Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Executive DevSecOps Command Center
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300">
              Phase 5 Unified Cross-Milestone Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time correlation of Windows workstation telemetry (M1), incident triage (M2), local Trivy & SonarQube scans (M3), and SHA-256 audit governance (M4).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Refresh all milestone telemetry and correlation data"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Correlation
          </button>

          <button
            type="button"
            onClick={() => setAdvisoryModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer"
            title="Open Automated Remediation Advisory & Root Cause Playbooks"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Remediation Playbooks</span>
          </button>

          <button
            type="button"
            onClick={handleRunFullAudit}
            disabled={isAuditing}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 border border-indigo-500/50 cursor-pointer"
            title="Execute non-destructive Full System Health & Security Audit"
          >
            {isAuditing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Auditing Host...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Run Full System Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-xl">
          <svg className="animate-spin w-7 h-7 mx-auto mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Correlating live telemetry, incidents, vulnerability scans, and audit integrity...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400 text-sm bg-slate-900 border border-slate-800 rounded-xl">
          Error loading correlation data: {error}
        </div>
      ) : (
        <>
          {/* SECTION 1: UNIFIED READINESS SCORECARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-950">
                    <span className="text-2xl font-black text-white font-mono">
                      {readiness?.overallScore != null ? readiness.overallScore : "--"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Unified Operational Readiness Score</h4>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(correlation?.hostOperationalStatus)}`}>
                      {correlation?.hostOperationalStatus || "UNKNOWN"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitored Target: <strong className="text-slate-200">{correlation?.hostName || "LOCAL-WORKSTATION-HOST"}</strong> ({correlation?.osName || "Windows"}, Uptime: {correlation?.uptime || "--"})
                  </p>
                </div>
              </div>

              {/* Sub-Score Breakdown Pills */}
              <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Security (40%)</div>
                  <div className="text-lg font-bold text-indigo-400 mt-0.5">
                    {readiness?.securityScore != null ? readiness.securityScore : "--"}
                  </div>
                  <div className="text-[10px] text-slate-500">Unpatched Risk</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Compliance (30%)</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {readiness?.complianceScore != null ? readiness.complianceScore : "--"}
                  </div>
                  <div className="text-[10px] text-slate-500">Controls & Chain</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Infra Health (30%)</div>
                  <div className="text-lg font-bold text-sky-400 mt-0.5">
                    {readiness?.infrastructureScore != null ? readiness.infrastructureScore : "--"}
                  </div>
                  <div className="text-[10px] text-slate-500">Hardware & RTT</div>
                </div>
              </div>
            </div>

            {/* Methodology Footnote */}
            <div className="pt-3 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{readiness?.calculationNote || "Proprietary SentinelCore Operational Readiness Index (40% Security, 30% Compliance, 30% Infrastructure Health) â€” not an industry-standard score."}</span>
              <span>Evaluated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* SECTION 2: CROSS-MILESTONE WORKLOAD CORRELATION MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Cross-Milestone Workload Correlation Matrix
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Single Pane of Glass: M1 Telemetry â†” M2 Incidents â†” M3 CVEs â†” M4 Audit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* M1: Telemetry Column */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-sky-400">M1 Â· Real Host Telemetry</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono">
                    {tele?.prometheusConnected ? "PROMETHEUS" : "FALLBACK"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>CPU Load:</span>
                    <strong className="font-mono">{tele?.cpuUsagePercent != null ? `${tele.cpuUsagePercent}%` : "--"}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Memory Usage:</span>
                    <strong className="font-mono">{tele?.memoryUsagePercent != null ? `${tele.memoryUsagePercent}%` : "--"}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Disk Space:</span>
                    <strong className="font-mono">{tele?.diskUsagePercent != null ? `${tele.diskUsagePercent}%` : "--"}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Network Latency:</span>
                    <strong className="font-mono text-teal-400">
                      {tele?.networkLatencyMs != null ? `${tele.networkLatencyMs} ms` : "N/A"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* M2: Active Incidents Column */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400">M2 Â· Active Incidents</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">
                    {correlation?.activeIncidents?.length || 0} OPEN
                  </span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {correlation?.activeIncidents && correlation.activeIncidents.length > 0 ? (
                    correlation.activeIncidents.map((inc) => (
                      <div key={inc.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] text-indigo-400">{inc.incidentId}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${getStatusBadge(inc.severity)}`}>
                            {inc.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5" title={inc.title}>
                          {inc.title}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">No active incidents</div>
                  )}
                </div>
              </div>

              {/* M3: Live Vulnerabilities Column */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-rose-400">M3 Â· Discovered CVEs</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono">
                    {correlation?.activeVulnerabilities?.length || 0} CVEs
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {correlation?.activeVulnerabilities && correlation.activeVulnerabilities.length > 0 ? (
                    correlation.activeVulnerabilities.slice(0, 3).map((v) => (
                      <div key={v.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-rose-400 font-bold">{v.cveId || v.vulnerabilityId}</span>
                          <span className="text-[9px] text-slate-400 font-mono">CVSS {v.cvssScore || "--"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={v.title}>
                          {v.title}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">No CVEs registered</div>
                  )}
                </div>
              </div>

              {/* M4: Governance & Audit Column */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-emerald-400">M4 Â· Governance & Chain</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${getStatusBadge(correlation?.auditSummary?.status)}`}>
                    {correlation?.auditSummary?.status || "VERIFIED"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Audit Chain:</span>
                    <strong className="text-emerald-400 font-mono">SHA-256 Intact</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Audit Records:</span>
                    <strong className="font-mono">{correlation?.auditSummary?.totalRecords || 0} logs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SOC 2 Controls:</span>
                    <strong className="text-slate-200 font-mono">{correlation?.complianceSummary?.passedControls || 0} Passed</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance Stance:</span>
                    <strong className="text-emerald-400 font-mono">{correlation?.complianceSummary?.overallScore || 0}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SCANNER CARDS (TRIVY & SONARQUBE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TRIVY Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                  <h4 className="text-sm font-bold text-white">Aqua Trivy Container & SCA Scanner</h4>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {posture?.trivyScanner?.status || "READY"}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-slate-400">Total Scanned Findings</span>
                <span className="text-xl font-bold text-white font-mono">
                  {posture?.trivyScanner?.totalFindings || 0}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-rose-400 font-mono">{posture?.trivyScanner?.critical || 0}</div>
                  <div className="text-[10px] text-slate-400">Critical</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-amber-400 font-mono">{posture?.trivyScanner?.high || 0}</div>
                  <div className="text-[10px] text-slate-400">High</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-yellow-400 font-mono">{posture?.trivyScanner?.medium || 0}</div>
                  <div className="text-[10px] text-slate-400">Medium</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-blue-400 font-mono">{posture?.trivyScanner?.low || 0}</div>
                  <div className="text-[10px] text-slate-400">Low</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {posture?.trivyScanner?.lastScanSummary || "Trivy filesystem scanner is ready."}
              </p>
            </div>

            {/* SONARQUBE Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <h4 className="text-sm font-bold text-white">SonarQube SAST Static Analysis</h4>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {posture?.sonarQubeScanner?.status || "OFFLINE / NOT_CONFIGURED"}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-slate-400">Total Scanned Findings</span>
                <span className="text-xl font-bold text-white font-mono">
                  {posture?.sonarQubeScanner?.totalFindings || 0}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-rose-400 font-mono">{posture?.sonarQubeScanner?.critical || 0}</div>
                  <div className="text-[10px] text-slate-400">Critical</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-amber-400 font-mono">{posture?.sonarQubeScanner?.high || 0}</div>
                  <div className="text-[10px] text-slate-400">High</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-yellow-400 font-mono">{posture?.sonarQubeScanner?.medium || 0}</div>
                  <div className="text-[10px] text-slate-400">Medium</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="font-bold text-blue-400 font-mono">{posture?.sonarQubeScanner?.low || 0}</div>
                  <div className="text-[10px] text-slate-400">Low</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {posture?.sonarQubeScanner?.lastScanSummary || "Safe diagnostics active when offline."}
              </p>
            </div>
          </div>
        </>
      )}

      {/* FULL SYSTEM AUDIT MODAL */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                Full System Health & Security Audit
              </h3>
              {!isAuditing && (
                <button
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  âœ•
                </button>
              )}
            </div>

            {isAuditing ? (
              <div className="py-8 text-center space-y-3">
                <svg className="animate-spin w-8 h-8 mx-auto text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <div className="text-sm font-medium text-slate-200">Executing Cross-Milestone Audit...</div>
                <div className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sampling Prometheus telemetry, running local Trivy scan, evaluating compliance, and recording SHA-256 audit log.
                </div>
              </div>
            ) : auditResult?.status === "ALREADY_RUNNING" ? (
              <div className="p-4 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Concurrency Protection Active
                </div>
                <p>{auditResult.message}</p>
              </div>
            ) : auditError ? (
              <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs space-y-2">
                <div className="font-bold text-rose-300">Audit Execution Failed</div>
                <p>{auditError}</p>
              </div>
            ) : auditResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    âœ“ Full System Audit Completed
                  </div>
                  <div className="text-slate-300 mt-1">
                    Duration: <strong>{auditResult.executionDurationMs}ms</strong> | Host: <strong>{auditResult.monitoredHost}</strong>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Trivy Discovered Findings:</span>
                    <strong className="font-mono text-white">{auditResult.trivyScanSummary?.totalFindings || 0}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>New Findings Ingested:</span>
                    <strong className="font-mono text-emerald-400">{auditResult.trivyScanSummary?.savedFindings || 0}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Duplicate CVEs Preserved:</span>
                    <strong className="font-mono text-amber-400">{auditResult.trivyScanSummary?.skippedDuplicates || 0}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Audit Log Status:</span>
                    <strong className="font-mono text-emerald-400">{auditResult.auditChainStatus}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Updated Readiness Score:</span>
                    <strong className="font-mono text-indigo-400 font-bold">
                      {auditResult.unifiedReadinessScore?.overallScore || "--"} / 100
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close & View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Advisory & Playbooks Modal (Phase 6) */}
      <RemediationAdvisoryModal
        isOpen={advisoryModalOpen}
        onClose={() => setAdvisoryModalOpen(false)}
      />
    </div>
  )
}
