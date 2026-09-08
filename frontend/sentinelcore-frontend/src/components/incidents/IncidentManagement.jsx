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

  // ===============================
  // DATA FETCHING
  // ===============================

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

  // Initial load
  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  // ===============================
  // FILTERED DATASET
  // ===============================

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const title = (incident.title || "").toLowerCase()
      const desc = (incident.description || "").toLowerCase()
      const id = String(incident.id || "")
      const incId = (incident.incidentId || "").toLowerCase()
      const team = (incident.assignedTeam || "").toLowerCase()
      const q = searchQuery.toLowerCase()

      const matchesSearch =
        !q ||
        title.includes(q) ||
        desc.includes(q) ||
        id.includes(q) ||
        incId.includes(q) ||
        team.includes(q)

      const matchesSeverity =
        selectedSeverity === "ALL" ||
        (incident.severity || "").toUpperCase() === selectedSeverity

      const matchesStatus =
        selectedStatus === "ALL" ||
        (incident.status || "").toUpperCase() === selectedStatus

      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [
    incidents,
    searchQuery,
    selectedSeverity,
    selectedStatus,
  ])

  // ===============================
  // ACTION MODAL
  // ===============================

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

  // ===============================
  // MUTATION SUCCESS
  // ===============================

  const handleMutationSuccess = () => {
    fetchIncidents()

    if (selectedIncident) {
      // Close the drawer so the refreshed backend data
      // is shown when the incident is opened again.
      setSelectedIncident(null)
    }
  }

  // ===============================
  // UI
  // ===============================

  return (
    <div className="space-y-7 text-slate-100">

      {/* ===============================
          HEADER
      =============================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-800/60">

        <div>
          <div className="flex items-center gap-2">

            <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase">
              INCIDENT RESPONSE & REMEDIATION
            </span>

            <span className="text-slate-600">
              •
            </span>

            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Incidents: {incidents.length} Active Records
            </span>

          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Security Incident Management
          </h1>

          <p className="text-sm text-slate-400 mt-0.5">
            Lifecycle tracking, severity triage, team assignment, and
            resolution workflows from Spring Boot API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">

          {/* Create Incident */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>

            Create Incident
          </button>

          {/* Refresh */}
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            Refresh
          </button>

        </div>
      </div>

      {/* ===============================
          ERROR STATE
      =============================== */}

      {error && (
        <ErrorState
          title="Could Not Connect to Incident Management API"
          message="Failed to fetch incidents from GET /api/incidents. Ensure the Spring Boot backend has implemented the incidents endpoint and PostgreSQL is connected."
          error={error}
          onRetry={fetchIncidents}
        />
      )}

      {/* ===============================
          KPI STAT CARDS
      =============================== */}

      <IncidentStats incidents={incidents} />

      {/* ===============================
          MAIN TABLE CONTAINER
      =============================== */}

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
              onChange={(e) =>
                setSelectedSeverity(e.target.value)
              }
              className="bg-slate-800/70 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="ALL">
                All Severities
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

            {/* Status Filter */}

            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value)
              }
              className="bg-slate-800/70 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="OPEN">
                Open
              </option>

              <option value="ASSIGNED">
                Assigned
              </option>

              <option value="INVESTIGATING">
                Investigating
              </option>

              <option value="RESOLVED">
                Resolved
              </option>
            </select>

          </div>
        </div>

        {/* ===============================
            CONTENT
        =============================== */}

        {loading ? (
          <LoadingState
            message="Querying PostgreSQL incidents via Spring Boot API..."
          />
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
            onSelectIncident={(inc) =>
              setSelectedIncident(inc)
            }
            onOpenActionModal={openActionModal}
          />
        )}

      </div>

      {/* ===============================
          INCIDENT DETAILS DRAWER
      =============================== */}

      {selectedIncident && (
        <IncidentDetailsDrawer
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onOpenActionModal={openActionModal}
        />
      )}

      {/* ===============================
          CREATE INCIDENT MODAL
      =============================== */}

      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      {/* ===============================
          WORKFLOW ACTIONS MODAL
      =============================== */}

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