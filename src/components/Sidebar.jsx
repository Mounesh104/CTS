import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  HeartHandshake, 
  Gauge, 
  Settings,
  HeartPulse,
  LogOut
} from "lucide-react";
import { CONFIG } from "../data/config";

export function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "patients", label: "Patients", icon: Users },
    { id: "interventions", label: "Interventions", icon: HeartHandshake },
    { id: "monitoring", label: "Monitoring", icon: Gauge },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const userName = user?.name || CONFIG.CARE_MANAGER.name;
  const userRole = user?.role || CONFIG.CARE_MANAGER.role;
  const userInitial = userName.charAt(0).toUpperCase();

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

      {/* User Session Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-blue-400 shrink-0">
            {userInitial}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-white truncate">{userName}</h4>
            <p className="text-[10px] text-slate-500 leading-tight truncate">{userRole}</p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

