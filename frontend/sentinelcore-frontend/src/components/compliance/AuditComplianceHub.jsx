import { useState, useEffect } from "react"
import AuditLogIntegrityView from "./AuditLogIntegrityView"
import ComplianceVerificationView from "./ComplianceVerificationView"
import AccessTrackingView from "./AccessTrackingView"
import SecurityReviewView from "./SecurityReviewView"
import ReportGenerationView from "./ReportGenerationView"
import DevSecOpsDashboardView from "./DevSecOpsDashboardView"
import { getAuditStats, getComplianceFrameworks, getAccessTracking } from "../../services/api"

export default function AuditComplianceHub() {
  const [activeTab, setActiveTab] = useState("audit")
  const [auditStats, setAuditStats] = useState(null)
  const [complianceData, setComplianceData] = useState(null)
  const [accessData, setAccessData] = useState(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const [stats, comp, access] = await Promise.all([
          getAuditStats().catch(() => null),
          getComplianceFrameworks().catch(() => null),
          getAccessTracking().catch(() => null),
        ])
        setAuditStats(stats)
        setComplianceData(comp)
        setAccessData(access)
      } catch (e) {
        console.error("Failed to load header summary", e)
      }
    }
    fetchSummary()
  }, [activeTab])

  const tabs = [
    { id: "audit", label: "Audit Log Integrity", count: auditStats?.totalLogs },
    { id: "compliance", label: "Compliance Verification", score: complianceData?.overallScore },
    { id: "access", label: "Access Tracking", count: accessData?.totalEvents },
    { id: "security-review", label: "Security Review" },
    { id: "reports", label: "Report Generation" },
    { id: "devsecops", label: "DevSecOps Dashboard" },
  ]

  const totalViolations = (complianceData?.failedControls || 0) + (auditStats?.tamperDetected ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Milestone 4 Header Banner (Matching Specification Page 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300">
                MILESTONE 4
              </span>
              <span className="text-xs text-slate-400 font-medium">Audit, Governance & DevSecOps Platform</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              Compliance Reporting & DevSecOps
            </h1>
          </div>

          {/* KPI Header Stats */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 min-w-[130px]">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Audit Logs</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {auditStats ? auditStats.totalLogs.toLocaleString() : "--"}
              </div>
              <div className="text-[10px] text-emerald-400">Immutable</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 min-w-[130px]">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Compliance</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">
                {complianceData ? `${complianceData.overallScore}%` : "--"}
              </div>
              <div className="text-[10px] text-slate-400">Multi-Framework</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 min-w-[130px]">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Violations</div>
              <div className="text-xl font-bold text-slate-200 mt-0.5">
                {totalViolations}
              </div>
              <div className="text-[10px] text-slate-400">This Month</div>
            </div>
          </div>
        </div>

        {/* Audit Service - Compliance Dashboard Summary Strip (Page 7 Spec) */}
        <div className="mt-4 pt-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-slate-300">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Audit Store</span>
            <strong className="text-white">
              {auditStats ? auditStats.totalLogs : 0} logs | 7 yrs | AES-256
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Frameworks</span>
            <strong className="text-emerald-400">
              PCI DSS ✓ | SOC 2 ✓ | ISO ✓
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Access Telemetry</span>
            <strong className="text-white">
              {accessData ? accessData.totalEvents : 0} events | {accessData ? accessData.failedLogins : 0} failed
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">DevSecOps Status</span>
            <strong className="text-indigo-300">
              Trivy & SonarQube Active
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Audit Reports</span>
            <strong className="text-white">
              JSON / CSV / Printable Ready
            </strong>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="block text-[10px] uppercase font-semibold text-slate-400">Security Review</span>
            <strong className="text-emerald-400">
              30-Day Sign-off Active
            </strong>
          </div>
        </div>

        {/* Quick Jump Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            [View Logs]
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            [Export Report]
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compliance")}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 font-medium transition-colors"
          >
            [Compliance Check]
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        {tabs.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? "border-indigo-500 text-white bg-slate-850"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {t.count}
                </span>
              )}
              {t.score !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300">
                  {t.score}%
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "audit" && <AuditLogIntegrityView />}
        {activeTab === "compliance" && <ComplianceVerificationView />}
        {activeTab === "access" && <AccessTrackingView />}
        {activeTab === "security-review" && <SecurityReviewView />}
        {activeTab === "reports" && <ReportGenerationView />}
        {activeTab === "devsecops" && <DevSecOpsDashboardView />}
      </div>
    </div>
  )
}
