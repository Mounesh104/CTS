import React, { useState, useEffect } from "react";
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Clock, 
  ArrowRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { RiskDistribution } from "../components/RiskDistribution";
import { AdherenceChart } from "../components/AdherenceChart";
import { mockDashboardData } from "../data/mockPatients";
import { fetchDashboardSummary } from "../services/api";

export function Dashboard({ 
  patients, 
  onViewPatient,
  onNavigateToPatients,
  onNavigateToInterventions,
  settings
}) {
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    highRiskCount: 0,
    averageAdherence: 0,
    interventionsRequired: 0,
    adherenceTrend: [],
    recentActivity: []
  });

  const pdcTarget = settings?.pdc_target ?? 80;

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary();
        setDashboardData(data);
      } catch (err) {
        console.warn("Could not fetch dashboard summary from API:", err);
      }
    }
    loadSummary();
  }, []);

  // Extract macro metrics
  const { totalPatients, highRiskCount, averageAdherence, interventionsRequired, adherenceTrend, recentActivity } = dashboardData;

  // Get top 5 highest risk patients for the attention queue
  const attentionQueue = [...patients]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Active Patients"
          value={totalPatients.toLocaleString()}
          icon={Users}
          trend={{ value: "+2.4%", positive: true, label: "vs last month" }}
          tooltip="Total patient cohort currently registered for Hypertension care monitoring."
        />
        <MetricCard
          title="High-Risk Patients"
          value={highRiskCount.toString()}
          icon={AlertTriangle}
          trend={{ value: `${totalPatients > 0 ? Math.round((highRiskCount / totalPatients) * 100) : 0}%`, positive: true, label: "of total patients" }}
          tooltip="Total count of patients identified as high risk for non-adherence or persistency issues."
        />
        <MetricCard
          title="Average Cohort Adherence"
          value={`${averageAdherence}%`}
          icon={Activity}
          trend={{ value: "+1.1%", positive: true, label: "increase vs last month" }}
          tooltip="Mean Proportion of Days Covered (PDC) score across all active patients."
        />
        <MetricCard
          title="Interventions Pending"
          value={interventionsRequired.toString()}
          icon={Clock}
          trend={{ value: "8 today", positive: false, label: "awaiting clinical review" }}
          tooltip="Patients meeting risk triggers who have not yet had an intervention initiated."
        />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RiskDistribution patients={patients} />
        </div>
        <div className="lg:col-span-3">
          <AdherenceChart trendData={adherenceTrend} pdcTarget={pdcTarget} />
        </div>
      </div>

      {/* Table & Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attention Queue */}
        <div className="lg:col-span-2 premium-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Attention Queue — Top 5
                </h4>
                <h3 className="text-lg font-bold text-slate-800">
                  Patients Requiring Attention
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Highest-priority patients by risk score
                </p>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-semibold border border-amber-200">
                Top Priority Queue
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-2">Patient ID</th>
                    <th className="py-3 px-2 text-center">Risk Score</th>
                    <th className="py-3 px-2">Risk Level</th>
                    <th className="py-3 px-2 text-center">Adherence (PDC)</th>
                    <th className="py-3 px-2">Primary Risk Factor</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {attentionQueue.map((patient) => {
                    const topFactor = patient.top_risk_factors?.[0]?.factor || "N/A";
                    return (
                      <tr 
                        key={patient.patient_id} 
                        className="hover:bg-slate-50/80 transition-colors group/row"
                      >
                        <td className="py-3.5 px-2 text-slate-900 font-bold">
                          {patient.patient_id}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`text-sm font-bold ${
                            patient.risk_level === "High" ? "text-rose-600" : patient.risk_level === "Medium" ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {patient.risk_score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <RiskBadge level={patient.risk_level} />
                        </td>
                        <td className="py-3.5 px-2 text-center text-slate-700 font-semibold">
                          {patient.adherence}%
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 text-xs">
                          {topFactor}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            onClick={() => onViewPatient(patient.patient_id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-md"
                          >
                            View
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 transition-all" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
            <button
              onClick={onNavigateToPatients}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all cursor-pointer"
            >
              View all patients
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToInterventions}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline transition-all cursor-pointer"
            >
              View intervention queue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Operation History
            </h4>
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Recent Intervention Activity
            </h3>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-xs leading-relaxed">
                  <div className="mt-1 flex flex-col items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-slate-100 ${
                      activity.status === "Triggered" || activity.status === "Scheduled"
                        ? "bg-amber-500"
                        : activity.status === "Completed"
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`} />
                    <div className="w-[2px] h-full bg-slate-100 mt-2" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-slate-800">{activity.patient_id}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{activity.timestamp}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mb-1">{activity.description}</p>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      activity.status === "Completed" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
