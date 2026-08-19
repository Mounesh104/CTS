import React from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { RiskBadge } from "./RiskBadge";

export function PatientTable({ patients, onViewPatient, pdcTarget = 80 }) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/55 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <th className="py-4.5 px-6">Patient ID</th>
              <th className="py-4.5 px-6 text-center">Risk Score</th>
              <th className="py-4.5 px-6">Risk Level</th>
              <th className="py-4.5 px-6 text-center">Adherence / PDC</th>
              <th className="py-4.5 px-6 text-center">Persistency</th>
              <th className="py-4.5 px-6 text-center">Refill Gap</th>
              <th className="py-4.5 px-6">Key Risk Factor</th>
              <th className="py-4.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {patients.map((patient) => {
              const topFactor = patient.top_risk_factors?.[0]?.factor || "None";
              
              return (
                <tr 
                  key={patient.patient_id} 
                  className="hover:bg-slate-50/70 transition-colors group/row"
                >
                  {/* Patient ID */}
                  <td className="py-4 px-6 text-slate-900 font-bold">
                    {patient.patient_id}
                  </td>

                  {/* Risk Score */}
                  <td className="py-4 px-6 text-center">
                    <span className={`text-sm font-bold ${
                      patient.risk_level === "High" 
                        ? "text-rose-600" 
                        : patient.risk_level === "Medium" 
                        ? "text-amber-600" 
                        : "text-emerald-600"
                    }`}>
                      {patient.risk_score}%
                    </span>
                  </td>

                  {/* Risk Level Badge */}
                  <td className="py-4 px-6">
                    <RiskBadge level={patient.risk_level} />
                  </td>

                  {/* Adherence / PDC */}
                  <td className="py-4 px-6 text-center font-semibold">
                    <span className={patient.adherence < pdcTarget ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                      {patient.adherence}%
                    </span>
                  </td>

                  {/* Persistency */}
                  <td className="py-4 px-6 text-center text-slate-500 text-xs">
                    {patient.persistency_months} mo
                  </td>

                  {/* Refill Gap */}
                  <td className="py-4 px-6 text-center text-xs">
                    {patient.refill_gap_days > 0 ? (
                      <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                        {patient.refill_gap_days} days
                      </span>
                    ) : (
                      <span className="text-slate-400">0 days</span>
                    )}
                  </td>

                  {/* Key Risk Factor */}
                  <td className="py-4 px-6 text-slate-600 text-xs font-semibold">
                    {topFactor}
                  </td>

                  {/* View Action */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onViewPatient(patient.patient_id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-3 py-2 rounded-lg border border-blue-100"
                    >
                      View Profile
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0.5 transition-all" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
