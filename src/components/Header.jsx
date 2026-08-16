import React from "react";
import { Bell, Search, Calendar } from "lucide-react";
import { CONFIG } from "../data/config";

export function Header({ title, subtitle }) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-20 py-4 px-8 flex justify-between items-center">
      {/* Tab Context / Greetings */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
          {title || `Good morning, ${CONFIG.CARE_MANAGER.name}`}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {subtitle || "Here's your patient adherence and risk overview"}
        </p>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          Demo Data · Updated today
        </div>

        {/* Notifications */}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 relative group">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200" />

        {/* Care Manager Profile info */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="block text-xs font-bold text-slate-800 leading-tight">
              {CONFIG.CARE_MANAGER.name}
            </span>
            <span className="block text-[10px] text-slate-400 leading-none">
              {CONFIG.CARE_MANAGER.clinic}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700">
            {CONFIG.CARE_MANAGER.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
