import React from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";

export function PatientFilters({
  searchQuery,
  setSearchQuery,
  riskFilter,
  setRiskFilter,
  adherenceFilter,
  setAdherenceFilter,
  sortBy,
  setSortBy,
  pdcTarget = 80
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder-slate-400"
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-[2]">
          {/* Risk Filter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
              Risk:
            </span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full pl-14 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
            >
              <option value="All">All Levels</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Adherence Filter */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
              Adh:
            </span>
            <select
              value={adherenceFilter}
              onChange={(e) => setAdherenceFilter(e.target.value)}
              className="w-full pl-12 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
            >
              <option value="All">All Compliance</option>
              <option value="under80">&lt; {pdcTarget}% PDC</option>
              <option value="over80">&ge; {pdcTarget}% PDC</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none uppercase">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-13 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
            >
              <option value="HighestRisk">Highest Risk</option>
              <option value="LowestRisk">Lowest Risk</option>
              <option value="LowestAdherence">Lowest Adherence</option>
              <option value="LargestRefillGap">Refill Gap</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
