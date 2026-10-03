import React from 'react';
import { useHealth } from '../context/HealthContext';
import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';

// This view is kept as a pass-through redirect.
// The main ConsultationView handles the full AI chat flow.
export const ConsultationQAView = ({ setActiveTab }) => {
  const { chatMessages } = useHealth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
      <div className="ui-card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1.5px solid #e0e7ff' }}>
          <MessageSquare size={26} color="#7c3aed" />
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
          AI Consultation
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Continue your consultation with Dr. HealthVerse — describe your symptoms using text or voice.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveTab('consultation')}>
            <ArrowRight size={14} /> Go to Consultation
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveTab('dashboard')}>
            <ArrowLeft size={14} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
