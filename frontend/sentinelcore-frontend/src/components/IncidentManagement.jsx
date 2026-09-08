import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8081/api";

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [sla, setSla] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all incidents
  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents`);

      if (!response.ok) {
        throw new Error("Failed to fetch incidents");
      }

      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Fetch SLA and Audit details
  const selectIncident = async (incident) => {
    setSelectedIncident(incident);
    setSla(null);
    setAuditLogs([]);

    try {
      const [slaResponse, auditResponse] = await Promise.all([
        fetch(`${API_BASE}/incidents/${incident.id}/sla`),
        fetch(`${API_BASE}/incidents/${incident.id}/audit`),
      ]);

      if (slaResponse.ok) {
        const slaData = await slaResponse.json();
        setSla(slaData);
      }

      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData);
      }
    } catch (error) {
      console.error("Error fetching SLA/Audit:", error);
    }
  };

  // Summary calculations
  const activeIncidents = incidents.filter(
    (incident) => incident.status !== "RESOLVED"
  ).length;

  const criticalIncidents = incidents.filter(
    (incident) => incident.severity === "CRITICAL"
  ).length;

  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  ).length;

  const breachedCount = incidents.filter(
    (incident) => incident.id === selectedIncident?.id &&
      sla?.status === "SLA_BREACHED"
  ).length;

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">SECURITY OPERATIONS</div>
          <h1>Incident Management</h1>
          <p>Track, investigate and resolve security incidents.</p>
        </div>

        <button className="primary-button">
          + Create Incident
        </button>
      </div>

      {/* Summary Cards */}
      <div className="incident-cards">

        <div className="incident-card">
          <span>ACTIVE INCIDENTS</span>
          <strong>{activeIncidents}</strong>
        </div>

        <div className="incident-card critical">
          <span>CRITICAL INCIDENTS</span>
          <strong>{criticalIncidents}</strong>
        </div>

        <div className="incident-card resolved">
          <span>RESOLVED INCIDENTS</span>
          <strong>{resolvedIncidents}</strong>
        </div>

        <div className="incident-card">
          <span>MTTR</span>
          <strong>N/A</strong>
        </div>

        <div className="incident-card warning">
          <span>SLA BREACHED</span>
          <strong>{breachedCount}</strong>
        </div>

      </div>

      {/* Incident Table */}
      <div className="incident-section">

        <div className="section-heading">
          <div>
            <h2>Incidents</h2>
            <p>Recent security incidents and their current status.</p>
          </div>
        </div>

        <div className="incident-table-wrapper">

          <table className="incident-table">

            <thead>
              <tr>
                <th>INCIDENT ID</th>
                <th>TITLE / DESCRIPTION</th>
                <th>SEVERITY</th>
                <th>ASSIGNED TEAM</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>SLA</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    Loading incidents...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No incidents found.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => selectIncident(incident)}
                    style={{ cursor: "pointer" }}
                  >

                    <td>
                      {incident.incidentId}
                    </td>

                    <td>
                      <strong>{incident.title}</strong>
                      <br />
                      <small>{incident.description}</small>
                    </td>

                    <td>
                      <span className={`badge ${incident.severity?.toLowerCase()}`}>
                        {incident.severity}
                      </span>
                    </td>

                    <td>
                      {incident.assignedTeam || "Unassigned"}
                    </td>

                    <td>
                      <span className={`badge ${incident.status?.toLowerCase()}`}>
                        {incident.status}
                      </span>
                    </td>

                    <td>
                      {incident.createdAt
                        ? new Date(incident.createdAt).toLocaleString()
                        : "N/A"}
                    </td>

                    <td>
                      {selectedIncident?.id === incident.id && sla ? (
                        <span
                          className={
                            sla.status === "SLA_BREACHED"
                              ? "badge critical"
                              : "badge resolved"
                          }
                        >
                          {sla.status}
                        </span>
                      ) : (
                        "View"
                      )}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* Incident Details */}
      <div className="incident-section">

        <div className="section-heading">
          <div>
            <h2>Incident Details</h2>
            <p>
              {selectedIncident
                ? `Details for ${selectedIncident.incidentId}`
                : "Select an incident from the table to view its details."}
            </p>
          </div>
        </div>

        {!selectedIncident ? (

          <div className="incident-details-empty">
            No incident selected.
          </div>

        ) : (

          <div className="incident-details">

            <p>
              <strong>Incident ID:</strong>{" "}
              {selectedIncident.incidentId}
            </p>

            <p>
              <strong>Title:</strong>{" "}
              {selectedIncident.title}
            </p>

            <p>
              <strong>Description:</strong>{" "}
              {selectedIncident.description}
            </p>

            <p>
              <strong>Severity:</strong>{" "}
              {selectedIncident.severity}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {selectedIncident.status}
            </p>

            <p>
              <strong>Assigned Team:</strong>{" "}
              {selectedIncident.assignedTeam || "Unassigned"}
            </p>

            {/* SLA */}
            <div className="incident-subsection">

              <h3>SLA Information</h3>

              {sla ? (
                <>
                  <p>
                    <strong>Status:</strong>{" "}
                    {sla.status}
                  </p>

                  <p>
                    <strong>Deadline:</strong>{" "}
                    {sla.deadline
                      ? new Date(sla.deadline).toLocaleString()
                      : "N/A"}
                  </p>

                  <p>
                    <strong>Remaining Time:</strong>{" "}
                    {sla.remainingTime || "0h 0m"}
                  </p>
                </>
              ) : (
                <p>Loading SLA information...</p>
              )}

            </div>

            {/* Audit Logs */}
            <div className="incident-subsection">

              <h3>Audit Logs</h3>

              {auditLogs.length === 0 ? (

                <p>No audit logs found.</p>

              ) : (

                <div className="audit-list">

                  {auditLogs.map((log) => (
                    <div
                      className="audit-item"
                      key={log.id}
                    >

                      <strong>{log.action}</strong>

                      <p>
                        {log.details}
                      </p>

                      <small>
                        {log.actor || "SYSTEM"} •{" "}
                        {log.source || "IncidentService"} •{" "}
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : ""}
                      </small>

                    </div>
                  ))}

                </div>

              )}

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default IncidentManagement;