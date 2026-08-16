import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  HeartHandshake, 
  Gauge, 
  Settings,
  HeartPulse
} from "lucide-react";
import { CONFIG } from "../data/config";

export function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "patients", label: "Patients", icon: Users },
    { id: "interventions", label: "Interventions", icon: HeartHandshake },
    { id: "monitoring", label: "Monitoring", icon: Gauge },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Header / Brand */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-snug tracking-tight">
              Patient Adherence & Persistency
            </h1>
          </div>
        </div>

        {/* Configured Therapy Area Badge */}
        <div className="mt-4 px-3 py-1.5 bg-slate-800 rounded-md border border-slate-700 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Active Therapy Area</span>
          <span className="text-xs font-bold text-emerald-400">{CONFIG.THERAPY_AREA}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Session Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-blue-400">
            S
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{CONFIG.CARE_MANAGER.name}</h4>
            <p className="text-[10px] text-slate-500 leading-tight">{CONFIG.CARE_MANAGER.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
