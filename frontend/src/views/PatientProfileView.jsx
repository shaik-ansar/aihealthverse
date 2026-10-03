import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import {
  User, Mail, Shield, Activity, Heart, Phone, MapPin, Edit3,
  Pill, Droplets, Weight, Ruler
} from 'lucide-react';

export const PatientProfileView = () => {
  const { currentUser } = useAuth();
  const { reports, consultationSummaries, prescriptions, historyList } = useHealth();

  const apptCount  = (historyList || []).filter(h => h.category === 'appointment' && h.status === 'Confirmed').length;
  const activeMeds = (prescriptions || []).filter(p => p.status === 'Active').length;

  const stats = [
    { label: 'Consultations', value: (consultationSummaries || []).length, color: '#2563eb' },
    { label: 'Reports',       value: (reports || []).length,               color: '#f59e0b' },
    { label: 'Appointments',  value: apptCount,                            color: '#10b981' },
    { label: 'Active Meds',   value: activeMeds,                           color: '#8b5cf6' },
  ];

  // Read real profile data from currentUser (populated by AuthContext from backend profile_data)
  const healthInfo = [
    { label: 'Blood Type',          value: currentUser?.blood_group       || 'Not set', icon: <Droplets size={14}/> },
    { label: 'Allergies',           value: currentUser?.allergies         || 'None',    icon: <Shield size={14}/> },
    { label: 'Age',                 value: currentUser?.age ? `${currentUser.age} years` : 'Not set', icon: <User size={14}/> },
    { label: 'Gender',              value: currentUser?.sex               || 'Not set', icon: <Activity size={14}/> },
    { label: 'Height',              value: currentUser?.height            || 'Not set', icon: <Ruler size={14}/> },
    { label: 'Weight',              value: currentUser?.weight            || 'Not set', icon: <Weight size={14}/> },
    { label: 'Phone',               value: currentUser?.phone             || 'Not set', icon: <Phone size={14}/> },
    { label: 'Chronic Conditions',  value: currentUser?.chronic_conditions || 'None',   icon: <Pill size={14}/> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 680, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Patient Profile</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Your personal health profile and statistics</p>
      </div>

      {/* Profile Card */}
      <div className="ui-card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', padding: '1.75rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Patient')}&size=200&background=e0e7ff&color=3730a3`}
            alt="Profile"
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0e7ff' }}
          />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            <Edit3 size={12} color="#fff" />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>{currentUser?.name || 'Patient'}</h2>
          <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Mail size={13}/> {currentUser?.email || 'patient@healthverse.ai'}
          </div>
          {currentUser?.dob && (
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}>
              DOB: {currentUser.dob}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge-tag badge-blue" style={{ fontSize: '0.72rem' }}><Shield size={11}/> Verified Patient</span>
            <span className="badge-tag badge-green" style={{ fontSize: '0.72rem' }}><Activity size={11}/> Active</span>
            {currentUser?.blood_group && currentUser.blood_group !== 'Unknown' && (
              <span className="badge-tag" style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b' }}>
                <Droplets size={11}/> {currentUser.blood_group}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
        {stats.map(s => (
          <div key={s.label} className="ui-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Health Info — reads from real backend profile_data */}
      <div className="ui-card">
        <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', margin: '0 0 1rem' }}>Health Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {healthInfo.map(h => (
            <div key={h.label} style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {h.icon} {h.label}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: h.value === 'Not set' || h.value === 'None' ? '#94a3b8' : 'var(--text-main)' }}>
                {h.value}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.85rem', marginBottom: 0 }}>
          💡 Update your profile from the backend or contact your health administrator to set demographic details.
          Accurate profile data improves AI consultation accuracy.
        </p>
      </div>

      {/* Active Medications Quick View */}
      {activeMeds > 0 && (
        <div className="ui-card">
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', margin: '0 0 0.85rem' }}>Active Medications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(prescriptions || []).filter(p => p.status === 'Active').slice(0, 5).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065f46' }}>{p.drug}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>{p.dosage}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, background: '#d1fae5', padding: '2px 8px', borderRadius: 12 }}>Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
