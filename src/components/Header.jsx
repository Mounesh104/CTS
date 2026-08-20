import React, { useState } from "react";
import { Bell, Calendar, LogOut } from "lucide-react";
import { CONFIG } from "../data/config";
import { ProfileModal } from "./auth/ProfileModal";

export function Header({ title, subtitle, user, onLogout, onUpdateUser }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userName = user?.name || CONFIG.CARE_MANAGER.name;
  const userOrg = user?.organization || CONFIG.CARE_MANAGER.clinic;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-20 py-4 px-8 flex justify-between items-center">
      {/* Tab Context / Greetings */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
          {title || `Good morning, ${userName}`}
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
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 relative group cursor-pointer" title="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200" />

        {/* Care Manager Profile info & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer rounded-lg hover:bg-slate-50 px-1.5 py-1 -mx-1.5 transition-colors"
            title="Edit profile"
          >
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-800 leading-tight">
                {userName}
              </span>
              <span className="block text-[10px] text-slate-400 leading-none">
                {userOrg}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700 shadow-xs">
              {userInitial}
            </div>
          </button>

          {/* Logout Action Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {isProfileOpen && user && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onUpdated={(updated) => onUpdateUser && onUpdateUser(updated)}
        />
      )}
    </header>
  );
}

