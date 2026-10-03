import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Bell, Pill, Droplets, Moon, Activity, Calendar, CheckCircle2,
  Trash2, Plus, X, Clock, AlertTriangle
} from 'lucide-react';

const ICON_MAP = {
  pill:    { icon: <Pill size={16}/>,      bg: '#f5f3ff', color: '#8b5cf6' },
  water:   { icon: <Droplets size={16}/>,  bg: '#eff6ff', color: '#2563eb' },
  sleep:   { icon: <Moon size={16}/>,      bg: '#f5f3ff', color: '#7c3aed' },
  steps:   { icon: <Activity size={16}/>,  bg: '#f0fdf4', color: '#10b981' },
  monitor: { icon: <Activity size={16}/>,  bg: '#fffbeb', color: '#f59e0b' },
  calendar:{ icon: <Calendar size={16}/>,  bg: '#ecfdf5', color: '#059669' },
  default: { icon: <Bell size={16}/>,      bg: '#f8fafc', color: '#64748b' },
};

export const RemindersView = () => {
  const { reminders, toggleReminder, removeReminder, addReminder } = useHealth();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIcon, setNewIcon] = useState('pill');

  const active    = (reminders || []).filter(r => !r.completed);
  const completed = (reminders || []).filter(r => r.completed);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addReminder(newTitle.trim(), newSubtitle.trim() || 'Daily', newIcon);
    setNewTitle(''); setNewSubtitle(''); setAdding(false);
  };

  const ReminderCard = ({ r }) => {
    const style = ICON_MAP[r.icon] || ICON_MAP.default;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1.15rem', background: r.completed ? '#f8fafc' : '#fff', borderRadius: 12, border: `1px solid ${r.completed ? '#e2e8f0' : 'var(--border-color)'}`, opacity: r.completed ? 0.65 : 1, transition: 'all 0.2s' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {style.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', textDecoration: r.completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
          {r.subtitle && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11}/>{r.subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button onClick={() => toggleReminder(r.id)} title={r.completed ? 'Mark Active' : 'Mark Done'} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', background: r.completed ? '#f0fdf4' : '#f5f3ff', color: r.completed ? '#16a34a' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={15}/>
          </button>
          <button onClick={() => removeReminder(r.id)} title="Remove" style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Wellness Reminders</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {active.length} active · {completed.length} completed · Reminders expire after 5 days
          </p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setAdding(true)}>
          <Plus size={15}/> Add Reminder
        </button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="ui-card" style={{ border: '1.5px solid #bfdbfe', background: '#f0f9ff', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, color: '#1e40af' }}>New Reminder</span>
            <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18}/></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input className="input-field" placeholder="Reminder title (e.g. Take Paracetamol)" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <input className="input-field" placeholder="Time / details (e.g. 08:00 AM · After meals)" value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {Object.entries(ICON_MAP).filter(([k]) => k !== 'default').map(([k, v]) => (
                <button key={k} onClick={() => setNewIcon(k)} style={{ padding: '0.4rem 0.75rem', borderRadius: 20, border: `2px solid ${newIcon === k ? v.color : '#e2e8f0'}`, background: newIcon === k ? v.bg : '#fff', color: v.color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s' }}>
                  {v.icon} {k}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={!newTitle.trim()}>
                <Plus size={14}/> Add Reminder
              </button>
              <button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active ({active.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {active.map(r => <ReminderCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed ({completed.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {completed.map(r => <ReminderCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {reminders.length === 0 && !adding && (
        <div className="ui-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Bell size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>No reminders yet</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Reminders are auto-created when you complete an AI consultation or you can add them manually.</p>
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={14}/> Add Your First Reminder</button>
        </div>
      )}

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.85rem 1.1rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', gap: '0.5rem' }}>
        <AlertTriangle size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
        Medication reminders expire automatically after 5 days. These are wellness prompts only, not medical alerts.
      </div>
    </div>
  );
};

export const SettingsView = () => {
  const { reminders } = useHealth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 560 }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Settings</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Preferences and app configuration</p>
      </div>
      <div className="ui-card">
        <h3 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>App Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[['App', 'AI HealthVerse'], ['Version', '2.0.0'], ['Backend', 'FastAPI · localhost:8000'], ['AI Model', 'Gemini 3.6 Flash'], ['Reminders', `${reminders.length} total`], ['Data', 'Stored locally + PostgreSQL']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ui-card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '0.82rem', color: '#0c4a6e', lineHeight: 1.6 }}>
          <strong>Privacy:</strong> All health data is stored locally on your device and optionally synced to a local PostgreSQL database. No data is sent to external servers without your consent.
        </div>
      </div>
    </div>
  );
};
