import React, { useState } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Info,
  CalendarDays,
  ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from "recharts";

export function Monitoring({ patients, onViewPatient }) {
  const [timePeriod, setTimePeriod] = useState("6M");

  // Dynamic calculations based on global patients state
  const totalPatients = patients.length;
  const currentPDC = Math.round(
    patients.reduce((sum, p) => sum + p.adherence, 0) / (totalPatients || 1)
  );
  const belowBenchmarkCount = patients.filter(p => p.adherence < 80).length;
  const decliningAdherenceCount = patients.filter(p => p.adherence < 70 && p.risk_score >= 50).length;

  // Filter high-risk patients with lowest compliance for "Patients to Watch"
  const watchList = [...patients]
    .filter(p => p.adherence < 80)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 4);

  // Top Risk Drivers based on patient list factors
  const driverCounts = {};
  patients.forEach(p => {
    if (p.top_risk_factors) {
      p.top_risk_factors.forEach(f => {
        driverCounts[f.factor] = (driverCounts[f.factor] || 0) + 1;
      });
    }
  });

  const topDrivers = Object.keys(driverCounts)
    .map(name => ({
      name,
      percentage: Math.round((driverCounts[name] / (totalPatients || 1)) * 100),
      count: driverCounts[name]
    }))
    .sort((a, b) => b.count - a.count);

  // Time-period sensitive data maps
  const getPeriodData = (period) => {
    switch (period) {
      case "30D":
        return {
          adherence: [
            { name: "Week 1", adherence: currentPDC + 2.5 },
            { name: "Week 2", adherence: currentPDC + 1.2 },
            { name: "Week 3", adherence: currentPDC - 0.8 },
            { name: "Week 4", adherence: currentPDC }
          ],
          persistence: [
            { name: "Week 1", persistency: 99 },
            { name: "Week 2", persistency: 98 },
            { name: "Week 3", persistency: 97.5 },
            { name: "Week 4", persistency: 97 }
          ],
          change: "+0.8% this month"
        };
      case "90D":
        return {
          adherence: [
            { name: "Month 1", adherence: currentPDC + 3.4 },
            { name: "Month 2", adherence: currentPDC + 1.8 },
            { name: "Month 3", adherence: currentPDC }
          ],
          persistence: [
            { name: "Month 1", persistency: 97.2 },
            { name: "Month 2", persistency: 94.8 },
            { name: "Month 3", persistency: 92.5 }
          ],
          change: "+1.4% vs last Q"
        };
      case "6M":
        return {
          adherence: [
            { name: "Jan", adherence: currentPDC + 4.2 },
            { name: "Feb", adherence: currentPDC + 2.5 },
            { name: "Mar", adherence: currentPDC - 1.2 },
            { name: "Apr", adherence: currentPDC + 0.8 },
            { name: "May", adherence: currentPDC - 0.5 },
            { name: "Jun", adherence: currentPDC }
          ],
          persistence: [
            { name: "Jan", persistency: 98.4 },
            { name: "Feb", persistency: 95.2 },
            { name: "Mar", persistency: 91.8 },
            { name: "Apr", persistency: 88.5 },
            { name: "May", persistency: 85.9 },
            { name: "Jun", persistency: 83.2 }
          ],
          change: "+1.2% over 6 mo"
        };
      case "12M":
        return {
          adherence: [
            { name: "Jul", adherence: currentPDC + 5.1 },
            { name: "Aug", adherence: currentPDC + 4.8 },
            { name: "Sep", adherence: currentPDC + 3.2 },
            { name: "Oct", adherence: currentPDC + 2.1 },
            { name: "Nov", adherence: currentPDC + 0.5 },
            { name: "Dec", adherence: currentPDC - 1.2 },
            { name: "Jan", adherence: currentPDC - 0.8 },
            { name: "Feb", adherence: currentPDC + 0.4 },
            { name: "Mar", adherence: currentPDC + 1.5 },
            { name: "Apr", adherence: currentPDC + 0.8 },
            { name: "May", adherence: currentPDC - 0.2 },
            { name: "Jun", adherence: currentPDC }
          ],
          persistence: [
            { name: "Jul", persistency: 98.4 },
            { name: "Aug", persistency: 96.1 },
            { name: "Sep", persistency: 93.8 },
            { name: "Oct", persistency: 91.2 },
            { name: "Nov", persistency: 88.9 },
            { name: "Dec", persistency: 86.4 },
            { name: "Jan", persistency: 84.1 },
            { name: "Feb", persistency: 82.3 },
            { name: "Mar", persistency: 80.5 },
            { name: "Apr", persistency: 78.8 },
            { name: "May", persistency: 77.2 },
            { name: "Jun", persistency: 75.4 }
          ],
          change: "+2.1% vs last year"
        };
      default:
        return { adherence: [], persistence: [], change: "" };
    }
  };

  const activeData = getPeriodData(timePeriod);

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Time Range</h4>
          <p className="text-xs text-slate-500 font-medium">
            Longitudinal view of adherence, persistency, and cohort performance.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto font-bold">
          {[
            { id: "30D", label: "30 Days" },
            { id: "90D", label: "90 Days" },
            { id: "6M", label: "6 Months" },
            { id: "12M", label: "12 Months" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimePeriod(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                timePeriod === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* PDC Score */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cohort Adherence (PDC)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {currentPDC}%
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">
              {activeData.change}
            </span>
          </div>
        </div>

        {/* Below Target count */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Below Benchmark
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {belowBenchmarkCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Patients &lt; 80% PDC target
            </span>
          </div>
        </div>

        {/* Declining Trend count */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Declining Trends
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {decliningAdherenceCount}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              High-risk unstable compliance
            </span>
          </div>
        </div>

        {/* Performance status */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Therapy Benchmarks
            </span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {Math.round(((totalPatients - belowBenchmarkCount) / (totalPatients || 1)) * 100)}%
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Of cohort hitting 80% target
            </span>
          </div>
        </div>
      </div>

      {/* Time Series Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Adherence Trend Card */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Adherence Trend
            </h4>
            <h3 className="text-lg font-bold text-slate-800">
              Average Patient Adherence Rate
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Longitudinal Proportion of Days Covered (PDC) trend lines.
            </p>
          </div>

          <div className="w-full h-56 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeData.adherence}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMonitoringAdherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} 
                />
                <YAxis 
                  domain={[60, 90]} 
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
                  formatter={(value) => [`${value}%`, "Avg Adherence"]}
                  labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                />
                <ReferenceLine 
                  y={80} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: "80% Target", 
                    position: "insideBottomRight", 
                    fill: "#ef4444", 
                    fontSize: 9, 
                    fontWeight: 600,
                    offset: 8
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="adherence"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMonitoringAdherence)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
            <span className="text-slate-400">PDC Guideline target benchmark: <strong className="text-slate-600 font-semibold">80.0%</strong></span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
              <span className="font-semibold text-slate-500">Cohort Adherence Average</span>
            </div>
          </div>
        </div>

        {/* Persistency Retention Card */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Persistency Metrics
            </h4>
            <h3 className="text-lg font-bold text-slate-800">
              Therapy Persistency Rate
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Percentage of the patient cohort remaining active on therapy guidelines.
            </p>
          </div>

          <div className="w-full h-56 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeData.persistence}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} 
                />
                <YAxis 
                  domain={[70, 100]} 
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
                  formatter={(value) => [`${value}%`, "Persistence Rate"]}
                  labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="persistency"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
            <span className="text-slate-400">Tracks persistence retention rates</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <span className="font-semibold text-slate-500">Therapy Persistency rate</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Watch List & Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Patients to Watch */}
        <div className="lg:col-span-3 premium-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Watchlist
                </h4>
                <h3 className="text-lg font-bold text-slate-800">
                  Patients to Watch
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-risk cases with compliance values falling below target guidelines.
                </p>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-1 rounded-md font-semibold border border-rose-200">
                Critical Watchlist
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-2">Patient Reference</th>
                    <th className="py-3 px-2 text-center">Compliance (PDC)</th>
                    <th className="py-3 px-2 text-center">Risk Score</th>
                    <th className="py-3 px-2">Key Risk Factor</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {watchList.map((patient) => {
                    const topFactor = patient.top_risk_factors?.[0]?.factor || "N/A";
                    return (
                      <tr 
                        key={patient.patient_id} 
                        className="hover:bg-slate-50/80 transition-colors group/row"
                      >
                        <td className="py-3 px-2 text-slate-900 font-bold">
                          {patient.patient_id}
                        </td>
                        <td className="py-3 px-2 text-center text-rose-600 font-bold">
                          {patient.adherence}%
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-800">
                          {patient.risk_score}%
                        </td>
                        <td className="py-3 px-2 text-slate-500 text-xs">
                          {topFactor}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => onViewPatient(patient.patient_id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-md cursor-pointer"
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
        </div>

        {/* Top Risk Drivers */}
        <div className="lg:col-span-2 premium-card p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Explainable Attributes
            </h4>
            <h3 className="text-lg font-bold text-slate-800">
              Leading Population Risk Drivers
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-5">
              Percentage of the cohort affected by primary risk variables.
            </p>
          </div>

          <div className="space-y-4 my-auto">
            {topDrivers.map((driver, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    {driver.name}
                  </span>
                  <span className="text-slate-600 font-bold">{driver.percentage}% of cohort</span>
                </div>
                <div className="w-full h-2 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-blue-600/85 rounded-full" 
                    style={{ width: `${driver.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Derived from clinical parameters of {totalPatients} synthetic records.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
