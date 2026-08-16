import React from "react";
import { Info } from "lucide-react";

export function MetricCard({ title, value, icon: Icon, trend, tooltip }) {
  return (
    <div className="premium-card p-6 flex flex-col justify-between relative group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          {title}
          {tooltip && (
            <div className="relative flex items-center group/tooltip cursor-pointer">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-800 text-[10px] text-white leading-normal rounded shadow-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 text-center font-normal uppercase-none normal-case">
                {tooltip}
              </div>
            </div>
          )}
        </span>
        {Icon && (
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-slate-100 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className={`font-semibold ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {trend.value}
            </span>
            <span className="text-slate-400">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
