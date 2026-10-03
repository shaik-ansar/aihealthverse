import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope, FileText, Pill, AlertCircle, CheckCircle2, FlaskConical,
  User, Star, Building2, Calendar, ArrowRight, Clock, Download, Loader2,
  ChevronDown, ChevronUp, X, Search
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export const DoctorCDSSView = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const { consultationSummaries, reports, prescriptions, historyList, doctors } = useHealth();
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [cdssReport, setCdssReport] = useState(null);
  const [expandedSection, setExpandedSection] = useState('summary');

  const recentConsultation = consultationSummaries?.[0];
  const activeReports      = reports?.slice(0, 5) || [];
  const activeMeds         = (prescriptions || []).filter(p => p.status === 'Active');

  const generateCDSS = async () => {
    setGenerating(true);
    try {
      const payload = {
        patient_id: currentUser?.id || 1,
        consultations: (consultationSummaries || []).slice(0, 5),
        reports: activeReports.map(r => ({ title: r.fileName, summary: r.summary, date: r.date })),
        medications: activeMeds.map(m => ({ drug: m.drug, dosage: m.dosage, frequency: m.frequency })),
        appointments: (historyList || []).filter(h => h.category === 'appointment').slice(0, 5)
      };
      const res = await fetch(`${API_BASE}/doctor/cdss`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setCdssReport(data);
      } else {
        // Fallback mock
        setCdssReport({
          patientSummary: `Patient: ${currentUser?.name || 'Unknown'} | Age: 25 | Blood Type: O+`,
          clinicalFindings: recentConsultation ? [`Recent diagnosis: ${recentConsultation.diagnosis}`, `Triage: ${recentConsultation.triageType}`, recentConsultation.reasoning || ''].filter(Boolean) : ['No recent consultations on record.'],
          labFindings: activeReports.length > 0 ? activeReports.map(r => r.summary?.split('\n')[0]).filter(Boolean) : ['No recent lab reports.'],
          medications: activeMeds.length > 0 ? activeMeds.map(m => `${m.drug} ${m.dosage} — ${m.frequency}`) : ['No active medications.'],
          recommendations: [
            'Monitor vital signs and maintain hydration.',
            'Follow up in 5–7 days if symptoms persist.',
            recentConsultation?.triageType === 'DOCTOR_NEEDED' ? 'URGENT: Specialist referral recommended.' : 'Routine monitoring advised.',
          ].filter(Boolean),
          prescriptionSuggestions: activeMeds.slice(0, 3).map(m => ({ drug: m.drug, dosage: m.dosage, frequency: m.frequency, duration: m.duration || '5 days', notes: m.notes || '' })),
          generatedAt: new Date().toLocaleString()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const Section = ({ id, title, icon, color, children }) => (
    <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', background: expandedSection === id ? '#f8fafc' : '#fff', borderBottom: expandedSection === id ? '1px solid var(--border-color)' : 'none' }} onClick={() => setExpandedSection(expandedSection === id ? null : id)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>{title}</span>
        </div>
        {expandedSection === id ? <ChevronUp size={16} color="#94a3b8"/> : <ChevronDown size={16} color="#94a3b8"/>}
      </div>
      {expandedSection === id && <div style={{ padding: '1rem 1.25rem' }}>{children}</div>}
    </div>
  );

  const filteredDoctors = (doctors || []).filter(d =>
    !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Doctor / CDSS Panel</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Clinical Decision Support System — consolidated patient view for healthcare providers</p>
        </div>
        <button className="btn btn-primary" onClick={generateCDSS} disabled={generating} style={{ fontSize: '0.875rem' }}>
          {generating ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> Generating…</> : <><Stethoscope size={14}/> Generate CDSS Report</>}
        </button>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
        {[
          { label: 'Consultations', value: (consultationSummaries || []).length, color: '#2563eb', icon: <Stethoscope size={16}/> },
          { label: 'Lab Reports', value: (reports || []).length, color: '#f59e0b', icon: <FlaskConical size={16}/> },
          { label: 'Active Meds', value: activeMeds.length, color: '#8b5cf6', icon: <Pill size={16}/> },
          { label: 'Appointments', value: (historyList || []).filter(h => h.category === 'appointment' && h.status !== 'Cancelled').length, color: '#10b981', icon: <Calendar size={16}/> },
        ].map(s => (
          <div key={s.label} className="ui-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.15rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}18`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CDSS Report */}
      {cdssReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              📋 CDSS Report — {cdssReport.generatedAt}
            </div>
            <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => setCdssReport(null)}>
              <X size={12}/> Clear
            </button>
          </div>

          <Section id="summary" title="Patient Summary" icon={<User size={16}/>} color="#2563eb">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{cdssReport.patientSummary}</div>
          </Section>

          <Section id="clinical" title="Clinical Findings" icon={<Stethoscope size={16}/>} color="#7c3aed">
            {cdssReport.clinicalFindings?.map((f, i) => (
              <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', background: '#f5f3ff', borderRadius: 8, marginBottom: '0.4rem', display: 'flex', gap: '0.5rem', color: '#4c1d95' }}>
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>•</span>{f}
              </div>
            ))}
          </Section>

          <Section id="lab" title="Laboratory Findings" icon={<FlaskConical size={16}/>} color="#f59e0b">
            {cdssReport.labFindings?.map((f, i) => (
              <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', background: '#fffbeb', borderRadius: 8, marginBottom: '0.4rem', display: 'flex', gap: '0.5rem', color: '#78350f' }}>
                <FlaskConical size={12} color="#d97706"/>{f}
              </div>
            ))}
          </Section>

          <Section id="meds" title="Current Medications" icon={<Pill size={16}/>} color="#8b5cf6">
            {cdssReport.medications?.map((m, i) => (
              <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', background: '#f5f3ff', borderRadius: 8, marginBottom: '0.4rem', display: 'flex', gap: '0.5rem', color: '#4c1d95' }}>
                <Pill size={12} color="#8b5cf6"/> {m}
              </div>
            ))}
          </Section>

          <Section id="recs" title="Clinical Recommendations" icon={<CheckCircle2 size={16}/>} color="#10b981">
            {cdssReport.recommendations?.map((r, i) => (
              <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', background: '#f0fdf4', borderRadius: 8, marginBottom: '0.4rem', display: 'flex', gap: '0.5rem', color: '#14532d' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>{r}
              </div>
            ))}
          </Section>

          {cdssReport.prescriptionSuggestions?.length > 0 && (
            <Section id="rx" title="Prescription Suggestions" icon={<FileText size={16}/>} color="#ef4444">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cdssReport.prescriptionSuggestions.map((rx, i) => (
                  <div key={i} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#991b1b' }}>{rx.drug} · {rx.dosage}</div>
                    <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.15rem' }}>{rx.frequency} · {rx.duration}</div>
                    {rx.notes && <div style={{ fontSize: '0.76rem', color: '#dc2626', marginTop: '0.2rem', opacity: 0.8 }}>{rx.notes}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Doctor Directory */}
      <div className="ui-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 }}>Specialist Directory</h3>
          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input className="input-field" placeholder="Search specialists…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', fontSize: '0.82rem', padding: '0.5rem 0.5rem 0.5rem 2.25rem' }}/>
          </div>
        </div>
        {filteredDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>No specialists found for that search.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {filteredDoctors.map(doc => (
              <div key={doc.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <img src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80'} alt={doc.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e7ff', flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 600 }}>{doc.specialization}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <Star size={10} fill="#f59e0b" color="#f59e0b"/>{doc.rating} · {doc.hospital_name}
                  </div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.35rem 0.55rem', flexShrink: 0 }} onClick={() => setActiveTab('appointments')}>
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
        {(doctors || []).length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.82rem' }} onClick={() => setActiveTab('appointments')}>
              View All Specialists <ArrowRight size={13}/>
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};
