import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HealthProvider } from './context/HealthContext';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { PatientProfileView } from './views/PatientProfileView';
import { PatientDashboardView } from './views/PatientDashboardView';
import { ConsultationView } from './views/ConsultationView';
import { ConsultationQAView } from './views/ConsultationQAView';
import { ConsultationSummaryView } from './views/ConsultationSummaryView';
import { ReportUploadView } from './views/ReportUploadView';
import { ReportAnalysisView } from './views/ReportAnalysisView';
import { DoctorCDSSView } from './views/DoctorCDSSView';
import { AppointmentBookingView } from './views/AppointmentBookingView';
import { HealthHistoryView } from './views/HealthHistoryView';
import { HealthOverviewDashboardView } from './views/HealthOverviewDashboardView';
import { MedicationsView } from './views/MedicationsView';
import { RemindersView, SettingsView } from './views/RemindersView';

const MainLayout = () => {
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isLoggedIn || activeTab === 'login') {
    return <LoginView onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="app-layout">
      {/* Left Sidebar with hamburger toggle */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Viewport Area */}
      <main className="main-viewport" style={{ transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        {/* Screen 3 & 13: Dashboard / Overview Switcher */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '3px', borderRadius: 'var(--radius-md)', alignSelf: 'flex-start' }}>
              <button
                onClick={() => setDashboardSubTab('overview')}
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: dashboardSubTab === 'overview' ? '#ffffff' : 'transparent',
                  color: dashboardSubTab === 'overview' ? '#2563eb' : 'var(--text-muted)',
                  boxShadow: dashboardSubTab === 'overview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Screen 3: Patient Dashboard
              </button>
              <button
                onClick={() => setDashboardSubTab('trends')}
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: dashboardSubTab === 'trends' ? '#ffffff' : 'transparent',
                  color: dashboardSubTab === 'trends' ? '#2563eb' : 'var(--text-muted)',
                  boxShadow: dashboardSubTab === 'trends' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Screen 13: Health Trends & Vitals
              </button>
            </div>

            {dashboardSubTab === 'overview' ? (
              <PatientDashboardView setActiveTab={setActiveTab} />
            ) : (
              <HealthOverviewDashboardView setActiveTab={setActiveTab} />
            )}
          </div>
        )}

        {/* Screen 2: Patient Profile */}
        {activeTab === 'profile' && <PatientProfileView />}

        {/* Screen 4 & 5: AI Consultation — always mounted to preserve chat state */}
        <div style={{ display: activeTab === 'consultation' ? 'block' : 'none', height: '100%' }}>
          <ConsultationView setActiveTab={setActiveTab} isActive={activeTab === 'consultation'} />
        </div>

        {/* Screen 6: AI Interactive Questioning */}
        {activeTab === 'consultation-qa' && <ConsultationQAView setActiveTab={setActiveTab} />}

        {/* Screen 7: AI Summary + Triage */}
        {activeTab === 'consultation-summary' && <ConsultationSummaryView setActiveTab={setActiveTab} />}

        {/* Screen 8: Upload Report & OCR */}
        {activeTab === 'reports-upload' && <ReportUploadView setActiveTab={setActiveTab} />}

        {/* Screen 9: AI Explanation (Report Analysis) */}
        {activeTab === 'reports-analysis' && <ReportAnalysisView setActiveTab={setActiveTab} />}

        {/* Screen 10: Doctor / CDSS Summary & Prescription */}
        {activeTab === 'doctor-cdss' && <DoctorCDSSView setActiveTab={setActiveTab} />}

        {/* Screen 11: Appointment Booking (4-Hospital Network) */}
        {activeTab === 'appointments' && <AppointmentBookingView setActiveTab={setActiveTab} />}

        {/* Screen 12: Health History */}
        {activeTab === 'records' && <HealthHistoryView setActiveTab={setActiveTab} />}

        {/* Medications & Prescriptions */}
        {activeTab === 'medications' && <MedicationsView />}

        {/* Reminders */}
        {activeTab === 'reminders' && <RemindersView />}

        {/* Settings */}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HealthProvider>
        <MainLayout />
      </HealthProvider>
    </AuthProvider>
  );
}
