import React from 'react';
import { useHealth } from '../context/HealthContext';
import {
  CheckCircle2, AlertCircle, FlaskConical, Pill, Calendar,
  ArrowRight, ArrowLeft, Stethoscope, Heart, Clock
} from 'lucide-react';

const TRIAGE_CONFIG = {
  LOW_CONCERN:   { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: <CheckCircle2 size={22} color="#16a34a"/>, label: 'LOW CONCERN — HOME CARE',     btnBg: '#16a34a' },
  LAB_TEST:      { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: <FlaskConical size={22} color="#d97706"/>,  label: 'DIAGNOSTIC TESTS REQUIRED',   btnBg: '#d97706' },
  DOCTOR_NEEDED: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: <AlertCircle size={22} color="#dc2626"/>,  label: 'SPECIALIST CONSULTATION NEEDED', btnBg: '#dc2626' },
};

export const ConsultationSummaryView = ({ setActiveTab }) => {
  const { consultationSummaries, addConsultationRecord } = useHealth();
  const latest = consultationSummaries?.[0];

  if (!latest) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
        <div className="ui-card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <Stethoscope size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>No Consultation Summary Yet</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.5rem' }}>Start an AI consultation to get a clinical summary and triage recommendation.</p>
          <button className="btn btn-primary" onClick={() => setActiveTab('consultation')}>Start Consultation <ArrowRight size={14}/></button>
        </div>
      </div>
    );
  }

  const cfg = TRIAGE_CONFIG[latest.triageType] || TRIAGE_CONFIG.LOW_CONCERN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }} onClick={() => setActiveTab('consultation')}>
          <ArrowLeft size={14}/> Back to Consultation
        </button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Clinical Summary</h2>
      </div>

      {/* Triage Banner */}
      <div className="ui-card" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, padding: '1.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: 20, background: '#fff', color: cfg.color, border: `1.5px solid ${cfg.border}` }}>{cfg.label}</span>
          {cfg.icon}
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>{latest.diagnosis}</h3>
        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: '0 0 0.5rem' }}>{latest.reasoning}</p>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={12}/> {latest.date} · {latest.time} · {latest.doctorSpecialty}
        </div>
      </div>

      {/* Tests Recommended */}
      {latest.tests?.length > 0 && (
        <div className="ui-card">
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <FlaskConical size={16} color="#d97706" /> Recommended Tests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {latest.tests.map((t, i) => (
              <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#78350f', fontWeight: 600 }}>
                <FlaskConical size={12} color="#d97706"/> {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medication Tips */}
      {latest.medicationTips?.length > 0 && (
        <div className="ui-card">
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Pill size={16} color="#8b5cf6" /> Medication Plan
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {latest.medicationTips.map((t, i) => (
              <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', background: '#f5f3ff', borderRadius: 8, border: '1px solid #ede9fe', display: 'flex', gap: '0.5rem', color: '#4c1d95' }}>
                <span style={{ color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dietary Advice */}
      {latest.dietaryAdvice && (
        <div className="ui-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#14532d', marginBottom: '0.5rem' }}>🥗 Dietary Advice</div>
          <div style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.6 }}>{latest.dietaryAdvice}</div>
        </div>
      )}

      {/* Doctor Instructions */}
      {latest.doctorInstructions && (
        <div className="ui-card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e40af', marginBottom: '0.5rem' }}>🩺 Doctor Instructions</div>
          <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6 }}>{latest.doctorInstructions}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {latest.triageType === 'DOCTOR_NEEDED' && (
          <button className="btn btn-primary" style={{ flex: 1, background: '#dc2626', minWidth: 160 }} onClick={() => setActiveTab('appointments')}>
            <Calendar size={14}/> Book Specialist
          </button>
        )}
        {latest.triageType === 'LAB_TEST' && (
          <button className="btn btn-primary" style={{ flex: 1, background: '#d97706', minWidth: 160 }} onClick={() => setActiveTab('reports-upload')}>
            <FlaskConical size={14}/> Upload Lab Report
          </button>
        )}
        <button className="btn btn-primary" style={{ flex: 1, minWidth: 160 }} onClick={() => setActiveTab('records')}>
          <Heart size={14}/> View Health Records
        </button>
        <button className="btn btn-outline" style={{ flex: 1, minWidth: 160 }} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
      </div>
    </div>
  );
};
