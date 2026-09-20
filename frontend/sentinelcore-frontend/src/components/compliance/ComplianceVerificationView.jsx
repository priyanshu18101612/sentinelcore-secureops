import { useState, useEffect } from "react"
import { getComplianceFrameworks, evaluateComplianceFrameworks } from "../../services/api"

export default function ComplianceVerificationView() {
  const [data, setData] = useState(null)
  const [selectedFramework, setSelectedFramework] = useState("PCI_DSS")
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState(null)

  const loadData = () => {
    setLoading(true)
    setError(null)
    getComplianceFrameworks()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load compliance frameworks", err)
        setError(err.message || "Failed to load compliance data")
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getComplianceFrameworks()
      .then((res) => {
        if (!ignore) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load compliance frameworks", err)
          setError(err.message || "Failed to load compliance data")
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true)
      const res = await evaluateComplianceFrameworks()
      setData(res)
    } catch (err) {
      console.error("Evaluation failed", err)
      setError(err.message || "Compliance evaluation failed")
    } finally {
      setEvaluating(false)
    }
  }

  const activeFramework = data?.frameworks?.find(
    (f) => f.framework.toUpperCase() === selectedFramework.toUpperCase()
  )

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Regulatory Compliance Verification</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800 text-blue-300">
              Application Validation Checks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Automated internal validation policies mapped against PCI DSS v4.0, SOC 2 Type II, and ISO 27001 standards.
            Demonstrates real operational alignment across M1 telemetry, M2 incidents, and M3 CVE remediation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={evaluating}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
          {evaluating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Evaluating Controls...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Compliance Check
            </>
          )}
        </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-xl">
          <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Loading compliance evaluations...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400 text-sm bg-slate-900 border border-slate-800 rounded-xl">
          Error: {error}
        </div>
      ) : (
        <>
          {/* Framework Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.frameworks?.map((fw) => {
              const isSelected = selectedFramework.toUpperCase() === fw.framework.toUpperCase()
              return (
                <div
                  key={fw.framework}
                  onClick={() => setSelectedFramework(fw.framework)}
                  className={`cursor-pointer rounded-xl p-5 border transition-all ${
                    isSelected
                      ? "bg-slate-850 border-blue-500 shadow-md ring-1 ring-blue-500"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-slate-400">{fw.framework}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        fw.status === "COMPLIANT"
                          ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
                          : fw.status === "PARTIALLY_COMPLIANT"
                          ? "bg-amber-950/70 border border-amber-800 text-amber-300"
                          : "bg-rose-950/70 border border-rose-800 text-rose-300"
                      }`}
                    >
                      {fw.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2">{fw.name}</h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white">{fw.complianceScore}%</span>
                    <span className="text-xs text-slate-400">Score</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center text-xs">
                    <div>
                      <div className="font-bold text-emerald-400">{fw.passedControls}</div>
                      <div className="text-[11px] text-slate-400">Passed</div>
                    </div>
                    <div>
                      <div className="font-bold text-amber-400">{fw.warningControls}</div>
                      <div className="text-[11px] text-slate-400">Warnings</div>
                    </div>
                    <div>
                      <div className="font-bold text-rose-400">{fw.failedControls}</div>
                      <div className="text-[11px] text-slate-400">Failed</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Controls Detail Section for Selected Framework */}
          {activeFramework && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {activeFramework.name} — Control Enforcement Checklist
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{activeFramework.description}</p>
                </div>
                <div className="text-xs text-slate-400">
                  Total Controls: <strong className="text-white">{activeFramework.totalControls}</strong>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {activeFramework.controls?.map((ctrl) => (
                  <div key={ctrl.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {ctrl.controlId}
                        </span>
                        <h5 className="text-sm font-semibold text-white">{ctrl.title}</h5>
                        <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                          {ctrl.category}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5 self-start sm:self-auto ${
                          ctrl.status === "PASSED"
                            ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-300"
                            : ctrl.status === "WARNING"
                            ? "bg-amber-950/60 border border-amber-800/60 text-amber-300"
                            : "bg-rose-950/60 border border-rose-800/60 text-rose-300"
                        }`}
                      >
                        {ctrl.status === "PASSED" ? "✓ PASSED" : ctrl.status === "WARNING" ? "⚠ WARNING" : "✗ FAILED"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">{ctrl.description}</p>

                    {ctrl.evidenceSummary && (
                      <div className="mt-2.5 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs">
                        <span className="text-slate-400 font-semibold">Evidence Validation: </span>
                        <span className="text-slate-200">{ctrl.evidenceSummary}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
