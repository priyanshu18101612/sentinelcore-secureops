import { useState, useEffect } from "react"
import { getAccessTracking } from "../../services/api"

export default function AccessTrackingView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = () => {
    setLoading(true)
    setError(null)
    getAccessTracking()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load access tracking", err)
        setError(err.message || "Failed to load access logs")
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getAccessTracking()
      .then((res) => {
        if (!ignore) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load access tracking", err)
          setError(err.message || "Failed to load access logs")
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Auth Events</div>
          <div className="text-2xl font-bold text-white mt-1">
            {data ? data.totalEvents.toLocaleString() : "--"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Recorded Logins & Events</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Successful Logins</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {data ? data.successfulLogins.toLocaleString() : "--"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Authorized Sessions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed Attempts</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {data ? data.failedLogins.toLocaleString() : "--"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data && data.failedLogins > 0 ? "Under Monitoring Threshold" : "0 Auth Failures"}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Terminated Sessions</div>
          <div className="text-2xl font-bold text-slate-200 mt-1">
            {data ? data.logouts.toLocaleString() : "--"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Explicit Logout Events</div>
        </div>
      </div>

      {/* Access Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Authentication & Session Access Stream</h4>
            <p className="text-xs text-slate-400 mt-0.5">Live identity governance and audit log integration</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
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
            Loading authentication records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            Error: {error}
          </div>
        ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No access logs recorded yet. Authentication events appear here in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Client / Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {data.recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "--"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">
                      {log.username}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-300"
                            : "bg-rose-950/60 border border-rose-800/60 text-rose-300"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {log.ipAddress || "--"}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400" title={log.userAgent}>
                      {log.userAgent || "Web Application Client"}
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
