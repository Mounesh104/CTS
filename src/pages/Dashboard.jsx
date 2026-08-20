import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  Activity,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { RiskDistribution } from "../components/RiskDistribution";
import { AdherenceChart } from "../components/AdherenceChart";
import {
  fetchDashboardKpis,
  fetchRiskDistribution,
  fetchAdherenceTrend,
  fetchCohorts,
  fetchHighRiskPatients,
  fetchDashboardSummary
} from "../services/api";

const HIGH_RISK_PAGE_SIZE = 10;

export function Dashboard({
  patients,
  onViewPatient,
  onNavigateToPatients,
  onNavigateToInterventions,
  settings
}) {
  const [kpis, setKpis] = useState({
    totalPatients: 0,
    criticalRiskCount: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    lowRiskCount: 0,
    averageAdherence: 0,
    interventionsRequired: 0
  });
  const [riskDistribution, setRiskDistribution] = useState(null);
  const [adherenceTrend, setAdherenceTrend] = useState([]);
  const [cohorts, setCohorts] = useState({ byAgeGroup: [], byRiskCategory: [], byAdherenceBand: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [highRiskPatients, setHighRiskPatients] = useState({ total: 0, page: 1, page_size: HIGH_RISK_PAGE_SIZE, items: [] });
  const [highRiskPage, setHighRiskPage] = useState(1);

  const pdcTarget = settings?.pdc_target ?? 80;

  useEffect(() => {
    async function loadTopLevel() {
      try {
        const [kpisRes, distributionRes, trendRes, cohortsRes, summaryRes] = await Promise.all([
          fetchDashboardKpis(),
          fetchRiskDistribution(),
          fetchAdherenceTrend(6),
          fetchCohorts(),
          fetchDashboardSummary()
        ]);
        setKpis(kpisRes);
        setRiskDistribution(distributionRes);
        setAdherenceTrend(trendRes);
        setCohorts(cohortsRes);
        setRecentActivity(summaryRes.recentActivity || []);
      } catch (err) {
        console.warn("Could not fetch dashboard data from API:", err);
      }
    }
    loadTopLevel();
  }, []);

  useEffect(() => {
    async function loadHighRisk() {
      try {
        const data = await fetchHighRiskPatients(highRiskPage, HIGH_RISK_PAGE_SIZE);
        setHighRiskPatients(data);
      } catch (err) {
        console.warn("Could not fetch high-risk patients from API:", err);
      }
    }
    loadHighRisk();
  }, [highRiskPage]);

  const {
    totalPatients, criticalRiskCount, highRiskCount, moderateRiskCount, lowRiskCount,
    averageAdherence, interventionsRequired
  } = kpis;

  const totalHighRiskPages = Math.max(1, Math.ceil(highRiskPatients.total / HIGH_RISK_PAGE_SIZE));

  const riskLevelTextColor = (level) =>
    level === "Critical" ? "text-purple-600"
      : level === "High" ? "text-rose-600"
      : level === "Moderate" ? "text-amber-600"
      : "text-emerald-600";

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Active Patients"
          value={totalPatients.toLocaleString()}
          icon={Users}
          trend={{ value: `${totalPatients.toLocaleString()} synthetic`, positive: true, label: "records generated" }}
          tooltip="Total synthetic patient cohort currently registered for Hypertension care monitoring."
        />
        <MetricCard
          title="Critical-Risk Patients"
          value={criticalRiskCount.toString()}
          icon={ShieldAlert}
          trend={{ value: `${totalPatients > 0 ? Math.round((criticalRiskCount / totalPatients) * 100) : 0}%`, positive: true, label: "of total patients" }}
          tooltip="Patients requiring urgent clinical intervention."
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
          trend={{ value: `${moderateRiskCount + lowRiskCount} stable`, positive: true, label: "moderate/low risk patients" }}
          tooltip="Mean Proportion of Days Covered (PDC) score across all active patients."
        />
        <MetricCard
          title="Interventions Pending"
          value={interventionsRequired.toString()}
          icon={Clock}
          trend={{ value: `${lowRiskCount.toLocaleString()} on track`, positive: false, label: "low-risk patients" }}
          tooltip="Patients meeting risk triggers who have not yet had an intervention initiated."
        />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RiskDistribution patients={patients} distribution={riskDistribution} />
        </div>
        <div className="lg:col-span-3">
          <AdherenceChart trendData={adherenceTrend} pdcTarget={pdcTarget} />
        </div>
      </div>

      {/* Cohort Analysis + Adherence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Analysis */}
        <div className="premium-card p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Population Segmentation
          </h4>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Cohort Analysis</h3>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">By Age Group</span>
              <div className="space-y-2">
                {cohorts.byAgeGroup.map((c) => (
                  <div key={c.group} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 w-24">{c.group}</span>
                    <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.count / totalPatients) * 100}%` }} />
                    </div>
                    <span className="text-slate-500 font-medium w-28 text-right">{c.count} pts · {c.avgAdherence}% adh</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">By Risk Category</span>
              <div className="space-y-2">
                {cohorts.byRiskCategory.map((c) => (
                  <div key={c.group} className="flex items-center justify-between text-xs">
                    <span className={`font-semibold w-24 ${riskLevelTextColor(c.group)}`}>{c.group}</span>
                    <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.group === "Critical" ? "bg-purple-600" : c.group === "High" ? "bg-rose-500" : c.group === "Moderate" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${(c.count / totalPatients) * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-500 font-medium w-28 text-right">{c.count} pts · {c.avgAdherence}% adh</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Adherence Distribution */}
        <div className="premium-card p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Compliance Breakdown
          </h4>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Adherence Distribution</h3>

          <div className="space-y-3">
            {cohorts.byAdherenceBand.map((c) => {
              const bandColor = {
                Excellent: "bg-emerald-500", Good: "bg-blue-500", Moderate: "bg-amber-500",
                Poor: "bg-orange-500", Critical: "bg-rose-600"
              }[c.group] || "bg-slate-400";
              return (
                <div key={c.group} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 w-20">{c.group}</span>
                  <div className="flex-1 mx-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bandColor}`} style={{ width: `${(c.count / totalPatients) * 100}%` }} />
                  </div>
                  <span className="text-slate-500 font-medium w-32 text-right">
                    {c.count} ({totalPatients > 0 ? Math.round((c.count / totalPatients) * 100) : 0}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top High-Risk Patients & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top High-Risk Patients (paginated) */}
        <div className="lg:col-span-2 premium-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Attention Queue
                </h4>
                <h3 className="text-lg font-bold text-slate-800">
                  Top {HIGH_RISK_PAGE_SIZE} High-Risk Patients
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Highest-priority patients by risk score, {highRiskPatients.total.toLocaleString()} total ranked
                </p>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-semibold border border-amber-200">
                Page {highRiskPage} of {totalHighRiskPages}
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
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {highRiskPatients.items.map((patient) => (
                    <tr
                      key={patient.patient_id}
                      className="hover:bg-slate-50/80 transition-colors group/row"
                    >
                      <td className="py-3.5 px-2 text-slate-900 font-bold">
                        {patient.patient_id}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`text-sm font-bold ${riskLevelTextColor(patient.risk_level)}`}>
                          {patient.risk_score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <RiskBadge level={patient.risk_level} />
                      </td>
                      <td className="py-3.5 px-2 text-center text-slate-700 font-semibold">
                        {patient.adherence != null ? `${patient.adherence}%` : "—"}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination + CTA Footer */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHighRiskPage((p) => Math.max(1, p - 1))}
                disabled={highRiskPage <= 1}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setHighRiskPage((p) => Math.min(totalHighRiskPages, p + 1))}
                disabled={highRiskPage >= totalHighRiskPages}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-400 font-semibold ml-1">
                Showing {highRiskPatients.items.length ? (highRiskPage - 1) * HIGH_RISK_PAGE_SIZE + 1 : 0}
                –{(highRiskPage - 1) * HIGH_RISK_PAGE_SIZE + highRiskPatients.items.length} of {highRiskPatients.total.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onNavigateToPatients}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all cursor-pointer"
            >
              View all patients
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
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
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
              )) : (
                <p className="text-xs text-slate-400 italic">No recent activity recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
