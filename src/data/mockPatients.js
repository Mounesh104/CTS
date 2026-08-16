export const mockPatients = [
  {
    patient_id: "P1024",
    therapy_area: "Hypertension",
    risk_score: 82,
    risk_level: "High",
    adherence: 62, // Proportion of Days Covered (PDC)
    persistency_months: 8,
    refill_gap_days: 14,
    copay_level: "High",
    comorbidities: ["Type 2 Diabetes", "Chronic Kidney Disease"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.31 },
      { factor: "High Copay", contribution: 0.22 },
      { factor: "Comorbidities", contribution: 0.14 },
      { factor: "Previous Adherence", contribution: 0.06 }
    ],
    recommended_action: "Copay Assistance",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1087",
    therapy_area: "Hypertension",
    risk_score: 76,
    risk_level: "High",
    adherence: 67,
    persistency_months: 11,
    refill_gap_days: 18,
    copay_level: "Medium",
    comorbidities: ["Obesity", "Hyperlipidemia"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.35 },
      { factor: "Side Effects", contribution: 0.20 },
      { factor: "Previous Adherence", contribution: 0.10 }
    ],
    recommended_action: "Nurse Follow-up",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1132",
    therapy_area: "Hypertension",
    risk_score: 58,
    risk_level: "Medium",
    adherence: 74,
    persistency_months: 5,
    refill_gap_days: 7,
    copay_level: "Low",
    comorbidities: ["Depression"],
    top_risk_factors: [
      { factor: "Missed Doses", contribution: 0.25 },
      { factor: "Comorbidities", contribution: 0.12 },
      { factor: "Refill Gap", contribution: 0.08 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Triggered"
  },
  {
    patient_id: "P1204",
    therapy_area: "Hypertension",
    risk_score: 89,
    risk_level: "High",
    adherence: 51,
    persistency_months: 3,
    refill_gap_days: 22,
    copay_level: "High",
    comorbidities: ["Coronary Artery Disease", "Type 2 Diabetes"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.42 },
      { factor: "High Copay", contribution: 0.28 },
      { factor: "Comorbidities", contribution: 0.15 }
    ],
    recommended_action: "Copay Assistance",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1221",
    therapy_area: "Hypertension",
    risk_score: 41,
    risk_level: "Medium",
    adherence: 79,
    persistency_months: 14,
    refill_gap_days: 4,
    copay_level: "Low",
    comorbidities: ["Hyperlipidemia"],
    top_risk_factors: [
      { factor: "Side Effects", contribution: 0.18 },
      { factor: "Refill Gap", contribution: 0.11 }
    ],
    recommended_action: "Nurse Follow-up",
    intervention_status: "Completed"
  },
  {
    patient_id: "P1289",
    therapy_area: "Hypertension",
    risk_score: 22,
    risk_level: "Low",
    adherence: 88,
    persistency_months: 24,
    refill_gap_days: 0,
    copay_level: "Low",
    comorbidities: ["None"],
    top_risk_factors: [
      { factor: "Previous Adherence", contribution: 0.08 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1302",
    therapy_area: "Hypertension",
    risk_score: 85,
    risk_level: "High",
    adherence: 58,
    persistency_months: 9,
    refill_gap_days: 19,
    copay_level: "High",
    comorbidities: ["Chronic Kidney Disease", "Heart Failure"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.38 },
      { factor: "High Copay", contribution: 0.25 },
      { factor: "Comorbidities", contribution: 0.18 }
    ],
    recommended_action: "Clinical Pharmacist",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1345",
    therapy_area: "Hypertension",
    risk_score: 65,
    risk_level: "Medium",
    adherence: 71,
    persistency_months: 6,
    refill_gap_days: 9,
    copay_level: "Medium",
    comorbidities: ["Type 2 Diabetes"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.22 },
      { factor: "High Copay", contribution: 0.18 },
      { factor: "Comorbidities", contribution: 0.12 }
    ],
    recommended_action: "Copay Assistance",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1399",
    therapy_area: "Hypertension",
    risk_score: 18,
    risk_level: "Low",
    adherence: 94,
    persistency_months: 18,
    refill_gap_days: 0,
    copay_level: "Low",
    comorbidities: ["None"],
    top_risk_factors: [
      { factor: "Previous Adherence", contribution: 0.05 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Completed"
  },
  {
    patient_id: "P1410",
    therapy_area: "Hypertension",
    risk_score: 79,
    risk_level: "High",
    adherence: 64,
    persistency_months: 10,
    refill_gap_days: 15,
    copay_level: "High",
    comorbidities: ["Obesity", "Depression"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.30 },
      { factor: "High Copay", contribution: 0.24 },
      { factor: "Comorbidities", contribution: 0.15 }
    ],
    recommended_action: "Copay Assistance",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1452",
    therapy_area: "Hypertension",
    risk_score: 30,
    risk_level: "Low",
    adherence: 83,
    persistency_months: 12,
    refill_gap_days: 2,
    copay_level: "Medium",
    comorbidities: ["Hyperlipidemia"],
    top_risk_factors: [
      { factor: "High Copay", contribution: 0.12 },
      { factor: "Refill Gap", contribution: 0.08 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1490",
    therapy_area: "Hypertension",
    risk_score: 72,
    risk_level: "High",
    adherence: 69,
    persistency_months: 7,
    refill_gap_days: 12,
    copay_level: "Medium",
    comorbidities: ["Obesity", "Sleep Apnea"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.28 },
      { factor: "Side Effects", contribution: 0.18 },
      { factor: "Comorbidities", contribution: 0.12 }
    ],
    recommended_action: "Nurse Follow-up",
    intervention_status: "Triggered"
  },
  {
    patient_id: "P1520",
    therapy_area: "Hypertension",
    risk_score: 93,
    risk_level: "High",
    adherence: 45,
    persistency_months: 4,
    refill_gap_days: 25,
    copay_level: "High",
    comorbidities: ["Type 2 Diabetes", "Chronic Kidney Disease", "Obesity"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.45 },
      { factor: "High Copay", contribution: 0.32 },
      { factor: "Comorbidities", contribution: 0.20 }
    ],
    recommended_action: "Clinical Pharmacist",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1560",
    therapy_area: "Hypertension",
    risk_score: 48,
    risk_level: "Medium",
    adherence: 77,
    persistency_months: 15,
    refill_gap_days: 5,
    copay_level: "Low",
    comorbidities: ["Hyperlipidemia", "Hypothyroidism"],
    top_risk_factors: [
      { factor: "Missed Doses", contribution: 0.20 },
      { factor: "Side Effects", contribution: 0.15 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1601",
    therapy_area: "Hypertension",
    risk_score: 15,
    risk_level: "Low",
    adherence: 96,
    persistency_months: 30,
    refill_gap_days: 0,
    copay_level: "Low",
    comorbidities: ["None"],
    top_risk_factors: [
      { factor: "Previous Adherence", contribution: 0.03 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1644",
    therapy_area: "Hypertension",
    risk_score: 61,
    risk_level: "Medium",
    adherence: 73,
    persistency_months: 9,
    refill_gap_days: 8,
    copay_level: "Medium",
    comorbidities: ["Asthma"],
    top_risk_factors: [
      { factor: "Side Effects", contribution: 0.22 },
      { factor: "Refill Gap", contribution: 0.15 }
    ],
    recommended_action: "Nurse Follow-up",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1690",
    therapy_area: "Hypertension",
    risk_score: 87,
    risk_level: "High",
    adherence: 55,
    persistency_months: 6,
    refill_gap_days: 20,
    copay_level: "High",
    comorbidities: ["Type 2 Diabetes", "Obesity"],
    top_risk_factors: [
      { factor: "Refill Gap", contribution: 0.38 },
      { factor: "High Copay", contribution: 0.29 },
      { factor: "Comorbidities", contribution: 0.14 }
    ],
    recommended_action: "Copay Assistance",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1711",
    therapy_area: "Hypertension",
    risk_score: 34,
    risk_level: "Low",
    adherence: 82,
    persistency_months: 13,
    refill_gap_days: 3,
    copay_level: "Medium",
    comorbidities: ["None"],
    top_risk_factors: [
      { factor: "High Copay", contribution: 0.14 },
      { factor: "Refill Gap", contribution: 0.08 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1750",
    therapy_area: "Hypertension",
    risk_score: 55,
    risk_level: "Medium",
    adherence: 75,
    persistency_months: 10,
    refill_gap_days: 6,
    copay_level: "Low",
    comorbidities: ["Hyperlipidemia"],
    top_risk_factors: [
      { factor: "Missed Doses", contribution: 0.22 },
      { factor: "Refill Gap", contribution: 0.10 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  },
  {
    patient_id: "P1800",
    therapy_area: "Hypertension",
    risk_score: 25,
    risk_level: "Low",
    adherence: 91,
    persistency_months: 20,
    refill_gap_days: 1,
    copay_level: "Low",
    comorbidities: ["None"],
    top_risk_factors: [
      { factor: "Previous Adherence", contribution: 0.06 }
    ],
    recommended_action: "SMS Reminder",
    intervention_status: "Pending"
  }
];

// Enrich mock patients with intervention history based on their current status
mockPatients.forEach(patient => {
  patient.intervention_history = [
    { type: "Initial Risk Assessment", status: "Completed", timestamp: "3 days ago" }
  ];
  if (patient.intervention_status === "Triggered") {
    patient.intervention_history.unshift({
      type: patient.recommended_action,
      status: "Triggered",
      timestamp: "2 hours ago"
    });
  } else if (patient.intervention_status === "Completed") {
    patient.intervention_history.unshift({
      type: patient.recommended_action,
      status: "Completed",
      timestamp: "1 day ago"
    });
  }
});

export const mockDashboardData = {
  totalPatients: 1248,
  highRiskCount: 186,
  averageAdherence: 78.4,
  interventionsRequired: 42,
  adherenceTrend: [
    { month: "Jan", adherence: 78.5 },
    { month: "Feb", adherence: 76.2 },
    { month: "Mar", adherence: 73.8 },
    { month: "Apr", adherence: 75.1 },
    { month: "May", adherence: 78.9 },
    { month: "Jun", adherence: 81.4 }
  ],
  recentActivity: [
    { id: 1, patient_id: "P1024", type: "Copay Assistance", description: "Copay assistance initiated", timestamp: "10 mins ago", status: "Triggered" },
    { id: 2, patient_id: "P1087", type: "Nurse Follow-up", description: "Nurse follow-up scheduled", timestamp: "1 hour ago", status: "Scheduled" },
    { id: 3, patient_id: "P1132", type: "SMS Reminder", description: "Medication reminder sent", timestamp: "3 hours ago", status: "Sent" },
    { id: 4, patient_id: "P1221", type: "Nurse Follow-up", description: "Nurse phone call completed", timestamp: "5 hours ago", status: "Completed" }
  ]
};
