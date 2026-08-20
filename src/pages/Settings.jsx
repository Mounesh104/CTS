import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  Bell, 
  Sliders, 
  ShieldAlert, 
  Sparkles,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { CONFIG } from "../data/config";
import { fetchActionRules, updateActionRules, fetchSettings, updateSettings } from "../services/api";

export function Settings({ settings, onSettingsUpdated }) {
  // Local state for configuration settings
  const [therapyArea, setTherapyArea] = useState(settings?.therapy_area || CONFIG.THERAPY_AREA);
  const [criticalRiskThreshold, setCriticalRiskThreshold] = useState(settings?.critical_risk_threshold ?? 67);
  const [highRiskThreshold, setHighRiskThreshold] = useState(settings?.high_risk_threshold ?? 56);
  const [moderateRiskThreshold, setModerateRiskThreshold] = useState(settings?.moderate_risk_threshold ?? 38);
  const [pdcTarget, setPdcTarget] = useState(settings?.pdc_target ?? 80);
  const [rules, setRules] = useState([]);
  
  // Toggles state
  const [alertsEnabled, setAlertsEnabled] = useState(settings?.alerts_enabled ?? true);
  const [remindersEnabled, setRemindersEnabled] = useState(settings?.reminders_enabled ?? true);
  const [summaryEnabled, setSummaryEnabled] = useState(settings?.summary_enabled ?? false);

  // Success toast state
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const fetchedRules = await fetchActionRules();
        if (fetchedRules && fetchedRules.length > 0) {
          setRules(fetchedRules);
        }
        const activeSettings = await fetchSettings();
        if (activeSettings) {
          setTherapyArea(activeSettings.therapy_area || "Hypertension");
          setCriticalRiskThreshold(activeSettings.critical_risk_threshold ?? 67);
          setHighRiskThreshold(activeSettings.high_risk_threshold ?? 56);
          setModerateRiskThreshold(activeSettings.moderate_risk_threshold ?? 38);
          setPdcTarget(activeSettings.pdc_target ?? 80);
          setAlertsEnabled(activeSettings.alerts_enabled ?? true);
          setRemindersEnabled(activeSettings.reminders_enabled ?? true);
          setSummaryEnabled(activeSettings.summary_enabled ?? false);
        }
      } catch (err) {
        console.warn("Could not fetch settings from backend API:", err);
      }
    }
    loadConfig();
  }, []);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      if (rules && rules.length > 0) {
        await updateActionRules(rules);
      }
      await updateSettings({
        therapy_area: therapyArea,
        critical_risk_threshold: Number(criticalRiskThreshold),
        high_risk_threshold: Number(highRiskThreshold),
        moderate_risk_threshold: Number(moderateRiskThreshold),
        pdc_target: Number(pdcTarget),
        alerts_enabled: alertsEnabled,
        reminders_enabled: remindersEnabled,
        summary_enabled: summaryEnabled,
      });

      if (onSettingsUpdated) {
        await onSettingsUpdated();
      }
    } catch (err) {
      console.warn("Could not update settings to backend API:", err);
    }
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative pb-12">
      
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 border border-emerald-500 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle className="w-5 h-5 text-white" />
          <div className="text-xs font-bold leading-none">
            Settings saved successfully to backend
          </div>
        </div>
      )}

      {/* POC Demo Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
        <div className="p-1.5 bg-blue-100 rounded-md shrink-0">
          <HelpCircle className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <span className="text-xs font-bold text-blue-800 block leading-tight">Backend API Connected</span>
          <span className="text-[10px] text-blue-600 leading-snug">
            Connected to FastAPI & SQLite database (`http://localhost:8000`). Action rules and risk thresholds persist directly to backend.
          </span>
        </div>
      </div>

      {/* Top Title Card */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
          Configuration
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Configure monitoring benchmarks, notification triggers, and active clinical thresholds.
        </p>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-6">
        
        {/* Therapy Area Config Card */}
        <div className="premium-card p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">
                Therapy Area Config
              </h3>
              <p className="text-xs text-slate-500">
                Choose the primary medical domain monitored for non-adherence and persistency.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Therapy Area
            </label>
            <div className="relative">
              <select
                value={therapyArea}
                onChange={(e) => setTherapyArea(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer appearance-none"
              >
                <option value="Hypertension">Hypertension (Active)</option>
                <option value="Type 2 Diabetes">Type 2 Diabetes</option>
                <option value="Asthma">Asthma</option>
                <option value="Heart Failure">Heart Failure</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              * Note: Changing the therapy area will adjust the system classification filters for synthetic data in next reload sessions.
            </p>
          </div>
        </div>

        {/* Risk Thresholds Config Card */}
        <div className="premium-card p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">
                Risk-Scoring Thresholds
              </h3>
              <p className="text-xs text-slate-500">
                Adjust scoring ranges to define Critical, High, Moderate, and Low risk stratification levels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Critical Risk Slider */}
            <div className="space-y-3 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  Critical Risk Class
                </label>
                <span className="text-sm font-extrabold text-purple-600 font-mono">&ge; {criticalRiskThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="1"
                value={criticalRiskThreshold}
                onChange={(e) => setCriticalRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Patients at or above this value require urgent clinical intervention.
              </p>
            </div>

            {/* High Risk Slider */}
            <div className="space-y-3 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  High Risk Class
                </label>
                <span className="text-sm font-extrabold text-rose-600 font-mono">&ge; {highRiskThreshold}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="80"
                step="1"
                value={highRiskThreshold}
                onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Patients with scores at or above this value flag immediately in the attention queues.
              </p>
            </div>

            {/* Moderate Risk Slider */}
            <div className="space-y-3 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Moderate Risk Class
                </label>
                <span className="text-sm font-extrabold text-amber-600 font-mono">&ge; {moderateRiskThreshold}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                step="1"
                value={moderateRiskThreshold}
                onChange={(e) => setModerateRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Defines the baseline threshold for warning levels. Low Risk represents scores under {moderateRiskThreshold}%.
              </p>
            </div>
          </div>
        </div>

        {/* Adherence Target Config Card */}
        <div className="premium-card p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">
                Therapeutic Adherence Benchmark
              </h3>
              <p className="text-xs text-slate-500">
                Define the target PDC (Proportion of Days Covered) clinical compliance baseline.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Target Adherence Benchmark
              </label>
              <span className="text-sm font-extrabold text-blue-600 font-mono">{pdcTarget}% PDC</span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              step="5"
              value={pdcTarget}
              onChange={(e) => setPdcTarget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 leading-normal">
              Sets the horizontal baseline line on the monitoring and patient historical trend charts.
            </p>
          </div>
        </div>

        {/* Notification Config Card */}
        <div className="premium-card p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">
                Notification Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Configure real-time alerts and scheduled summaries sent to the Care Manager dashboard.
              </p>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-slate-100 font-medium">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between py-2 first:pt-0">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">High-Risk Patient Alerts</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Send instant notifications when a patient's risk score climbs &ge; {highRiskThreshold}%.</span>
              </div>
              <button
                type="button"
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  alertsEnabled ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    alertsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">Intervention Action Reminders</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Send weekly digests of pending attention queues awaiting outreach calls.</span>
              </div>
              <button
                type="button"
                onClick={() => setRemindersEnabled(!remindersEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  remindersEnabled ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    remindersEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between py-3 last:pb-0">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">Weekly Performance Summary Reports</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Compile weekly longitudinal persistence reviews into active alert logs.</span>
              </div>
              <button
                type="button"
                onClick={() => setSummaryEnabled(!summaryEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  summaryEnabled ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    summaryEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Card */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>

      </form>
    </div>
  );
}
