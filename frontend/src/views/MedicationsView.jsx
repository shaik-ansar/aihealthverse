import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { Pill, CheckCircle2, XCircle, Clock, User, Plus, Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export const MedicationsView = () => {
  const { prescriptions, setPrescriptions } = useHealth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Active');
  const [expanded, setExpanded] = useState(null);

  const filtered = (prescriptions || []).filter(p => {
    const matchFilter = filter === 'All' || p.status === filter;
    const matchSearch = !search || (p.drug || '').toLowerCase().includes(search.toLowerCase()) || (p.doctorName || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const markCompleted = (id) => {
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: 'Completed' } : p));
  };

  const activeCount = (prescriptions || []).filter(p => p.status === 'Active').length;
  const completedCount = (prescriptions || []).filter(p => p.status === 'Completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Medications & Prescriptions</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Track your current and past medications. Active medications expire after 5 days.</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
        {[
          { label: 'Active', value: activeCount, color: '#8b5cf6', bg: '#f5f3ff', icon: <Pill size={18}/> },
          { label: 'Completed', value: completedCount, color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle2 size={18}/> },
          { label: 'Total', value: (prescriptions || []).length, color: '#2563eb', bg: '#eff6ff', icon: <Plus size={18}/> }
        ].map(s => (
          <div key={s.label} className="ui-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input-field" placeholder="Search medications…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.4rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['All', 'Active', 'Completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 20, border: `2px solid ${filter === f ? '#8b5cf6' : '#e2e8f0'}`, background: filter === f ? '#8b5cf6' : '#fff', color: filter === f ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Medication List */}
      {filtered.length === 0 ? (
        <div className="ui-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Pill size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>No medications found</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filter === 'Active' ? 'No active medications. Start an AI consultation to receive prescriptions.' : 'No medications match your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((p, i) => (
            <div key={p.id || i} className="ui-card" style={{ padding: '1.1rem 1.35rem', border: p.status === 'Active' ? '1.5px solid #d8b4fe' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => setExpanded(expanded === (p.id || i) ? null : (p.id || i))}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: p.status === 'Active' ? '#f5f3ff' : '#f8fafc', color: p.status === 'Active' ? '#8b5cf6' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Pill size={18}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{p.drug || 'Medication'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>{p.dosage} · {p.frequency}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, background: p.status === 'Active' ? '#f5f3ff' : '#f0fdf4', color: p.status === 'Active' ? '#7c3aed' : '#16a34a', border: `1px solid ${p.status === 'Active' ? '#d8b4fe' : '#bbf7d0'}` }}>
                    {p.status}
                  </span>
                  {expanded === (p.id || i) ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
                </div>
              </div>

              {expanded === (p.id || i) && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    ['Duration', p.duration], ['Prescribed by', p.doctorName], ['Specialty', p.specialty], ['Date', p.date], ['Notes', p.notes]
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.83rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, minWidth: 110, flexShrink: 0 }}>{label}:</span>
                      <span style={{ color: 'var(--text-main)' }}>{val}</span>
                    </div>
                  ))}
                  {p.status === 'Active' && (
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', alignSelf: 'flex-start', marginTop: '0.35rem', color: '#10b981', borderColor: '#10b981' }} onClick={() => markCompleted(p.id)}>
                      <CheckCircle2 size={13}/> Mark as Completed
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.85rem 1.1rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <AlertTriangle size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
        <span>Active medications automatically expire after 5 days. Always follow your doctor's instructions.</span>
      </div>
    </div>
  );
};
