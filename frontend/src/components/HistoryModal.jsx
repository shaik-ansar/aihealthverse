import React from 'react';
import { X, FileText, MessageSquare, Pill, Calendar, Clock, CheckCircle2, AlertCircle, FlaskConical } from 'lucide-react';

const TRIAGE_STYLE = {
  DOCTOR_NEEDED: { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', label: 'URGENT' },
  LAB_TEST:      { bg: '#fffbeb', border: '#fde68a', color: '#d97706', label: 'LAB'    },
  LOW_CONCERN:   { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', label: 'WELL'   },
};

export const HistoryModal = ({ type, data = [], onClose, onNavigate }) => {
  const titles = { consultations: 'Consultation History', appointments: 'Appointment History', reports: 'Report History', medications: 'Medication History' };

  const getIcon = (item) => {
    if (item.category === 'report'        || type === 'reports')       return <FileText size={15} color="#f59e0b"/>;
    if (item.category === 'consultation'  || type === 'consultations') return <MessageSquare size={15} color="#2563eb"/>;
    if (item.category === 'prescription'  || type === 'medications')   return <Pill size={15} color="#8b5cf6"/>;
    if (item.category === 'appointment'   || type === 'appointments')  return <Calendar size={15} color="#10b981"/>;
    return <FileText size={15} color="#64748b"/>;
  };

  const getTitle = (item) => item.title || item.diagnosis || item.drug || item.fileName || 'Record';
  const getDate  = (item) => item.date  || item.uploadedAt || '';
  const getDetails = (item) => {
    if (item.summary) return item.summary.slice(0, 120) + (item.summary.length > 120 ? '…' : '');
    if (item.details) return item.details.slice(0, 120) + (item.details.length > 120 ? '…' : '');
    return item.triageRecommendation || '';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 560, maxHeight: '80vh', background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{titles[type] || 'History'}</h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#64748b"/>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No records yet</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>Records will appear here after you use the app.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.slice(0, 20).map((item, i) => {
                const triage = item.triageType && TRIAGE_STYLE[item.triageType];
                return (
                  <div key={item.id || i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '0.9rem 1rem', background: triage ? triage.bg : '#f8fafc', borderRadius: 12, border: `1px solid ${triage ? triage.border : '#e2e8f0'}` }}>
                    <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>{getIcon(item)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTitle(item)}</div>
                      {getDate(item) && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0.15rem 0' }}>
                          <Clock size={10}/>{getDate(item)}
                        </div>
                      )}
                      {getDetails(item) && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45, whiteSpace: 'pre-line' }}>{getDetails(item)}</div>
                      )}
                      {item.status && (item.category === 'prescription' || type === 'medications') && (
                        <span style={{ display: 'inline-block', marginTop: '0.3rem', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, background: item.status === 'Active' ? '#f5f3ff' : '#f0fdf4', color: item.status === 'Active' ? '#7c3aed' : '#16a34a', border: `1px solid ${item.status === 'Active' ? '#d8b4fe' : '#bbf7d0'}` }}>{item.status}</span>
                      )}
                      {item.status && (item.category === 'appointment' || type === 'appointments') && (
                        <span style={{ display: 'inline-block', marginTop: '0.3rem', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, background: item.status === 'Confirmed' ? '#f0fdf4' : '#fef2f2', color: item.status === 'Confirmed' ? '#16a34a' : '#dc2626', border: `1px solid ${item.status === 'Confirmed' ? '#bbf7d0' : '#fca5a5'}` }}>{item.status}</span>
                      )}
                    </div>
                    {triage && (
                      <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 800, padding: '0.18rem 0.5rem', borderRadius: 20, background: '#fff', color: triage.color, border: `1.5px solid ${triage.border}` }}>{triage.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem' }}>
          {type === 'consultations' && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => { onNavigate('consultation'); onClose(); }}>Start New Consultation</button>}
          {type === 'appointments'  && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => { onNavigate('appointments'); onClose(); }}>Book Appointment</button>}
          {type === 'reports'       && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => { onNavigate('reports-upload'); onClose(); }}>Upload New Report</button>}
          {type === 'medications'   && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => { onNavigate('medications'); onClose(); }}>View All Medications</button>}
          <button className="btn btn-outline" onClick={() => { onNavigate('records'); onClose(); }} style={{ flex: 1, fontSize: '0.85rem' }}>Full Health Records</button>
        </div>
      </div>
    </div>
  );
};
