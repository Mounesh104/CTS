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
 * Fetch patient list with full profiles
 */
export async function fetchPatients(limit = 50) {
  const res = await fetch(`${API_BASE_URL}/patients?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch patients: HTTP ${res.status}`);
  }
  const data = await res.json();

  // Enrich each patient item with full-profile data (risk score, adherence, PDC, action, etc.)
  const fullProfiles = await Promise.all(
    (data.items || []).map(async (p) => {
      try {
        const profileRes = await fetch(`${API_BASE_URL}/patients/${p.patient_id}/full-profile`);
        if (profileRes.ok) {
          return await profileRes.json();
        }
      } catch (err) {
        console.warn(`Could not fetch full profile for ${p.patient_id}:`, err);
      }
      return {
        patient_id: p.patient_id,
        diagnosis: p.diagnosis || "Hypertension",
        risk_score: 45,
        risk_level: "Medium",
        adherence: 82.5,
        persistency_months: 6.0,
        refill_gap_days: 0,
        copay_level: "Low",
        comorbidities: ["None"],
        top_risk_factors: [],
        recommended_action: "Routine Monitoring",
        intervention_status: "Pending",
        intervention_history: []
      };
    })
  );

  return fullProfiles;
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

