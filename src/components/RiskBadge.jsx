import React from "react";

export function RiskBadge({ level }) {
  const styles = {
    High: "bg-risk-high-bg text-risk-high border-risk-high-border",
    Medium: "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
    Low: "bg-risk-low-bg text-risk-low border-risk-low-border"
  };

  const badgeStyle = styles[level] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        level === "High" ? "bg-risk-high" : level === "Medium" ? "bg-risk-medium" : "bg-risk-low"
      }`} />
      {level} Risk
    </span>
  );
}
