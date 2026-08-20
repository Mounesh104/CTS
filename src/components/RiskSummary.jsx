import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";

export function RiskSummary({ patients }) {
  // Calculate counts dynamically from whatever subset is passed in
  const counts = patients.reduce(
    (acc, p) => {
      acc[p.risk_level] = (acc[p.risk_level] || 0) + 1;
      return acc;
    },
    { Critical: 0, High: 0, Moderate: 0, Low: 0 }
  );

  const total = patients.length;
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Critical Risk Panel */}
      <div className="bg-risk-critical-bg/30 border border-risk-critical-border/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
            Critical Risk Cohort
          </span>
          <h4 className="text-2xl font-bold text-purple-900 mt-1">
            {counts.Critical}{" "}
            <span className="text-xs font-semibold text-purple-700/80">
              ({pct(counts.Critical)}%)
            </span>
          </h4>
        </div>
        <div className="w-10 h-10 rounded-lg bg-purple-100/80 flex items-center justify-center text-purple-600">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* High Risk Panel */}
      <div className="bg-risk-high-bg/30 border border-risk-high-border/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
            High Risk Cohort
          </span>
          <h4 className="text-2xl font-bold text-rose-900 mt-1">
            {counts.High}{" "}
            <span className="text-xs font-semibold text-rose-700/80">
              ({pct(counts.High)}%)
            </span>
          </h4>
        </div>
        <div className="w-10 h-10 rounded-lg bg-rose-100/80 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Moderate Risk Panel */}
      <div className="bg-risk-medium-bg/30 border border-risk-medium-border/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Moderate Risk Cohort
          </span>
          <h4 className="text-2xl font-bold text-amber-900 mt-1">
            {counts.Moderate}{" "}
            <span className="text-xs font-semibold text-amber-700/80">
              ({pct(counts.Moderate)}%)
            </span>
          </h4>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Low Risk Panel */}
      <div className="bg-risk-low-bg/30 border border-risk-low-border/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Low Risk Cohort
          </span>
          <h4 className="text-2xl font-bold text-emerald-900 mt-1">
            {counts.Low}{" "}
            <span className="text-xs font-semibold text-emerald-700/80">
              ({pct(counts.Low)}%)
            </span>
          </h4>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-600">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
