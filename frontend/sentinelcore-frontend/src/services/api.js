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