import { useState, useRef, useMemo } from "react"
import { uploadTrivyReport, uploadSonarReport } from "../../services/api"

function getSeverityBadge(severity) {
  const sev = (severity || "").toUpperCase()
  switch (sev) {
    case "CRITICAL":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30"
    case "HIGH":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30"
    case "MEDIUM":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
    case "LOW":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    default:
      return "bg-slate-700/30 text-slate-400 border-slate-700"
  }
}

function getPatchStatusBadge(status) {
  const st = (status || "").toUpperCase()
  switch (st) {
    case "PATCHED":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    case "IN_PROGRESS":
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
    case "PENDING":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30"
    default:
      return "bg-slate-700/30 text-slate-400 border-slate-700"
  }
}

function formatDate(isoStr) {
  if (!isoStr) return "—"
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return String(isoStr)
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return String(isoStr)
  }
}

function ScannerResultsView({
  vulnerabilities = [],
  onSelectVulnerability,
  onRefresh,
}) {
  const trivyFileInputRef = useRef(null)
  const sonarFileInputRef = useRef(null)
  const [uploadingScanner, setUploadingScanner] = useState(null) // null | "trivy" | "sonarqube"
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [selectedScannerFilter, setSelectedScannerFilter] = useState("ALL") // "ALL" | "TRIVY" | "SONARQUBE"

  const handleTrivyFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected if needed
    e.target.value = ""

    if (!file.name.toLowerCase().endsWith(".json")) {
      setUploadError("Invalid file type: Please select a valid .json Trivy scan report.")
      setUploadSuccess(null)
      return
    }

    setUploadingScanner("trivy")
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const result = await uploadTrivyReport(file)
      const saved = result.savedFindings ?? 0
      const skipped = result.skippedDuplicates ?? 0
      setUploadSuccess(
        `Trivy report processed successfully! Imported ${saved} new finding${
          saved === 1 ? "" : "s"
        }` +
          (skipped > 0
            ? ` (${skipped} duplicate${skipped === 1 ? "" : "s"} skipped)`
            : "") +
          "."
      )

      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      console.error("Failed to upload Trivy scan report:", err)
      setUploadError(err.message || "Failed to upload Trivy scan report.")
    } finally {
      setUploadingScanner(null)
    }
  }

  const handleSonarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected if needed
    e.target.value = ""

    if (!file.name.toLowerCase().endsWith(".json")) {
      setUploadError("Invalid file type: Please select a valid .json SonarQube scan report.")
      setUploadSuccess(null)
      return
    }

    setUploadingScanner("sonarqube")
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const result = await uploadSonarReport(file)
      const saved = result.savedFindings ?? 0
      const skipped = result.skippedDuplicates ?? 0
      setUploadSuccess(
        `SonarQube report processed successfully! Imported ${saved} new finding${
          saved === 1 ? "" : "s"
        }` +
          (skipped > 0
            ? ` (${skipped} duplicate${skipped === 1 ? "" : "s"} skipped)`
            : "") +
          "."
      )

      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      console.error("Failed to upload SonarQube scan report:", err)
      setUploadError(err.message || "Failed to upload SonarQube scan report.")
    } finally {
      setUploadingScanner(null)
    }
  }

  const scannerStats = useMemo(() => {
    // Seed default cards for known automated scanners so both are visible
    const groups = {
      Trivy: {
        name: "Trivy",
        displayName: "Trivy Container Scanner",
        category: "Container & Dependency Scanner",
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        latestScan: null,
        items: [],
      },
      SonarQube: {
        name: "SonarQube",
        displayName: "SonarQube SAST",
        category: "Static Application Security Testing",
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        latestScan: null,
        items: [],
      },
    }

    vulnerabilities.forEach((v) => {
      const rawSrc = v.scanSource || "Manual Audit"
      let key
      if (rawSrc.toLowerCase().includes("trivy")) {
        key = "Trivy"
      } else if (rawSrc.toLowerCase().includes("sonar")) {
        key = "SonarQube"
      } else {
        key = rawSrc
      }

      if (!groups[key]) {
        groups[key] = {
          name: key,
          displayName: key,
          category: "Security Assessment Source",
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          latestScan: null,
          items: [],
        }
      }

      groups[key].total++
      const sev = (v.severity || "").toUpperCase()
      if (sev === "CRITICAL") groups[key].critical++
      else if (sev === "HIGH") groups[key].high++
      else if (sev === "MEDIUM") groups[key].medium++
      else if (sev === "LOW") groups[key].low++

      const date = v.detectedAt || v.createdAt
      if (date) {
        if (
          !groups[key].latestScan ||
          new Date(date) > new Date(groups[key].latestScan)
        ) {
          groups[key].latestScan = date
        }
      }

      groups[key].items.push(v)
    })

    return Object.values(groups)
  }, [vulnerabilities])

  const filteredFindings = useMemo(() => {
    if (selectedScannerFilter === "TRIVY") {
      return vulnerabilities.filter((v) =>
        (v.scanSource || "").toLowerCase().includes("trivy")
      )
    }
    if (selectedScannerFilter === "SONARQUBE") {
      return vulnerabilities.filter((v) =>
        (v.scanSource || "").toLowerCase().includes("sonar")
      )
    }
    return vulnerabilities
  }, [vulnerabilities, selectedScannerFilter])

  const trivyCount = useMemo(
    () =>
      vulnerabilities.filter((v) =>
        (v.scanSource || "").toLowerCase().includes("trivy")
      ).length,
    [vulnerabilities]
  )

  const sonarCount = useMemo(
    () =>
      vulnerabilities.filter((v) =>
        (v.scanSource || "").toLowerCase().includes("sonar")
      ).length,
    [vulnerabilities]
  )

  return (
    <div className="space-y-6">
      {/* Hidden file input for Trivy JSON upload */}
      <input
        type="file"
        ref={trivyFileInputRef}
        onChange={handleTrivyFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Hidden file input for SonarQube JSON upload */}
      <input
        type="file"
        ref={sonarFileInputRef}
        onChange={handleSonarFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Backend Integration Notification Banner */}
      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-200">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 text-cyan-400 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-cyan-200 text-sm">
                Automated Scanner Telemetry & CI/CD Ingestion
              </h4>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Vulnerabilities below are attributed to automated scanner findings (<code className="text-cyan-300">Trivy</code> container security and <code className="text-cyan-300">SonarQube</code> SAST code analysis) stored in PostgreSQL via the <code className="text-cyan-300">scanSource</code> field.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  POST /api/scans/trivy (Active)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  POST /api/scans/sonarqube (Active)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0 w-full lg:w-auto">
            {/* Upload Trivy Report Button */}
            <button
              onClick={() => trivyFileInputRef.current?.click()}
              disabled={uploadingScanner !== null}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition shadow-lg ${
                uploadingScanner !== null
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer"
              }`}
            >
              {uploadingScanner === "trivy" ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Ingesting Trivy Report...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload Trivy Report</span>
                </>
              )}
            </button>

            {/* Upload SonarQube Report Button */}
            <button
              onClick={() => sonarFileInputRef.current?.click()}
              disabled={uploadingScanner !== null}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition shadow-lg ${
                uploadingScanner !== null
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 cursor-pointer"
              }`}
            >
              {uploadingScanner === "sonarqube" ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Ingesting SonarQube Report...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload SonarQube Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Upload Feedback Messages */}
      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{uploadSuccess}</span>
          </div>
          <button
            onClick={() => setUploadSuccess(null)}
            className="text-slate-400 hover:text-white p-1 rounded transition"
            aria-label="Dismiss message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0 text-rose-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium">{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-slate-400 hover:text-white p-1 rounded transition"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Scanner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scannerStats.map((scanner) => {
          const isTrivy = scanner.name.toLowerCase().includes("trivy")
          const isSonar = scanner.name.toLowerCase().includes("sonar")
          const isSelected =
            (selectedScannerFilter === "TRIVY" && isTrivy) ||
            (selectedScannerFilter === "SONARQUBE" && isSonar)

          return (
            <div
              key={scanner.name}
              onClick={() => {
                if (isTrivy) {
                  setSelectedScannerFilter((prev) => (prev === "TRIVY" ? "ALL" : "TRIVY"))
                } else if (isSonar) {
                  setSelectedScannerFilter((prev) => (prev === "SONARQUBE" ? "ALL" : "SONARQUBE"))
                }
              }}
              className={`p-5 rounded-xl bg-slate-900/80 border transition-all cursor-pointer flex flex-col justify-between shadow-lg shadow-black/20 ${
                isSelected
                  ? "border-cyan-500 ring-1 ring-cyan-500/50 bg-slate-900"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${
                        isTrivy
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : isSonar
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      }`}
                    >
                      {isTrivy ? "TR" : isSonar ? "SQ" : scanner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {scanner.name}
                        </h3>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                            Filtered
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        {scanner.category ||
                          (isTrivy
                            ? "Container & Dependency Scanner"
                            : isSonar
                            ? "Static Application Security Testing"
                            : "Security Assessment Source")}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-mono font-extrabold text-cyan-400">
                    {scanner.total}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 my-4 text-center">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-[10px] text-rose-400 font-bold block">CRIT</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {scanner.critical}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-[10px] text-amber-400 font-bold block">HIGH</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {scanner.high}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-[10px] text-yellow-400 font-bold block">MED</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {scanner.medium}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-[10px] text-emerald-400 font-bold block">LOW</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {scanner.low}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Latest Detection:</span>
                <span className="font-mono text-slate-300">
                  {formatDate(scanner.latestScan)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Discovered Vulnerabilities by Scanner Source */}
      <div className="space-y-4">
        {/* Sub-header with Scanner Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Scanner Disclosures & Findings Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedScannerFilter === "ALL"
                ? "Consolidated findings across all security scanners"
                : selectedScannerFilter === "TRIVY"
                ? "Container image and dependency scan disclosures (Trivy)"
                : "Static application security testing and code quality issues (SonarQube)"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
            <button
              onClick={() => setSelectedScannerFilter("ALL")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedScannerFilter === "ALL"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Scanners ({vulnerabilities.length})
            </button>
            <button
              onClick={() => setSelectedScannerFilter("TRIVY")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedScannerFilter === "TRIVY"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Trivy ({trivyCount})
            </button>
            <button
              onClick={() => setSelectedScannerFilter("SONARQUBE")}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedScannerFilter === "SONARQUBE"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              SonarQube ({sonarCount})
            </button>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-slate-300">
              {selectedScannerFilter === "TRIVY"
                ? "No Trivy findings present"
                : selectedScannerFilter === "SONARQUBE"
                ? "No SonarQube findings present"
                : "No scanner findings present"}
            </h4>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              {selectedScannerFilter === "TRIVY"
                ? "Upload a Trivy JSON scan report using the button above to import container and dependency vulnerability telemetry."
                : selectedScannerFilter === "SONARQUBE"
                ? "Upload a SonarQube JSON issues report using the button above to import static code analysis and security hotspot telemetry."
                : "Upload a Trivy or SonarQube JSON scan report using the buttons above to import automated security findings."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(selectedScannerFilter === "ALL" || selectedScannerFilter === "TRIVY") && (
                <button
                  onClick={() => trivyFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-semibold text-xs transition cursor-pointer"
                >
                  Select Trivy Report File
                </button>
              )}
              {(selectedScannerFilter === "ALL" || selectedScannerFilter === "SONARQUBE") && (
                <button
                  onClick={() => sonarFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition cursor-pointer"
                >
                  Select SonarQube Report File
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800/80">
                  <tr>
                    <th className="py-3 px-4">Scanner</th>
                    <th className="py-3 px-4">Tracking & CVE / Rule</th>
                    <th className="py-3 px-4">Title & Context</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">CVSS / Risk</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Asset Breakdown</th>
                    <th className="py-3 px-4">Detected</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredFindings.map((vuln) => {
                    const affected = Number(vuln.affectedAssets) || 0
                    const patched = Number(vuln.patchedAssets) || 0
                    const pending =
                      vuln.pendingAssets !== undefined && vuln.pendingAssets !== null
                        ? Number(vuln.pendingAssets)
                        : Math.max(0, affected - patched)

                    const isTrivyFinding = (vuln.scanSource || "").toLowerCase().includes("trivy")
                    const isSonarFinding = (vuln.scanSource || "").toLowerCase().includes("sonar")
                    const isCwe = (vuln.cveId || "").toUpperCase().startsWith("CWE-")
                    const isCve = (vuln.cveId || "").toUpperCase().startsWith("CVE-")

                    return (
                      <tr
                        key={vuln.id}
                        onClick={() => onSelectVulnerability && onSelectVulnerability(vuln)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* 1. scanSource */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded font-semibold border ${
                              isTrivyFinding
                                ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                : isSonarFinding
                                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {vuln.scanSource || "Manual"}
                          </span>
                        </td>

                        {/* 2. vulnerabilityId & cveId / CWE / Rule */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                            {vuln.vulnerabilityId || `#VULN-${vuln.id}`}
                          </div>
                          {vuln.cveId ? (
                            <span
                              className={`inline-block font-mono text-[11px] px-1.5 py-0.5 rounded border mt-1 ${
                                isCwe
                                  ? "text-cyan-300 bg-cyan-950/60 border-cyan-800/60"
                                  : isCve
                                  ? "text-amber-300 bg-amber-950/60 border-amber-800/60"
                                  : "text-slate-300 bg-slate-800/80 border-slate-700/60"
                              }`}
                            >
                              {vuln.cveId}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              No identifier
                            </span>
                          )}
                        </td>

                        {/* 3. title & description */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-white truncate" title={vuln.title}>
                            {vuln.title || `Vulnerability #${vuln.id}`}
                          </div>
                          {vuln.description && (
                            <div className="text-slate-400 text-[11px] truncate mt-0.5 max-w-xs" title={vuln.description}>
                              {vuln.description}
                            </div>
                          )}
                        </td>

                        {/* 4. severity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(
                              vuln.severity
                            )}`}
                          >
                            {vuln.severity || "LOW"}
                          </span>
                        </td>

                        {/* 5. cvssScore & riskScore */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              title="CVSS Base Score"
                              className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700/60"
                            >
                              {vuln.cvssScore !== null && vuln.cvssScore !== undefined
                                ? Number(vuln.cvssScore).toFixed(1)
                                : "—"}
                            </span>
                            <span className="text-slate-600">/</span>
                            <span
                              title="Calculated Risk Score"
                              className={`font-mono text-xs font-bold ${
                                Number(vuln.riskScore) >= 7.0
                                  ? "text-rose-400"
                                  : Number(vuln.riskScore) >= 4.0
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {vuln.riskScore !== null && vuln.riskScore !== undefined
                                ? Number(vuln.riskScore).toFixed(1)
                                : "—"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            CVSS / Risk
                          </div>
                        </td>

                        {/* 6. patchStatus */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPatchStatusBadge(
                              vuln.patchStatus
                            )}`}
                          >
                            {vuln.patchStatus || "PENDING"}
                          </span>
                        </td>

                        {/* 7. affectedAssets, patchedAssets, pendingAssets */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-[11px] font-mono text-slate-300">
                            <span className="text-white font-semibold">{affected}</span> aff /{" "}
                            <span className="text-emerald-400 font-semibold">{patched}</span> pat
                          </div>
                          <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                            {pending} pending
                          </div>
                        </td>

                        {/* 8. detectedAt */}
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                          {formatDate(vuln.detectedAt || vuln.createdAt)}
                        </td>

                        {/* 9. action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onSelectVulnerability) onSelectVulnerability(vuln)
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScannerResultsView
