import React, { useState } from "react";
import { 
  HeartHandshake, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Filter,
  RotateCcw,
  Search,
  X
} from "lucide-react";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";

export function Interventions({ patients, onViewPatient }) {
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Dynamic KPI counts computed from the global patients state
  const pendingCount = patients.filter(p => p.intervention_status === "Pending").length;
  const inProgressCount = patients.filter(p => p.intervention_status === "Triggered").length;
  const completedCount = patients.filter(p => p.intervention_status === "Completed").length;
  const highPriorityCount = patients.filter(
    p => (p.risk_level === "High" || p.risk_level === "Critical") && p.intervention_status !== "Completed"
  ).length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setTypeFilter("All");
  };

  // Filter logic
  const filteredPatients = patients.filter(p => {
    const matchesSearch = !searchQuery.trim() || p.patient_id.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesStatus = statusFilter === "All" || p.intervention_status === statusFilter;
    const matchesPriority = priorityFilter === "All" || p.risk_level === priorityFilter;
    const matchesType = typeFilter === "All" || p.recommended_action === typeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Unique intervention actions for filter dropdown
  const uniqueTypes = Array.from(new Set(patients.map(p => p.recommended_action)));

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case "Triggered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            In Progress
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Outreach"
          value={pendingCount.toString()}
          icon={Clock}
          trend={{ value: "Action Required", positive: false, label: "clinical queue" }}
          tooltip="Interventions recommended by scoring but not yet triggered."
        />
        <MetricCard
          title="In Progress"
          value={inProgressCount.toString()}
          icon={HeartHandshake}
          trend={{ value: "Active Support", positive: true, label: "outreach initiated" }}
          tooltip="Support programs currently requested and awaiting response."
        />
        <MetricCard
          title="Completed Outreach"
          value={completedCount.toString()}
          icon={CheckCircle2}
          trend={{ value: "Resolved Cases", positive: true, label: "compliance restored" }}
          tooltip="Successfully conducted interventions this period."
        />
        <MetricCard
          title="High Priority"
          value={highPriorityCount.toString()}
          icon={AlertCircle}
          trend={{ value: "Urgent", positive: false, label: "requires immediate call" }}
          tooltip="Pending cases with High Risk scores."
        />
      </div>

      {/* Filter Board */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          
          {/* Patient ID Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient ID (e.g. P1024)..."
              className="w-full pl-10 pr-9 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-[2]">
            {/* Status Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-16 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Queue</option>
                <option value="Triggered">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
                Priority:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-18 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical Risk</option>
                <option value="High">High Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="Low">Low Risk</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Intervention Type Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
                Action:
              </span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-16 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
              >
                <option value="All">All Outreach Actions</option>
                {uniqueTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Empty State Render */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredPatients.length} of {patients.length} records
        </span>
        {(searchQuery || statusFilter !== "All" || priorityFilter !== "All" || typeFilter !== "All") && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset outreach filters
          </button>
        )}
      </div>

      {filteredPatients.length > 0 ? (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4.5 px-6">Patient Reference</th>
                  <th className="py-4.5 px-6">Risk Level</th>
                  <th className="py-4.5 px-6 text-center">Risk Score</th>
                  <th className="py-4.5 px-6">Recommended Action</th>
                  <th className="py-4.5 px-6">Workflow Status</th>
                  <th className="py-4.5 px-6">Last Activity</th>
                  <th className="py-4.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.map((patient) => {
                  const lastLogType = patient.intervention_history?.[0]?.type || "N/A";
                  const lastLogTime = patient.intervention_history?.[0]?.timestamp || "N/A";

                  return (
                    <tr 
                      key={patient.patient_id} 
                      className="hover:bg-slate-50/70 transition-colors group/row"
                    >
                      <td className="py-4 px-6 text-slate-900 font-bold">
                        {patient.patient_id}
                      </td>
                      <td className="py-4 px-6">
                        <RiskBadge level={patient.risk_level} />
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-800">
                        {patient.risk_score}%
                      </td>
                      <td className="py-4 px-6 text-slate-700 text-xs font-semibold">
                        {patient.recommended_action}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(patient.intervention_status)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        <span className="font-semibold block text-slate-500">{lastLogType}</span>
                        <span>{lastLogTime}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onViewPatient(patient.patient_id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 cursor-pointer"
                        >
                          View Profile
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
      ) : (
        <div className="premium-card p-12 text-center max-w-lg mx-auto bg-white">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-md font-bold text-slate-800 mb-1">No outreach records match</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
            No patient interventions fit your current filtering matrix. Try adjusting statuses, priorities, or action filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
