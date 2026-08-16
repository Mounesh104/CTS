import React from "react";
import { AlertCircle } from "lucide-react";

export function Placeholder({ tabName }) {
  return (
    <div className="premium-card p-12 text-center max-w-xl mx-auto my-12">
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{tabName} Page</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        This screen is part of the subsequent design phases (Phases 4-6). Please use the sidebar to return to the <strong>Dashboard</strong>, where you can view the adherence overview and interact with the attention queue.
      </p>
      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 py-2 rounded-lg border border-slate-100">
        Phase 1 & 2 Active Review
      </div>
    </div>
  );
}
