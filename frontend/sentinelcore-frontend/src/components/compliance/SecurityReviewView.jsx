import { useState, useEffect } from "react"
import { getCurrentSecurityReview, signOffSecurityReview } from "../../services/api"

export default function SecurityReviewView() {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Form states
  const [showSignModal, setShowSignModal] = useState(false)
  const [reviewerName, setReviewerName] = useState("Alex Vance")
  const [reviewerRole, setReviewerRole] = useState("Lead SecOps Engineer")
  const [notes, setNotes] = useState("All 30-day security anomalies audited and baseline controls confirmed.")

  const loadData = () => {
    setLoading(true)
    setError(null)
    getCurrentSecurityReview()
      .then((res) => {
        setReview(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load security review", err)
        setError(err.message || "Failed to load security review")
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getCurrentSecurityReview()
      .then((res) => {
        if (!ignore) {
          setReview(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load security review", err)
          setError(err.message || "Failed to load security review")
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  const handleSignOff = async (e) => {
    e.preventDefault()
    if (!reviewerName.trim() || !reviewerRole.trim()) {
      alert("Reviewer Name and Role are required.")
      return
    }

    try {
      setSigning(true)
      setError(null)
      const updated = await signOffSecurityReview({
        reviewerName,
        reviewerRole,
        notes,
      })
      setReview(updated)
      setShowSignModal(false)
      setSuccessMsg("Security review formally approved and recorded to immutable audit log.")
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      console.error("Sign-off failed", err)
      setError(err.message || "Sign-off failed")
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Review Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">Periodic Security Posture Review</h3>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                review?.status === "APPROVED"
                  ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
                  : review?.status === "FLAGGED"
                  ? "bg-amber-950/70 border-amber-800 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {review?.status || "PENDING"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Formal 30-day security governance lifecycle tracking anomalies, critical CVEs, and compliance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
          {review?.status !== "APPROVED" ? (
            <button
              type="button"
              onClick={() => setShowSignModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sign Off Review
            </button>
          ) : (
            <div className="text-right text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Review Approved & Sealed
              </span>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Signed by {review.reviewerName}
              </div>
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800/70 text-emerald-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-xl">
          <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Loading security review...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400 text-sm bg-slate-900 border border-slate-800 rounded-xl">
          Error: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Review Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
              Review Cycle Specifications
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Review Window</span>
                <span className="font-medium text-white">{review?.reviewPeriod || "--"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Cycle Start</span>
                <span className="font-medium text-slate-200">
                  {review?.startDate ? new Date(review.startDate).toLocaleDateString() : "--"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Cycle End</span>
                <span className="font-medium text-slate-200">
                  {review?.endDate ? new Date(review.endDate).toLocaleDateString() : "--"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Anomalies Detected</span>
                <span
                  className={`font-bold ${
                    review?.anomaliesDetected > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {review?.anomaliesDetected || 0}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Governance Status</span>
                <span className="font-semibold text-white">{review?.status || "PENDING"}</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Auditor Assessment Notes
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
                {review?.notes || "No notes entered."}
              </div>
            </div>
          </div>

          {/* Sign-off Credential Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
              Sign-off & Authority Attestation
            </h4>

            {review?.status === "APPROVED" ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>This review has been signed off and recorded into the immutable audit ledger.</span>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Reviewer Name</span>
                    <span className="font-semibold text-white">{review.reviewerName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Reviewer Role</span>
                    <span className="text-slate-300">{review.reviewerRole}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Signed Timestamp</span>
                    <span className="font-mono text-slate-300">
                      {review.signedAt ? new Date(review.signedAt).toLocaleString() : "--"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-xs">
                  Review is currently awaiting formal review and sign-off by a designated Security Administrator or SecOps Lead.
                </div>

                <button
                  type="button"
                  onClick={() => setShowSignModal(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Open Formal Sign-off Modal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign Off Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Sign Off Security Review</h3>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSignOff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reviewer Name</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reviewer Role</label>
                <input
                  type="text"
                  required
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attestation Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium"
                >
                  {signing ? "Signing..." : "Confirm & Sign Off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
