import React from "react";

const DOT_COLORS = {
  Critical: "bg-risk-critical",
  High: "bg-risk-high",
  Moderate: "bg-risk-medium",
  Low: "bg-risk-low"
};

export function RiskBadge({ level }) {
  const styles = {
    Critical: "bg-risk-critical-bg text-risk-critical border-risk-critical-border",
    High: "bg-risk-high-bg text-risk-high border-risk-high-border",
    Moderate: "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
    Low: "bg-risk-low-bg text-risk-low border-risk-low-border"
  };

  const badgeStyle = styles[level] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${DOT_COLORS[level] || "bg-slate-400"}`} />
      {level} Risk
    </span>
  );
}
