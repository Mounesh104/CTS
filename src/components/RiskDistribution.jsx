import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export function RiskDistribution({ patients }) {
  // Calculate counts dynamically from patient list
  const counts = patients.reduce(
    (acc, p) => {
      acc[p.risk_level] = (acc[p.risk_level] || 0) + 1;
      return acc;
    },
    { High: 0, Medium: 0, Low: 0 }
  );

  const data = [
    { name: "High Risk", value: counts.High, color: "#ef4444" },
    { name: "Medium Risk", value: counts.Medium, color: "#f59e0b" },
    { name: "Low Risk", value: counts.Low, color: "#10b981" }
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="premium-card p-6 flex flex-col h-full justify-between">
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Cohort Risk Distribution</span>
          <span className="text-rose-500 font-semibold lowercase-none normal-case">{counts.High} High-Risk</span>
        </h4>
        <h3 className="text-lg font-bold text-slate-800 leading-tight">
          Risk Breakdown — {total} Patients
        </h3>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Active cohort breakdown across High, Medium, and Low risk bands
        </p>
      </div>

      <div className="relative w-full h-52 my-3 flex items-center justify-center">
        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{total}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patients</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px"
              }}
              itemStyle={{ color: "#fff" }}
              cursor={false}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-semibold text-slate-400">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-slate-800">
              {item.value} ({Math.round((item.value / (total || 1)) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
