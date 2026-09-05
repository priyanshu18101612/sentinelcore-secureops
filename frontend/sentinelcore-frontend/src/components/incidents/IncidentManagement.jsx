import { useState, useEffect, useMemo, useCallback } from "react"
import { getIncidents } from "../../services/api"
import { LoadingState, ErrorState, EmptyState } from "../StatusFeedback"
import IncidentStats from "./IncidentStats"
import IncidentTable from "./IncidentTable"
import IncidentDetailsDrawer from "./IncidentDetailsDrawer"
import CreateIncidentModal from "./CreateIncidentModal"
import IncidentActionsModal from "./IncidentActionsModal"

function IncidentManagement() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  // Modals & Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [actionModalState, setActionModalState] = useState({
    isOpen: false,
    type: null,
    incident: null,
  })

  // Data fetching
  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIncidents()
      setIncidents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch incidents from backend:", err)
      setError(err)
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    getIncidents()
      .then((data) => {
        if (!ignore) {
          setIncidents(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load incidents from backend:", err)
          setError(err)
          setIncidents([])
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  // Filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const title = (incident.title || "").toLowerCase()
      const desc = (incident.description || "").toLowerCase()
      const id = String(incident.id || "")
      const team = (incident.assignedTeam || "").toLowerCase()
      const q = searchQuery.toLowerCase()

      const matchesSearch =
        !q ||
        title.includes(q) ||
        desc.includes(q) ||
        id.includes(q) ||
        team.includes(q)

      const matchesSeverity =
        selectedSeverity === "ALL" ||
        (incident.severity || "").toUpperCase() === selectedSeverity

      const matchesStatus =
        selectedStatus === "ALL" ||
        (incident.status || "").toUpperCase() === selectedStatus

      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [incidents, searchQuery, selectedSeverity, selectedStatus])

  const openActionModal = (type, incident) => {
    setActionModalState({
      isOpen: true,
      type,
      incident,
    })
  }

  const closeActionModal = () => {
    setActionModalState({
      isOpen: false,
      type: null,
      incident: null,
    })
  }

  // When an incident is modified, update selectedIncident if drawer is open
  const handleMutationSuccess = () => {
    fetchIncidents()
    if (selectedIncident) {
      // Re-fetch or close selected incident to update view
      setSelectedIncident(null)
    }
  }

  return (
    <div className="space-y-7 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase">
              INCIDENT RESPONSE & REMEDIATION
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Incidents: {incidents.length} Active Records
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Security Incident Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Lifecycle tracking, severity triage, team assignment, and resolution workflows from Spring Boot API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Incident
          </button>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error State Banner with Retry */}
      {error && (
        <ErrorState
          title="Could Not Connect to Incident Management API"
          message="Failed to fetch incidents from GET /api/incidents. Ensure the Spring Boot backend has implemented the incidents endpoint and PostgreSQL is connected."
          error={error}
          onRetry={fetchIncidents}
        />
      )}

      {/* 5 KPI Stat Cards */}
      <IncidentStats incidents={incidents} />

      {/* Main Table Container */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/20 overflow-hidden">
        {/* Table Toolbar / Filters */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by ID, title, team, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Severity & Status Dropdown Filters */}
          <div className="flex items-center gap-2 text-xs">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-800/70 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800/70 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Content Table or Feedback */}
        {loading ? (
          <LoadingState message="Querying PostgreSQL incidents via Spring Boot API..." />
        ) : incidents.length === 0 ? (
          <EmptyState
            title="No Incidents Found"
            message="No security incidents have been logged in the backend database. Click 'Create Incident' to log an incident."
            actionText="Create Incident Ticket"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No incidents match the specified search or filter criteria.
          </div>
        ) : (
          <IncidentTable
            incidents={filteredIncidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenActionModal={openActionModal}
          />
        )}
      </div>

      {/* Slide-over Details Drawer */}
      {selectedIncident && (
        <IncidentDetailsDrawer
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onOpenActionModal={openActionModal}
        />
      )}

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      {/* Workflow Actions Modal */}
      <IncidentActionsModal
        isOpen={actionModalState.isOpen}
        actionType={actionModalState.type}
        incident={actionModalState.incident}
        onClose={closeActionModal}
        onSuccess={handleMutationSuccess}
      />
    </div>
  )
}

export default IncidentManagement
