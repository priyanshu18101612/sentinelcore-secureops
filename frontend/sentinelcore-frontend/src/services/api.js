export const API_BASE_URL = "http://localhost:8080/api"

// ===============================
// ASSETS
// ===============================

export async function getAssets() {
  const response = await fetch(`${API_BASE_URL}/assets`)

  if (!response.ok) {
    throw new Error(`Failed to fetch assets (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getAsset(id) {
  const response = await fetch(`${API_BASE_URL}/assets/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch asset #${id} (HTTP ${response.status})`)
  }

  return response.json()
}


// ===============================
// INFRASTRUCTURE MONITORING
// ===============================

export async function getAllInfrastructureMetrics() {
  const response = await fetch(`${API_BASE_URL}/infrastructure/metrics`)

  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure metrics (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getMetrics(assetId) {
  const response = await fetch(
    `${API_BASE_URL}/infrastructure/assets/${assetId}/metrics`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch metrics for asset #${assetId} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getHealth(assetId) {
  const response = await fetch(
    `${API_BASE_URL}/infrastructure/assets/${assetId}/health`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch health for asset #${assetId} (HTTP ${response.status})`)
  }

  return response.json()
}


// ===============================
// CLOUD MONITORING
// ===============================

export async function getCloudResources() {
  const response = await fetch(
    `${API_BASE_URL}/cloud/resources`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch cloud resources (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getCloudHealth() {
  const response = await fetch(
    `${API_BASE_URL}/cloud/health`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch cloud health (HTTP ${response.status})`)
  }

  // Backend returns plain text: HEALTHY / UNHEALTHY
  return response.text()
}


// ===============================
// NETWORK MONITORING
// ===============================

export async function getNetworkStatus() {
  const response = await fetch(
    `${API_BASE_URL}/network/status`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch network status (HTTP ${response.status})`)
  }

  // Backend returns plain text: UP / DOWN
  return response.text()
}

export async function getNetworkMetrics() {
  const response = await fetch(
    `${API_BASE_URL}/network/metrics`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch network metrics (HTTP ${response.status})`)
  }

  return response.json()
}


// ===============================
// ALERTS
// ===============================

export async function getAlerts() {
  const response = await fetch(
    `${API_BASE_URL}/alerts`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getAlert(id) {
  const response = await fetch(
    `${API_BASE_URL}/alerts/${id}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch alert #${id} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function acknowledgeAlert(id) {
  const response = await fetch(`${API_BASE_URL}/alerts/${id}/acknowledge`, {
    method: "PUT",
  })

  if (!response.ok) {
    throw new Error(`Failed to acknowledge alert #${id} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function detectAnomalies() {
  const response = await fetch(`${API_BASE_URL}/alerts/detect`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`Failed to run anomaly detection (HTTP ${response.status})`)
  }

  return response.json()
}


// ===============================
// SLA
// ===============================

export async function getSla() {
  const response = await fetch(`${API_BASE_URL}/sla`)

  if (!response.ok) {
    throw new Error(`Failed to fetch SLA data (HTTP ${response.status})`)
  }

  return response.json()
}


// ===============================
// INCIDENT MANAGEMENT (MILESTONE 2)
// ===============================

export async function getIncidents() {
  const response = await fetch(`${API_BASE_URL}/incidents`)

  if (!response.ok) {
    throw new Error(`Failed to fetch incidents (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getIncidentById(id) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch incident #${id} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function createIncident(incidentData) {
  const response = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(incidentData),
  })

  if (!response.ok) {
    throw new Error(`Failed to create incident (HTTP ${response.status})`)
  }

  return response.json()
}

export async function updateIncidentSeverity(id, severity) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/severity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ severity }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update incident severity (HTTP ${response.status})`)
  }

  return response.json()
}

export async function assignIncident(id, assignedTeam) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ team: assignedTeam }),
  })

  if (!response.ok) {
    throw new Error(`Failed to assign incident (HTTP ${response.status})`)
  }

  return response.json()
}

export async function updateIncidentStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update incident status (HTTP ${response.status})`)
  }

  return response.json()
}

export async function resolveIncident(id, resolutionNotes) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/resolve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resolutionNotes }),
  })

  if (!response.ok) {
    throw new Error(`Failed to resolve incident (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getIncidentSla(id) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/sla`)

  if (!response.ok) {
    throw new Error(`Failed to fetch incident SLA (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getIncidentAudit(id) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/audit`)

  if (!response.ok) {
    throw new Error(`Failed to fetch incident audit history (HTTP ${response.status})`)
  }

  return response.json()
}


// ===============================
// VULNERABILITY MANAGEMENT (MILESTONE 3)
// ===============================

export async function getVulnerabilities() {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities`)

  if (!response.ok) {
    throw new Error(`Failed to fetch vulnerabilities (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getVulnerabilityById(id) {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch vulnerability #${id} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function createVulnerability(vulnerabilityData) {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vulnerabilityData),
  })

  if (!response.ok) {
    throw new Error(`Failed to create vulnerability (HTTP ${response.status})`)
  }

  return response.json()
}

export async function updateVulnerability(id, vulnerabilityData) {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vulnerabilityData),
  })

  if (!response.ok) {
    throw new Error(`Failed to update vulnerability #${id} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function deleteVulnerability(id) {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(`Failed to delete vulnerability #${id} (HTTP ${response.status})`)
  }

  return true
}

export async function updateVulnerabilitySeverity(id, severity, cvssScore) {
  const payload = { severity }
  if (cvssScore !== undefined && cvssScore !== null && cvssScore !== "") {
    payload.cvssScore = Number(cvssScore)
  }

  const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/severity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to update severity (HTTP ${response.status})`)
  }

  return response.json()
}

export async function updateVulnerabilityRisk(id, riskScore) {
  const payload =
    riskScore !== undefined && riskScore !== null && riskScore !== ""
      ? { riskScore: Number(riskScore) }
      : {}

  const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/risk`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to update risk score (HTTP ${response.status})`)
  }

  return response.json()
}

export async function updateVulnerabilityPatch(id, patchedAssets) {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/patch`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ patchedAssets: Number(patchedAssets) }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to update patch progress (HTTP ${response.status})`)
  }

  return response.json()
}

export async function uploadTrivyReport(file) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/scans/trivy`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to upload Trivy scan report (HTTP ${response.status})`)
  }

  return response.json()
}

export async function uploadSonarReport(file) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/scans/sonarqube`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to upload SonarQube scan report (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getVulnerabilityCompliance() {
  const response = await fetch(`${API_BASE_URL}/vulnerabilities/compliance`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch vulnerability compliance (HTTP ${response.status})`)
  }

  return response.json()
}

// ===============================
// MILESTONE 4: AUDIT & COMPLIANCE
// ===============================

export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams()
  if (params.category) query.append("category", params.category)
  if (params.entityType) query.append("entityType", params.entityType)
  if (params.search) query.append("search", params.search)

  const url = `${API_BASE_URL}/audit/logs${query.toString() ? `?${query.toString()}` : ""}`
  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch audit logs (HTTP ${response.status})`)
  }

  return response.json()
}

export async function verifyAuditChain() {
  const response = await fetch(`${API_BASE_URL}/audit/verify-chain`, {
    method: "POST",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to verify audit chain (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getAuditStats() {
  const response = await fetch(`${API_BASE_URL}/audit/stats`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch audit stats (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getComplianceFrameworks() {
  const response = await fetch(`${API_BASE_URL}/compliance/frameworks`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch compliance frameworks (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getComplianceFrameworkDetail(framework) {
  const response = await fetch(`${API_BASE_URL}/compliance/frameworks/${encodeURIComponent(framework)}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch framework details (HTTP ${response.status})`)
  }

  return response.json()
}

export async function evaluateComplianceFrameworks() {
  const response = await fetch(`${API_BASE_URL}/compliance/evaluate`, {
    method: "POST",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to evaluate compliance frameworks (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getAccessTracking() {
  const response = await fetch(`${API_BASE_URL}/access/tracking`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch access tracking (HTTP ${response.status})`)
  }

  return response.json()
}

export async function logAccessEvent(eventData) {
  const response = await fetch(`${API_BASE_URL}/access/log-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to log access event (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getCurrentSecurityReview() {
  const response = await fetch(`${API_BASE_URL}/security-reviews/current`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch current security review (HTTP ${response.status})`)
  }

  return response.json()
}

export async function signOffSecurityReview(signOffData) {
  const response = await fetch(`${API_BASE_URL}/security-reviews/sign-off`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signOffData || {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to sign off security review (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getReports() {
  const response = await fetch(`${API_BASE_URL}/reports`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch reports (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getReportById(id) {
  const response = await fetch(`${API_BASE_URL}/reports/${id}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch report #${id} (HTTP ${response.status})`)
  }

  return response.json()
}

export async function generateReport(reportData) {
  const response = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData || {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to generate report (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getDevSecOpsPosture() {
  const response = await fetch(`${API_BASE_URL}/devsecops/posture`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch DevSecOps posture (HTTP ${response.status})`)
  }

  return response.json()
}

// ===============================
// REAL SYSTEM TELEMETRY & LIVE SCANS
// ===============================

export async function getTelemetryStatus() {
  const response = await fetch(`${API_BASE_URL}/infrastructure/telemetry/status`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch telemetry status (HTTP ${response.status})`)
  }

  return response.json()
}

export async function runLocalTrivyScan(path) {
  const response = await fetch(`${API_BASE_URL}/scans/trivy/run-local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(path ? { path } : {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to execute local Trivy scan (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getTrivyStatus() {
  const response = await fetch(`${API_BASE_URL}/scans/trivy/status`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch Trivy scanner status (HTTP ${response.status})`)
  }

  return response.json()
}

export async function runLocalSonarScan(path) {
  const response = await fetch(`${API_BASE_URL}/scans/sonarqube/run-local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(path ? { path } : {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to execute local SonarQube scan (HTTP ${response.status})`)
  }

  return response.json()
}

export async function getSonarStatus() {
  const response = await fetch(`${API_BASE_URL}/scans/sonarqube/status`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch SonarQube scanner status (HTTP ${response.status})`)
  }

  return response.json()
}

// ===============================
// CROSS-MILESTONE CORRELATION & DEVSECOPS (PHASE 5)
// ===============================

export async function getHostCorrelation() {
  const response = await fetch(`${API_BASE_URL}/devsecops/host-correlation`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch host correlation (HTTP ${response.status})`)
  }

  return response.json()
}

export async function triggerFullSystemAudit(path) {
  const response = await fetch(`${API_BASE_URL}/devsecops/full-system-audit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(path ? { path } : {}),
  })

  const data = await response.json().catch(() => ({}))

  if (response.status === 409 || data.status === "ALREADY_RUNNING") {
    return {
      status: "ALREADY_RUNNING",
      message: data.message || "A full system audit is currently running. Please wait for it to finish.",
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Failed to execute full system audit (HTTP ${response.status})`)
  }

  return data
}

// ===============================
// GOVERNANCE & REMEDIATION ADVISORY (PHASE 6)
// ===============================

export async function getRemediationAdvisories() {
  const response = await fetch(`${API_BASE_URL}/devsecops/remediation-advisories`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to fetch remediation advisories (HTTP ${response.status})`)
  }

  return response.json()
}

export async function verifyReportAttestation(reportId) {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/verify-attestation`, {
    method: "POST",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to verify report attestation (HTTP ${response.status})`)
  }

  return response.json()
}

export function getReportAttestationBundleUrl(reportId) {
  return `${API_BASE_URL}/reports/${reportId}/attestation-bundle`
}
