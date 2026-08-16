import React, { useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { RiskSummary } from "../components/RiskSummary";
import { PatientFilters } from "../components/PatientFilters";
import { PatientTable } from "../components/PatientTable";

export function Patients({ patients, onViewPatient }) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [adherenceFilter, setAdherenceFilter] = useState("All");
  const [sortBy, setSortBy] = useState("HighestRisk");

  // Reset helper
  const handleResetFilters = () => {
    setSearchQuery("");
    setRiskFilter("All");
    setAdherenceFilter("All");
    setSortBy("HighestRisk");
  };

  // 1. Filter Logic
  const filteredPatients = patients.filter((patient) => {
    // Search query match (patient_id, e.g. "P1024")
    const matchesSearch = patient.patient_id
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());

    // Risk level match
    const matchesRisk = riskFilter === "All" || patient.risk_level === riskFilter;

    // Adherence threshold match
    let matchesAdherence = true;
    if (adherenceFilter === "under80") {
      matchesAdherence = patient.adherence < 80;
    } else if (adherenceFilter === "over80") {
      matchesAdherence = patient.adherence >= 80;
    }

    return matchesSearch && matchesRisk && matchesAdherence;
  });

  // 2. Sort Logic
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === "HighestRisk") {
      return b.risk_score - a.risk_score;
    }
    if (sortBy === "LowestRisk") {
      return a.risk_score - b.risk_score;
    }
    if (sortBy === "LowestAdherence") {
      return a.adherence - b.adherence;
    }
    if (sortBy === "LargestRefillGap") {
      return b.refill_gap_days - a.refill_gap_days;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Risk Summary Header Panels (dynamically showing counts across the whole database) */}
      <RiskSummary patients={patients} />

      {/* Interactive Filters Panel */}
      <PatientFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        riskFilter={riskFilter}
        setRiskFilter={setRiskFilter}
        adherenceFilter={adherenceFilter}
        setAdherenceFilter={setAdherenceFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Header showing match counts */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-slate-500">
          Showing {sortedPatients.length} of {patients.length} patients
        </span>
        {(searchQuery || riskFilter !== "All" || adherenceFilter !== "All") && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Main Table / Empty State Render */}
      {sortedPatients.length > 0 ? (
        <PatientTable patients={sortedPatients} onViewPatient={onViewPatient} />
      ) : (
        <div className="premium-card p-12 text-center max-w-lg mx-auto bg-white">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-md font-bold text-slate-800 mb-1">No patients found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
            No synthetic records match your current search and filter settings. Try adjusting your query or resetting the selectors.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset search criteria
          </button>
        </div>
      )}
    </div>
  );
}
