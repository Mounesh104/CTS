import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AuthContainer } from "./components/auth/AuthContainer";
import { Dashboard } from "./pages/Dashboard";
import { Patients } from "./pages/Patients";
import { Placeholder } from "./pages/Placeholder";
import { PatientProfile } from "./pages/PatientProfile";
import { Interventions } from "./pages/Interventions";
import { Monitoring } from "./pages/Monitoring";
import { Settings } from "./pages/Settings";
import { mockPatients as initialPatients } from "./data/mockPatients";
import { fetchPatients, fetchSettings } from "./services/api";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("paprs_authenticated") === "true";
  });
  const [authUser, setAuthUser] = useState(() => {
    const saved = sessionStorage.getItem("paprs_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [profileOriginTab, setProfileOriginTab] = useState("dashboard");
  const [patients, setPatients] = useState(initialPatients);
  const [appSettings, setAppSettings] = useState({
    therapy_area: "Hypertension",
    critical_risk_threshold: 67,
    high_risk_threshold: 56,
    moderate_risk_threshold: 38,
    pdc_target: 80,
    alerts_enabled: true,
    reminders_enabled: true,
    summary_enabled: false
  });
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const refreshData = async () => {
    try {
      // Load the full population so every page (Patients, Interventions,
      // Monitoring, Patient Profile deep-links) works off the same complete
      // dataset the Dashboard's aggregate endpoints already reflect.
      const livePatients = await fetchPatients(3000);
      if (livePatients && livePatients.length > 0) {
        setPatients(livePatients);
        setIsBackendConnected(true);
      }
      const liveSettings = await fetchSettings();
      if (liveSettings) {
        setAppSettings(liveSettings);
      }
    } catch (err) {
      console.warn("Could not connect to FastAPI backend, using fallback data:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setAuthUser(userData);
    sessionStorage.setItem("paprs_authenticated", "true");
    sessionStorage.setItem("paprs_user", JSON.stringify(userData));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    sessionStorage.removeItem("paprs_authenticated");
    sessionStorage.removeItem("paprs_user");
  };

  // Called after a successful profile update so Header/Sidebar reflect changes immediately
  const handleUpdateAuthUser = (updatedUser) => {
    const merged = { ...authUser, ...updatedUser };
    setAuthUser(merged);
    sessionStorage.setItem("paprs_user", JSON.stringify(merged));
  };

  // Switch to a patient profile view (simulated for reviews)
  const handleViewPatient = (patientId) => {
    setProfileOriginTab(activeTab);
    setSelectedPatientId(patientId);
    setActiveTab("patient-profile");
  };

  const handleUpdatePatient = (updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p.patient_id === updatedPatient.patient_id ? updatedPatient : p))
    );
  };

  // Determine current header details
  const getHeaderContext = () => {
    switch (activeTab) {
      case "dashboard":
        return {
          title: "Patient Adherence & Persistency",
          subtitle: "Here's your clinical patient adherence and persistency risk overview."
        };
      case "patients":
        return {
          title: "Patients",
          subtitle: "Risk-scored patient population"
        };
      case "interventions":
        return {
          title: "Interventions",
          subtitle: "Manage and track patient outreach actions"
        };
      case "monitoring":
        return {
          title: "Monitoring",
          subtitle: "Track adherence, persistency, and cohort performance"
        };
      case "settings":
        return {
          title: "Settings",
          subtitle: "Configure risk and intervention preferences"
        };
      case "patient-profile":
        return {
          title: `Patient Profile — ${selectedPatientId}`,
          subtitle: "Risk assessment details and therapeutic actions."
        };
      default:
        return {
          title: "Patient Adherence & Persistency",
          subtitle: "Risk Scoring Dashboard"
        };
    }
  };

  const headerContext = getHeaderContext();

  // Render active tab body
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard 
            patients={patients} 
            onViewPatient={handleViewPatient}
            onNavigateToPatients={() => setActiveTab("patients")}
            onNavigateToInterventions={() => setActiveTab("interventions")}
            settings={appSettings}
          />
        );
      case "patient-profile":
        return (
          <PatientProfile 
            selectedPatientId={selectedPatientId} 
            patients={patients} 
            onUpdatePatient={handleUpdatePatient}
            originTab={profileOriginTab}
            onBack={() => setActiveTab(profileOriginTab)}
            settings={appSettings}
          />
        );
      case "patients":
        return (
          <Patients 
            patients={patients} 
            onViewPatient={handleViewPatient} 
            settings={appSettings}
          />
        );
      case "interventions":
        return (
          <Interventions 
            patients={patients} 
            onViewPatient={handleViewPatient} 
          />
        );
      case "monitoring":
        return (
          <Monitoring 
            patients={patients} 
            onViewPatient={handleViewPatient} 
            settings={appSettings}
          />
        );
      case "settings":
        return <Settings settings={appSettings} onSettingsUpdated={refreshData} />;
      default:
        return <Placeholder tabName="Dashboard" />;
    }
  };

  // Render Authentication Flow if not logged in
  if (!isAuthenticated) {
    return <AuthContainer onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Panel (Fixed width 16rem/64px) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={authUser}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header
          title={headerContext.title}
          subtitle={headerContext.subtitle}
          user={authUser}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateAuthUser}
        />
        
        {/* Page Content Panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

