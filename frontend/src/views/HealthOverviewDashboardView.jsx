import React from 'react';
import { useHealth } from '../context/HealthContext';
import { useAuth } from '../context/AuthContext';
import {
  Activity, Heart, Moon, Footprints, TrendingUp, TrendingDown,
  Minus, Zap, BarChart2, Calendar
} from 'lucide-react';

const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80; const h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const HealthOverviewDashboardView = ({ setActiveTab }) => {
  const { healthTrends, vitals } = useHealth();
  const { currentUser } = useAuth();

  const latest = healthTrends?.[healthTrends.length - 1] || {};
  const prev   = healthTrends?.[healthTrends.length - 2] || {};

  const trend = (key) => {
    if (!prev[key] || !latest[key]) return 'flat';
    return latest[key] > prev[key] ? 'up' : latest[key] < prev[key] ? 'down' : 'flat';
  };
  const TIcon = ({ t, good = 'up' }) => {
    if (t === 'up') return good === 'up' ? <TrendingUp size={14} color="#16a34a"/> : <TrendingUp size={14} color="#dc2626"/>;
    if (t === 'down') return good === 'down' ? <TrendingDown size={14} color="#16a34a"/> : <TrendingDown size={14} color="#dc2626"/>;
    return <Minus size={14} color="#94a3b8"/>;
  };

  const vitalCards = [
    {
      label: 'Health Score', value: vitals?.healthScore ?? 82, unit: '/100',
      icon: <Heart size={20}/>, color: '#ef4444', bg: '#fef2f2',
      desc: 'Overall wellness index', trendIcon: <Zap size={13} color="#ef4444"/>
    },
    {
      label: 'Steps Today', value: (latest?.steps || vitals?.stepsToday || 0).toLocaleString(), unit: ' steps',
      icon: <Footprints size={20}/>, color: '#2563eb', bg: '#eff6ff',
      desc: `Goal: ${(vitals?.stepsGoal || 10000).toLocaleString()}`, trendIcon: <TIcon t={trend('steps')} good="up"/>
    },
    {
      label: 'Sleep', value: latest?.sleep || vitals?.sleepHours || '7h', unit: latest?.sleep ? 'h' : '',
      icon: <Moon size={20}/>, color: '#7c3aed', bg: '#f5f3ff',
      desc: vitals?.sleepStatus || 'Good quality', trendIcon: <TIcon t={trend('sleep')} good="up"/>
    },
    {
      label: 'Heart Rate', value: latest?.heartRate || vitals?.heartRate || 72, unit: ' bpm',
      icon: <Activity size={20}/>, color: '#10b981', bg: '#f0fdf4',
      desc: vitals?.heartRateStatus || 'Normal range', trendIcon: <TIcon t={trend('heartRate')} good="down"/>
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Health Trends & Vitals</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Your 7-day wellness overview</p>
      </div>

      {/* Vital Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {vitalCards.map(v => (
          <div key={v.label} className="ui-card" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: v.bg, color: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {v.icon}
              </div>
              {v.trendIcon}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
              {v.value}<span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>{v.unit}</span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>{v.label}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>{v.desc}</div>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      {healthTrends && healthTrends.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Steps (7 days)', key: 'steps', color: '#2563eb', data: healthTrends.map(t => t.steps) },
            { label: 'Sleep Hours (7 days)', key: 'sleep', color: '#7c3aed', data: healthTrends.map(t => t.sleep) },
            { label: 'Heart Rate (7 days)', key: 'heartRate', color: '#ef4444', data: healthTrends.map(t => t.heartRate) },
          ].map(chart => (
            <div key={chart.key} className="ui-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{chart.label}</span>
                <BarChart2 size={16} color="#94a3b8"/>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: 60 }}>
                {chart.data.map((val, i) => {
                  const max = Math.max(...chart.data); const min = Math.min(...chart.data);
                  const pct = max === min ? 0.5 : (val - min) / (max - min);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: `${chart.color}${Math.round(pct * 155 + 100).toString(16)}`, height: `${Math.max(8, pct * 50)}px`, transition: 'height 0.3s' }} title={String(val)} />
                      <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>{healthTrends[i]?.date?.split(' ')[0] || ''}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                <span>Min: {Math.min(...chart.data)}</span>
                <span>Avg: {Math.round(chart.data.reduce((a, b) => a + b, 0) / chart.data.length)}</span>
                <span>Max: {Math.max(...chart.data)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ui-card" style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0e7ff)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e40af', marginBottom: '0.25rem' }}>Get a full health assessment</div>
          <div style={{ fontSize: '0.82rem', color: '#3b82f6' }}>Talk to Dr. HealthVerse AI for a personalized wellness plan</div>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.7rem 1.25rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('consultation')}>
          Start Consultation
        </button>
      </div>
    </div>
  );
};
