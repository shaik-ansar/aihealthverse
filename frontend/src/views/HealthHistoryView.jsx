import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  ClipboardList, FileText, MessageSquare, Pill, Calendar, Search,
  ChevronDown, ChevronUp, Stethoscope, FlaskConical, AlertTriangle,
  CheckCircle2, Clock, Filter
} from 'lucide-react';

const TRIAGE_COLOR = {
  DOCTOR_NEEDED: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', badge: 'URGENT' },
  LAB_TEST:      { bg: '#fffbeb', border: '#fde68a', text: '#d97706', badge: 'LAB'    },
  LOW_CONCERN:   { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', badge: 'WELL'   },
};

const RecordCard = ({ item, idx }) => {
  const [expanded, setExpanded] = useState(false);

  const catIcon = {
    report: <FileText size={16} />,
    consultation: <MessageSquare size={16} />,
    prescription: <Pill size={16} />,
    appointment: <Calendar size={16} />,
  };
  const catColor = {
    report: '#f59e0b',
    consultation: '#2563eb',
    prescription: '#8b5cf6',
    appointment: '#10b981',
  };

  const triage = item.triageType && TRIAGE_COLOR[item.triageType];
  const color  = catColor[item.category] || '#64748b';

  return (
    <div style={{ background: '#fff', border: `1px solid ${triage ? triage.border : 'var(--border-color)'}`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: '0.75rem', transition: 'all 0.2s' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {catIcon[item.category]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={11} /> {item.date}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {triage && <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 20, background: triage.bg, color: triage.text, border: `1px solid ${triage.border}` }}>{triage.badge}</span>}
          {item.status && item.category === 'appointment' && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, background: item.status === 'Confirmed' ? '#f0fdf4' : '#fef2f2', color: item.status === 'Confirmed' ? '#16a34a' : '#dc2626', border: `1px solid ${item.status === 'Confirmed' ? '#bbf7d0' : '#fca5a5'}` }}>{item.status}</span>
          )}
          {expanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 1.25rem 1.15rem 1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          {item.details && (
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.65rem', whiteSpace: 'pre-line' }}>
              {item.details}
            </div>
          )}
          {item.summary && (
            <div style={{ background: '#f8fafc', borderRadius: 9, padding: '0.85rem', border: '1px solid #e2e8f0', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem' }}>AI SUMMARY</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: 1.55 }}>{item.summary}</div>
            </div>
          )}
          {item.testResults && item.testResults.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem' }}>TEST RESULTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {item.testResults.map((t, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>•</span> {t}
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.triageRecommendation && (
            <div style={{ fontSize: '0.8rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#166534', fontWeight: 600 }}>
              🩺 {item.triageRecommendation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const HealthHistoryView = ({ setActiveTab }) => {
  const { historyList } = useHealth();
  const [activeTab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  const TABS = ['All', 'Consultations', 'Reports', 'Prescriptions', 'Appointments'];
  const catMap = { Consultations: 'consultation', Reports: 'report', Prescriptions: 'prescription', Appointments: 'appointment' };

  const filteredList = historyList.filter(h => {
    const matchTab = activeTab === 'All' || h.category === catMap[activeTab];
    const matchSearch = !search || (h.title || '').toLowerCase().includes(search.toLowerCase()) || (h.details || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = historyList.reduce((acc, h) => {
    if (h.category === 'appointment' && h.status === 'Cancelled') return acc;
    acc[h.category] = (acc[h.category] || 0) + 1;
    return acc;
  }, {});
  const tabCount = { All: historyList.length, Consultations: counts.consultation || 0, Reports: counts.report || 0, Prescriptions: counts.prescription || 0, Appointments: counts.appointment || 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Health Records</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Complete history of consultations, reports, medications and appointments</p>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="input-field" placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.4rem' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 20, border: `2px solid ${activeTab === t ? '#2563eb' : '#e2e8f0'}`, background: activeTab === t ? '#2563eb' : '#fff', color: activeTab === t ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t} <span style={{ opacity: 0.75 }}>({tabCount[t] || 0})</span>
          </button>
        ))}
      </div>

      <div>
        {filteredList.length === 0 ? (
          <div className="ui-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <ClipboardList size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>No records found</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {search ? 'Try a different search term.' : 'Start an AI consultation, upload a report, or book an appointment.'}
            </p>
            {!search && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => setActiveTab('consultation')}>Start Consultation</button>
                <button className="btn btn-outline" style={{ fontSize: '0.82rem' }} onClick={() => setActiveTab('reports-upload')}>Upload Report</button>
              </div>
            )}
          </div>
        ) : (
          filteredList.map((item, idx) => <RecordCard key={item.id || idx} item={item} idx={idx} />)
        )}
      </div>
    </div>
  );
};
