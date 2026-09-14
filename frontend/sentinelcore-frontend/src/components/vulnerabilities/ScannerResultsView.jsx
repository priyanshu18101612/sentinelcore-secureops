import { useMemo } from "react"

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

function ScannerResultsView({ vulnerabilities = [], onSelectVulnerability }) {
  const scannerStats = useMemo(() => {
    const groups = {}

    vulnerabilities.forEach((v) => {
      const src = v.scanSource || "Manual Audit"
      if (!groups[src]) {
        groups[src] = {
          name: src,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          latestScan: null,
          items: [],
        }
      }

      groups[src].total++
      const sev = (v.severity || "").toUpperCase()
      if (sev === "CRITICAL") groups[src].critical++
      else if (sev === "HIGH") groups[src].high++
      else if (sev === "MEDIUM") groups[src].medium++
      else if (sev === "LOW") groups[src].low++

      const date = v.detectedAt || v.createdAt
      if (date) {
        if (!groups[src].latestScan || new Date(date) > new Date(groups[src].latestScan)) {
          groups[src].latestScan = date
        }
      }

      groups[src].items.push(v)
    })

    return Object.values(groups)
  }, [vulnerabilities])

  return (
    <div className="space-y-6">
      {/* Backend Integration Notification Banner */}
      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 text-cyan-400 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-cyan-200 text-sm">
              CI/CD Pipeline Scanner Integration Notice
            </h4>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Vulnerabilities below are attributed to automated scanner findings (<code className="text-cyan-300">Trivy</code> container security and <code className="text-cyan-300">SonarQube</code> SAST code analysis) stored in PostgreSQL via the <code className="text-cyan-300">scanSource</code> field.
            </p>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>
                Backend dependency note: Dedicated pipeline runner endpoints (<code className="text-slate-300">POST /api/scans/trivy</code>, <code className="text-slate-300">POST /api/scans/sonarqube</code>) are pending implementation by Sakshi.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scannerStats.map((scanner) => {
          const isTrivy = scanner.name.toLowerCase().includes("trivy")
          const isSonar = scanner.name.toLowerCase().includes("sonar")

          return (
            <div
              key={scanner.name}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 flex flex-col justify-between"
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
                      {scanner.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {scanner.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {isTrivy
                          ? "Container & Dependency Scanner"
                          : isSonar
                          ? "Static Application Security Testing"
                          : "Security Assessment Source"}
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
        <h3 className="text-base font-bold text-white tracking-tight">
          Scanner Disclosures & Findings Log
        </h3>

        {vulnerabilities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs">
            No scanner-detected vulnerability records present in the database.
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800/80">
                  <tr>
                    <th className="py-3 px-4">Scanner</th>
                    <th className="py-3 px-4">CVE / Identifier</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">CVSS</th>
                    <th className="py-3 px-4">Detection Timestamp</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {vulnerabilities.map((vuln) => (
                    <tr
                      key={vuln.id}
                      onClick={() => onSelectVulnerability && onSelectVulnerability(vuln)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
                          {vuln.scanSource || "Manual"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {vuln.cveId || vuln.vulnerabilityId || `#VULN-${vuln.id}`}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-200">
                        {vuln.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            vuln.severity === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : vuln.severity === "HIGH"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : vuln.severity === "MEDIUM"
                              ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {vuln.severity || "LOW"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {vuln.cvssScore !== null && vuln.cvssScore !== undefined
                          ? Number(vuln.cvssScore).toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {formatDate(vuln.detectedAt || vuln.createdAt)}
                      </td>
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
                  ))}
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
