import React from 'react';
import { useHealth } from '../context/HealthContext';
import {
  FileText, CheckCircle2, FlaskConical, AlertTriangle, ArrowLeft,
  Stethoscope, Eye, Clock, Info, Activity, Heart, ChevronRight,
  Zap, Shield, TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3
} from 'lucide-react';

export const ReportAnalysisView = ({ setActiveTab }) => {
  const { reports } = useHealth();
  const latest = reports?.[0];

  if (!latest) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
        <div className="ui-card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <FileText size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>No Reports Uploaded Yet</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.5rem' }}>Upload your lab reports to receive instant AI-powered clinical analysis.</p>
          <button className="btn btn-primary" onClick={() => setActiveTab('reports-upload')}>
            Upload a Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }} onClick={() => setActiveTab('reports-upload')}>
          <ArrowLeft size={14}/> Upload Another
        </button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Report Analysis</h2>
        <span className="badge-tag badge-green" style={{ fontSize: '0.7rem', marginLeft: 'auto' }}>
          <CheckCircle2 size={11}/> AI Analyzed
        </span>
      </div>

      {/* File Info */}
      <div className="ui-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.35rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
          <FileText size={20}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{latest.fileName || 'Lab Report'}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
            <Clock size={11}/> {latest.date}{latest.time ? ` · ${latest.time}` : ''}
            {latest.labName && <span> · {latest.labName}</span>}
          </div>
        </div>
      </div>

      {/* AI Clinical Summary */}
      {latest.summary && (
        <div className="ui-card" style={{ border: '1.5px solid #bfdbfe', background: '#f0f9ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
            <Stethoscope size={18} color="#2563eb" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e40af' }}>Clinical Summary</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#1e293b', whiteSpace: 'pre-line', lineHeight: 1.75 }}>
            {latest.summary}
          </div>
        </div>
      )}

      {/* Disease / Condition Cards */}
      {latest.diseaseSummary && latest.diseaseSummary.length > 0 && (
        <div className="ui-card">
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Activity size={16} color="#e11d48" /> Conditions Suggested by This Report
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {latest.diseaseSummary.map((d, i) => {
              const lc = {
                Possible: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
                Probable: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
                Detected: { bg: '#ede9fe', color: '#4c1d95', border: '#c4b5fd' },
              }[d.likelihood] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
              return (
                <div key={i} style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '0.9rem 1.1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <Heart size={14} color="#e11d48" />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{d.condition}</span>
                    <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: lc.bg, color: lc.color, border: `1px solid ${lc.border}` }}>{d.likelihood}</span>
                  </div>
                  {d.evidencedBy && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}><span style={{ fontWeight: 600 }}>Evidenced by:</span> {d.evidencedBy}</div>}
                  {d.leadsto && (
                    <div style={{ fontSize: '0.78rem', color: '#dc2626', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
                      <ChevronRight size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span><span style={{ fontWeight: 600 }}>If untreated:</span> {d.leadsto}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Test Results */}
      {latest.testResults && latest.testResults.length > 0 && (
        <div className="ui-card">
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <BarChart3 size={16} color="#f59e0b" /> Test Results
            <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>{latest.testResults.length} tests</span>
          </div>
          {typeof latest.testResults[0] === 'object' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.6fr 0.9fr', gap: '0.5rem', padding: '0.35rem 0.9rem', marginBottom: '0.25rem' }}>
                {['Test Name','Your Value','Normal Range','Status'].map((h, i) => (
                  <div key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {latest.testResults.map((t, i) => {
                  const statusCfg = {
                    Normal:   { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', label: 'Normal', icon: <Minus size={11}/> },
                    Low:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', label: 'Low', icon: <TrendingDown size={11}/> },
                    High:     { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'High', icon: <TrendingUp size={11}/> },
                    Critical: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: 'Critical', icon: <AlertCircle size={11}/> },
                  }[t.status] || { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', label: 'Normal', icon: <Minus size={11}/> };
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.6fr 0.9fr', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 0.9rem', background: i % 2 === 0 ? 'var(--bg-subtle)' : 'transparent', borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{t.testName}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: t.status === 'Normal' ? '#065f46' : t.status === 'Low' ? '#1e40af' : '#991b1b' }}>
                        {t.value} <span style={{ fontWeight: 400, fontSize: '0.73rem', color: 'var(--text-muted)' }}>{t.unit}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.refRange}</div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {latest.testResults.map((t, i) => (
                <div key={i} style={{ fontSize: '0.85rem', padding: '0.6rem 0.85rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 9, display: 'flex', gap: '0.5rem', color: '#78350f', fontWeight: 600 }}>
                  <FlaskConical size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }}/> {String(t)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Explanation Points */}
      {latest.aiExplanation && latest.aiExplanation.length > 0 && (
        <div className="ui-card">
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Zap size={16} color="#8b5cf6"/> Key Clinical Insights
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {latest.aiExplanation.map((e, i) => (
              <div key={i} style={{ padding: '0.75rem 1rem', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 11, borderLeft: '3.5px solid #8b5cf6', fontSize: '0.87rem', color: '#1e293b', lineHeight: 1.75 }}>
                {e}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Triage Recommendation */}
      {latest.triageRecommendation && (
        <div className="ui-card" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={16} color="#16a34a"/>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#14532d' }}>Doctor Recommendation</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#166534', lineHeight: 1.6 }}>{latest.triageRecommendation}</div>
        </div>
      )}

      {/* Patient Context Used */}
      {latest.patientContext && (
        <div className="ui-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1.1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.3rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <Info size={12}/> ANALYSED WITH PATIENT HISTORY CONTEXT
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{latest.patientContext.slice(0, 200)}{latest.patientContext.length > 200 ? '…' : ''}</div>
        </div>
      )}

      {/* All Past Reports */}
      {reports.length > 1 && (
        <div className="ui-card">
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', margin: '0 0 0.85rem' }}>Previous Reports</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reports.slice(1).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <FileText size={14} color="#f59e0b" style={{ flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.fileName || 'Report'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveTab('records')}>
          <Eye size={14}/> View in Health Records
        </button>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveTab('reports-upload')}>
          Upload Another
        </button>
      </div>

      <div className="ui-card" style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem 1.1rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#92400e', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }}/> AI analysis is for informational purposes only. Always consult a qualified physician for medical decisions.
        </div>
      </div>
    </div>
  );
};
