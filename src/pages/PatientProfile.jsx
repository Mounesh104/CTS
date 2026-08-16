import React, { useState } from "react";
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  PhoneCall,
  ShieldAlert,
  Info
} from "lucide-react";
import { RiskBadge } from "../components/RiskBadge";
import { CONFIG } from "../data/config";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine 
} from "recharts";

export function PatientProfile({ selectedPatientId, patients, onUpdatePatient, originTab, onBack }) {
  // Derive contextual back-button label from whichever page opened this profile
  const backLabel = {
    dashboard: "Back to Dashboard",
    patients: "Back to Patients",
    interventions: "Back to Interventions",
    monitoring: "Back to Monitoring"
  }[originTab] ?? "Back to Patients";
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  // Find the selected patient
  const patient = patients.find(p => p.patient_id === selectedPatientId);

  if (!patient) {
    return (
      <div className="premium-card p-12 text-center max-w-xl mx-auto my-12 bg-white">
        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Patient Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          The requested patient ID <strong>{selectedPatientId}</strong> could not be located in the clinical system.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  // Generate deterministic 6-month history for Recharts
  const generateHistoryTrend = (currentAdherence) => {
    // Ensures visual consistency while mapping to the specific patient's current adherence score
    return [
      { month: "Jan", adherence: Math.min(100, currentAdherence + 9) },
      { month: "Feb", adherence: Math.min(100, currentAdherence + 5) },
      { month: "Mar", adherence: Math.min(100, currentAdherence + 7) },
      { month: "Apr", adherence: Math.min(100, currentAdherence + 2) },
      { month: "May", adherence: Math.min(100, currentAdherence - 3) },
      { month: "Jun", adherence: currentAdherence }
    ];
  };

  const trendData = generateHistoryTrend(patient.adherence);

  // Intervention details lookup
  const getInterventionDetails = (action) => {
    switch (action) {
      case "Copay Assistance":
        return {
          reason: "High medication copay is identified as a major contributor to non-adherence risk.",
          priority: "High Priority",
          priorityColor: "text-rose-600 bg-rose-50 border-rose-100",
          icon: CreditCard
        };
      case "Nurse Follow-up":
        return {
          reason: "Patient reports drug side-effects or clinical issues requiring personalized counseling.",
          priority: "High Priority",
          priorityColor: "text-rose-600 bg-rose-50 border-rose-100",
          icon: PhoneCall
        };
      case "SMS Reminder":
        return {
          reason: "Daily behavioral compliance cues needed to address minor refill gaps and missed doses.",
          priority: "Medium Priority",
          priorityColor: "text-amber-600 bg-amber-50 border-amber-100",
          icon: MessageSquare
        };
      case "Clinical Pharmacist":
        return {
          reason: "Comorbidities and complex polypharmacy list require clinical regimen review.",
          priority: "High Priority",
          priorityColor: "text-rose-600 bg-rose-50 border-rose-100",
          icon: ShieldAlert
        };
      default:
        return {
          reason: "Recommended clinical outreach to restore medication persistency guidelines.",
          priority: "Medium Priority",
          priorityColor: "text-amber-600 bg-amber-50 border-amber-100",
          icon: Activity
        };
    }
  };

  const currentDetails = getInterventionDetails(patient.recommended_action);

  // Triggering workflow
  const openConfirmation = (actionType) => {
    setSelectedIntervention(actionType || patient.recommended_action);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmIntervention = () => {
    const updatedHistory = [
      {
        type: selectedIntervention,
        status: "Triggered",
        timestamp: "Just now"
      },
      ...(patient.intervention_history || [])
    ];

    const updatedPatient = {
      ...patient,
      intervention_status: "Triggered",
      intervention_history: updatedHistory
    };

    onUpdatePatient(updatedPatient);
    setIsConfirmModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Top Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Patient ID: {patient.patient_id}
            </h1>
            <RiskBadge level={patient.risk_level} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Therapy Area: <strong className="text-slate-700">{CONFIG.THERAPY_AREA}</strong>
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Adherence / PDC
            </span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${patient.adherence < 80 ? "text-rose-600" : "text-slate-900"}`}>
              {patient.adherence}%
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Target: &ge;80% PDC
            </span>
          </div>
        </div>

        {/* Persistency */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Persistency
            </span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {patient.persistency_months} mo
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Duration on therapy
            </span>
          </div>
        </div>

        {/* Refill Gap */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Refill Gap
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${patient.refill_gap_days > 7 ? "text-rose-600" : "text-slate-900"}`}>
              {patient.refill_gap_days} days
            </h3>
            <span className={`text-[10px] font-bold uppercase ${patient.refill_gap_days > 0 ? "text-rose-500" : "text-emerald-500"}`}>
              {patient.refill_gap_days > 0 ? "Overdue for refill" : "Refill on track"}
            </span>
          </div>
        </div>

        {/* Copay Level */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Copay Level
            </span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {patient.copay_level}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Out-of-pocket tier
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Columns - Risk Overview & Explainability */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Overview Progress Card */}
          <div className="premium-card p-6 flex flex-col justify-between h-[230px]">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Predictive Analytics
              </h4>
              <h3 className="text-lg font-bold text-slate-800">
                Risk Overview
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5 mb-4">
                Calculated risk score based on predictive models.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-600">Risk Score</span>
                <span className={`text-4xl font-extrabold tracking-tight ${
                  patient.risk_level === "High" ? "text-rose-600" : patient.risk_level === "Medium" ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {patient.risk_score}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    patient.risk_level === "High" ? "bg-rose-500" : patient.risk_level === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${patient.risk_score}%` }}
                />
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Low &lt; 40% · Medium &ge; 40% · High &ge; 70%</span>
            </div>
          </div>

          {/* Risk Explainability Contribution Card */}
          <div className="premium-card p-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Risk Attribution
              </h4>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Why is this patient at risk?
              </h3>
              <p className="text-xs text-slate-500 font-normal mb-5">
                Model contribution analysis of leading risk factors.
              </p>
            </div>

            <div className="space-y-4.5">
              {patient.top_risk_factors && patient.top_risk_factors.length > 0 ? (
                patient.top_risk_factors.map((factorObj, index) => {
                  const percentage = Math.round(factorObj.contribution * 100);
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{factorObj.factor}</span>
                        <span className="text-slate-500">+{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600/80 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">No significant risk contributors detected.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Columns - Historical Trend & Intervention Triggers */}
        <div className="lg:col-span-3 space-y-6">

          {/* Adherence Trend Chart Card */}
          <div className="premium-card p-6 h-[230px] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Historical Trend
              </h4>
              <h3 className="text-lg font-bold text-slate-800">
                Patient Adherence Trend
              </h3>
            </div>

            <div className="w-full h-36 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPatientAdherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} 
                  />
                  <YAxis 
                    domain={[40, 100]} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value) => [`${value}%`, "Adherence"]}
                    labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                  />
                  <ReferenceLine 
                    y={80} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: "80% PDC Target", 
                      position: "insideBottomRight", 
                      fill: "#ef4444", 
                      fontSize: 9, 
                      fontWeight: 600,
                      offset: 6
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="adherence"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPatientAdherence)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommended Intervention / Actions Card */}
          <div className="premium-card p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Clinical Workflow
              </h4>
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Recommended Intervention
              </h3>

              {/* Status conditional rendering */}
              {patient.intervention_status === "Triggered" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-5 flex items-start gap-3">
                  <div className="p-1 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 mb-0.5">
                      Intervention Initiated
                    </h4>
                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                      Outreach program for <strong>{patient.recommended_action}</strong> was successfully requested.
                      The patient record and task history logs have been updated.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {React.createElement(currentDetails.icon || Activity, { className: "w-4 h-4 text-blue-600" })}
                      <span className="text-sm font-bold text-slate-800">
                        {patient.recommended_action}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentDetails.priorityColor}`}>
                      {currentDetails.priority}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-600 leading-relaxed font-semibold">
                      <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold mb-0.5">Reason for Recommendation</span>
                      {currentDetails.reason}
                    </p>
                    <p className="text-slate-600 leading-relaxed font-semibold">
                      <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold mb-0.5">Priority</span>
                      <span className="capitalize">{patient.risk_level} Priority</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {patient.intervention_status !== "Triggered" && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => openConfirmation(patient.recommended_action)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                >
                  Trigger Intervention
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openConfirmation("SMS Reminder")}
                    className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Send Reminder
                  </button>
                  <button
                    onClick={() => openConfirmation("Nurse Follow-up")}
                    className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    Schedule Nurse Call
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Intervention History Panel */}
      <div className="premium-card p-6">
        <h3 className="text-md font-bold text-slate-800 mb-4">
          Intervention History
        </h3>
        <div className="relative border-l-2 border-slate-100 pl-5 ml-2.5 space-y-5">
          {patient.intervention_history && patient.intervention_history.length > 0 ? (
            patient.intervention_history.map((log, index) => (
              <div key={index} className="relative text-xs">
                {/* Visual marker dot */}
                <span className={`absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ring-slate-50 ${
                  log.status === "Triggered" 
                    ? "bg-amber-500" 
                    : log.status === "Completed" 
                    ? "bg-emerald-500" 
                    : "bg-blue-500"
                }`} />
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-bold text-slate-800">{log.type}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{log.timestamp}</span>
                </div>
                <p className="text-slate-500 text-[11px] font-medium">
                  Status:{" "}
                  <span className={`font-bold uppercase ${
                    log.status === "Completed" 
                      ? "text-emerald-600" 
                      : log.status === "Triggered" 
                      ? "text-amber-600" 
                      : "text-blue-600"
                  }`}>
                    {log.status}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No history log records available for this patient.</p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Confirm Intervention Trigger
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-xs leading-relaxed text-slate-600 space-y-2.5 bg-slate-50 p-4 border border-slate-100 rounded-lg font-semibold">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Patient ID</span>
                  <span className="text-slate-900 font-bold">{patient.patient_id}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recommended Intervention</span>
                  <span className="text-blue-600 font-bold">{selectedIntervention}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reason</span>
                  <span className="text-slate-700">{getInterventionDetails(selectedIntervention).reason}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIntervention}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Confirm Intervention
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
