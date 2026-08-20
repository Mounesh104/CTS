/**
 * src/services/api.js
 * API integration service for PAPRS frontend to FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Health check endpoint
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn("Backend API health check failed:", error);
    return null;
  }
}

/**
 * Fetch aggregate dashboard summary data
 */
export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard summary: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Top-line KPI numbers (GET /dashboard/kpis)
 */
export async function fetchDashboardKpis() {
  const res = await fetch(`${API_BASE_URL}/dashboard/kpis`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard KPIs: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Risk band counts (GET /dashboard/risk-distribution)
 */
export async function fetchRiskDistribution() {
  const res = await fetch(`${API_BASE_URL}/dashboard/risk-distribution`);
  if (!res.ok) {
    throw new Error(`Failed to fetch risk distribution: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Average cohort adherence trend (GET /dashboard/adherence-trend)
 */
export async function fetchAdherenceTrend(months = 6) {
  const res = await fetch(`${API_BASE_URL}/dashboard/adherence-trend?months=${months}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch adherence trend: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Cohort analysis — by age group, risk category, adherence band (GET /dashboard/cohorts)
 */
export async function fetchCohorts() {
  const res = await fetch(`${API_BASE_URL}/dashboard/cohorts`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cohorts: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Paginated highest-risk patients (GET /dashboard/high-risk-patients)
 */
export async function fetchHighRiskPatients(page = 1, pageSize = 10) {
  const res = await fetch(`${API_BASE_URL}/dashboard/high-risk-patients?page=${page}&page_size=${pageSize}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch high-risk patients: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetch patient list with full profiles (single request — backend joins
 * risk score, adherence, PDC, action, etc. server-side to avoid N+1 fetches).
 */
export async function fetchPatients(limit = 50) {
  const res = await fetch(`${API_BASE_URL}/patients/full-profiles?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch patients: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * Fetch single patient full profile by ID
 */
export async function fetchPatientFullProfile(patientId) {
  const res = await fetch(`${API_BASE_URL}/patients/${patientId}/full-profile`);
  if (!res.ok) {
    throw new Error(`Failed to fetch patient profile for ${patientId}: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Runs the real classifier + SHAP + survival model on demand for one
 * patient and persists the result. Only works for patients with real
 * ML feature history.
 */
export async function runPrediction(patientId) {
  const res = await fetch(`${API_BASE_URL}/risk/${patientId}/predict`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to generate prediction. Please try again.");
  }
  return await res.json();
}

/**
 * Sign up a new care manager account
 */
export async function signupUser(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Could not create account. Please try again.");
  }
  return data;
}

/**
 * Authenticate with email + password
 */
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Invalid email or password.");
  }
  return data;
}

/**
 * Update the logged-in user's profile (name/org/role/email/password)
 */
export async function updateUserProfile(userId, payload) {
  const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Could not update profile. Please try again.");
  }
  return data;
}

/**
 * Fetch configurable action rules
 */
export async function fetchActionRules() {
  const res = await fetch(`${API_BASE_URL}/actions/rules`);
  if (!res.ok) {
    throw new Error(`Failed to fetch action rules: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Update / replace all action rules
 */
export async function updateActionRules(rules) {
  const payload = Array.isArray(rules) ? { rules } : rules;
  const res = await fetch(`${API_BASE_URL}/actions/rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to update action rules: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Log an intervention outcome for a patient
 */
export async function logInterventionOutcome(payload) {
  const res = await fetch(`${API_BASE_URL}/outcomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to log intervention outcome: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetch model metrics for monitoring page
 */
export async function fetchModelPerformance() {
  const res = await fetch(`${API_BASE_URL}/monitoring/model-performance`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model performance: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetch threshold settings from backend DB
 */
export async function fetchSettings() {
  const res = await fetch(`${API_BASE_URL}/settings`);
  if (!res.ok) {
    throw new Error(`Failed to fetch settings: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Update threshold settings in backend DB
 */
export async function updateSettings(settingsPayload) {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settingsPayload)
  });
  if (!res.ok) {
    throw new Error(`Failed to update settings: HTTP ${res.status}`);
  }
  return await res.json();
}

