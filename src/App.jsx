import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { Patients } from "./pages/Patients";
import { Placeholder } from "./pages/Placeholder";
import { PatientProfile } from "./pages/PatientProfile";
import { Interventions } from "./pages/Interventions";
import { Monitoring } from "./pages/Monitoring";
import { Settings } from "./pages/Settings";
import { mockPatients as initialPatients } from "./data/mockPatients";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [profileOriginTab, setProfileOriginTab] = useState("dashboard");
  const [patients, setPatients] = useState(initialPatients);

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
          />
        );
      case "patients":
        return (
          <Patients 
            patients={patients} 
            onViewPatient={handleViewPatient} 
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
          />
        );
      case "settings":
        return <Settings />;
      default:
        return <Placeholder tabName="Dashboard" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Panel (Fixed width 16rem/64px) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Layout Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header title={headerContext.title} subtitle={headerContext.subtitle} />
        
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
