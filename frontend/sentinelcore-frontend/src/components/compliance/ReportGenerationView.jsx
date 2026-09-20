import { useState, useEffect } from "react"
import {
  getReports,
  generateReport,
  verifyReportAttestation,
  getReportAttestationBundleUrl,
} from "../../services/api"

export default function ReportGenerationView() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)

  // Attestation Verification State (Phase 6)
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationError, setVerificationError] = useState(null)

  const loadReports = () => {
    setLoading(true)
    setError(null)
    getReports()
      .then((data) => {
        setReports(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load reports", err)
        setError(err.message || "Failed to load reports")
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getReports()
      .then((data) => {
        if (!ignore) {
          setReports(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load reports", err)
          setError(err.message || "Failed to load reports")
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  // Handle report selection and reset verification state without cascading effect
  const handleSelectReport = (report) => {
    setSelectedReport(report)
    setVerificationResult(null)
    setVerificationError(null)
  }

  const handleGenerate = async (type) => {
    try {
      setGenerating(true)
      setError(null)
      const newReport = await generateReport({
        type,
        generatedBy: "Lead SecOps Engineer",
      })
      setReports((prev) => [newReport, ...prev])
      handleSelectReport(newReport)
    } catch (err) {
      console.error("Failed to generate report", err)
      setError(err.message || "Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const handleVerifyAttestation = async (id) => {
    try {
      setVerifying(true)
      setVerificationError(null)
      const res = await verifyReportAttestation(id)
      setVerificationResult(res)
    } catch (err) {
      console.error("Verification failed", err)
      setVerificationError(err.message || "Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  const handlePrintOrExport = () => {
    window.print()
  }

  const reportCards = [
    {
      type: "DEVSECOPS_EXECUTIVE_ATTESTATION",
      name: "Executive DevSecOps Attestation",
      description: "Cryptographically bound, tamper-evident SHA-256 executive attestation brief synthesizing M1 telemetry, M2 incidents, M3 CVEs, and M4 compliance.",
      badge: "Board & CISO Brief",
      highlight: true,
    },
    {
      type: "SECURITY_REPORT",
      name: "Security Summary Report",
      description: "Aggregated executive snapshot of total vulnerabilities, incident MTTR, active alerts, and fleet risk.",
      badge: "SecOps Executive",
    },
    {
      type: "COMPLIANCE_REPORT",
      name: "Compliance Audit Report",
      description: "Formal audit proof mapped against PCI DSS v4.0, SOC 2 Type II, and ISO 27001 control evaluations.",
      badge: "Regulatory / Auditor",
    },
    {
      type: "ACCESS_REPORT",
      name: "Access & Identity Report",
      description: "Comprehensive authentication activity, session records, failed login rates, and privilege usage.",
      badge: "IAM & Access",
    },
    {
      type: "DEVSECOPS_REPORT",
      name: "DevSecOps Posture Report",
      description: "Integrated CI/CD vulnerability metrics across SonarQube SAST, Trivy container findings, and patch rates.",
      badge: "Pipeline Governance",
    },
  ]

  let parsedSummary = null
  if (selectedReport?.summaryData) {
    try {
      parsedSummary = JSON.parse(selectedReport.summaryData)
    } catch {
      parsedSummary = { raw: selectedReport.summaryData }
    }
  }

  const isAttestation = selectedReport?.reportType === "DEVSECOPS_EXECUTIVE_ATTESTATION"

  return (
    <div className="space-y-6">
      {/* Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #attestation-printable-modal, #attestation-printable-modal * {
            visibility: visible;
          }
          #attestation-printable-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* Report Generation Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {reportCards.map((rc) => (
          <div
            key={rc.type}
            className={`rounded-xl p-5 flex flex-col justify-between border ${
              rc.highlight
                ? "bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-950/20"
                : "bg-slate-900 border-slate-800"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    rc.highlight
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {rc.badge}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Ready</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-2.5">{rc.name}</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{rc.description}</p>
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={() => handleGenerate(rc.type)}
              className={`mt-4 w-full py-2 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                rc.highlight
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {generating ? "Generating..." : "Generate Report"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Reports Archive / History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Generated Reports Archive</h4>
            <p className="text-xs text-slate-400 mt-0.5">Audit evidence generated from actual database metrics</p>
          </div>
          <button
            type="button"
            onClick={loadReports}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No reports generated yet. Click "Generate Report" above to compile an audit report from live platform data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Generated At</th>
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Generated By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {r.generatedAt ? new Date(r.generatedAt).toLocaleString() : "--"}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{r.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-mono ${
                          r.reportType === "DEVSECOPS_EXECUTIVE_ATTESTATION"
                            ? "bg-indigo-950/60 border-indigo-700/60 text-indigo-300"
                            : "bg-slate-800 border-slate-700 text-slate-300"
                        }`}
                      >
                        {r.reportType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">{r.generatedBy}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-emerald-400 font-semibold">{r.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSelectReport(r)}
                        className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 hover:text-white rounded font-medium cursor-pointer transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            id="attestation-printable-modal"
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 no-print">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                  REPORT ID #{selectedReport.id} â€¢ {selectedReport.reportType}
                </span>
                <h3 className="text-base font-bold text-white">{selectedReport.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {isAttestation && (
                  <>
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => handleVerifyAttestation(selectedReport.id)}
                      className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                      title="Verify SHA-256 historical digest against stored canonical payload and immutable audit logs"
                    >
                      <svg className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {verifying ? "Verifying..." : "Verify Integrity"}
                    </button>

                    <a
                      href={getReportAttestationBundleUrl(selectedReport.id)}
                      download={`sentinelcore-attestation-${selectedReport.id}.json`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                      title="Download full canonical attestation JSON bundle"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download JSON
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={handlePrintOrExport}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Export
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectReport(null)}
                  className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
                >
                  âœ•
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Verification Result Banner (Phase 6) */}
              {verificationResult && (
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                    verificationResult.status === "INTEGRITY_VERIFIED"
                      ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
                      : "bg-rose-950/50 border-rose-700/60 text-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {verificationResult.status === "INTEGRITY_VERIFIED" ? "âœ“" : "âš "} {verificationResult.status}
                      </span>
                      <span className="text-[11px] opacity-80 font-mono">
                        (Report #{verificationResult.reportId})
                      </span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono">
                      Verified: {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-90">{verificationResult.message}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono mt-1 p-2 bg-black/30 rounded-lg">
                    <div className="truncate">
                      <span className="opacity-70">Stored SHA-256: </span>
                      <span className="text-slate-200">{verificationResult.storedDigest || "--"}</span>
                    </div>
                    <div className="truncate">
                      <span className="opacity-70">Recalculated: </span>
                      <span className="text-slate-200">{verificationResult.recalculatedDigest || "--"}</span>
                    </div>
                    <div>
                      <span className="opacity-70">Audit Chain Backed: </span>
                      <span className={verificationResult.auditLogChainBacked ? "text-emerald-300" : "text-rose-300"}>
                        {verificationResult.auditLogChainBacked ? `YES (Log ID #${verificationResult.auditLogId})` : "NO"}
                      </span>
                    </div>
                    <div className="truncate">
                      <span className="opacity-70">Audit Block Hash: </span>
                      <span className="text-slate-300">{verificationResult.auditLogHash || "--"}</span>
                    </div>
                  </div>
                </div>
              )}

              {verificationError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-xl">
                  {verificationError}
                </div>
              )}

              {/* Metadata strip */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400">
                <div>
                  <span className="block text-[11px]">Author / Reviewer:</span>
                  <strong className="text-white">{selectedReport.generatedBy}</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Timestamp:</span>
                  <strong className="text-white">
                    {new Date(selectedReport.generatedAt).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Attestation Specialized Content (Phase 6) */}
              {isAttestation && parsedSummary && (
                <div className="space-y-4">
                  {/* Cryptographic Integrity Section */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <span className="text-indigo-400">ðŸ”’</span> Cryptographic Tamper-Evident Integrity
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Algorithm: SHA-256 (Canonical JSON)
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300 break-all">
                      {parsedSummary.tamperEvidentIntegrityDigest || "--"}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      {parsedSummary.tamperEvidentIntegrityNotice ||
                        "Deterministic SHA-256 integrity hash guaranteeing historical database payload immutability. Not an asymmetric PKI digital signature."}
                    </p>
                  </div>

                  {/* Unified Readiness Breakdown */}
                  {parsedSummary.readinessScore && (
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                      <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2.5">
                        Unified Operational Readiness Score
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Overall Score</span>
                          <span className="text-base font-bold text-indigo-400 mt-0.5 block">
                            {parsedSummary.readinessScore.overallScore?.toFixed(1)} / 100
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Security (40%)</span>
                          <span className="text-sm font-semibold text-white mt-0.5 block">
                            {parsedSummary.readinessScore.securityScore?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Compliance (30%)</span>
                          <span className="text-sm font-semibold text-white mt-0.5 block">
                            {parsedSummary.readinessScore.complianceScore?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Infra Health (30%)</span>
                          <span className="text-sm font-semibold text-white mt-0.5 block">
                            {parsedSummary.readinessScore.infrastructureScore?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Telemetry Snapshot Strip */}
                  {parsedSummary.telemetrySnapshot && (
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                      <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
                        Workstation Telemetry Snapshot (M1)
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">CPU Usage:</span>
                          <strong className="text-white">
                            {parsedSummary.telemetrySnapshot.cpuUsagePercent !== null ? `${parsedSummary.telemetrySnapshot.cpuUsagePercent}%` : "--"}
                          </strong>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">Memory Usage:</span>
                          <strong className="text-white">
                            {parsedSummary.telemetrySnapshot.memoryUsagePercent !== null ? `${parsedSummary.telemetrySnapshot.memoryUsagePercent}%` : "--"}
                          </strong>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">Disk Usage:</span>
                          <strong className="text-white">
                            {parsedSummary.telemetrySnapshot.diskUsagePercent !== null ? `${parsedSummary.telemetrySnapshot.diskUsagePercent}%` : "--"}
                          </strong>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-slate-400 text-[10px] block">Network Latency:</span>
                          <strong className="text-white">
                            {parsedSummary.telemetrySnapshot.networkLatencyMs !== null ? `${parsedSummary.telemetrySnapshot.networkLatencyMs} ms` : "--"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Framework Readiness Evidence Statements */}
                  {parsedSummary.complianceSummary?.frameworkReadinessStatements && (
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                      <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
                        Framework Readiness Evidence Statements (M4)
                      </h5>
                      <ul className="space-y-1.5 text-slate-300 text-[11px]">
                        {parsedSummary.complianceSummary.frameworkReadinessStatements.map((stmt, idx) => (
                          <li key={idx} className="flex items-start gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-800/60">
                            <span className="text-indigo-400 font-bold">Â§</span>
                            <span>{stmt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Raw JSON / Database Evidence */}
              <div>
                <h5 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Canonical Database Evidence Payload
                </h5>
                <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-60">
                  {JSON.stringify(parsedSummary, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
