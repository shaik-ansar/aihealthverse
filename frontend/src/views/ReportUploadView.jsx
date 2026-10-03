import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import {
  UploadCloud, CheckCircle2, AlertTriangle, Loader2,
  Eye, Stethoscope, FlaskConical, ArrowLeft, X, Info, Activity,
  TrendingUp, TrendingDown, Minus, AlertCircle, Heart, Zap,
  ChevronRight, Shield, Clock, BarChart3
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const StatusBadge = ({ status }) => {
  const cfg = {
    Normal:   { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', icon: <Minus size={11}/>, label: 'Normal' },
    Low:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: <TrendingDown size={11}/>, label: 'Low' },
    High:     { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: <TrendingUp size={11}/>, label: 'High' },
    Critical: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', icon: <AlertCircle size={11}/>, label: 'Critical' },
  };
  const c = cfg[status] || cfg.Normal;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }}>
      {c.icon} {c.label}
    </span>
  );
};

const TriageBanner = ({ text }) => {
  if (!text || text === 'NON_MEDICAL_DOCUMENT') return null;
  const isLow = text.toLowerCase().includes('low concern');
  const isCritical = text.toLowerCase().includes('doctor') || text.toLowerCase().includes('48 hours');
  const cfg = isLow
    ? { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', border: '#34d399', color: '#064e3b', icon: <Shield size={18} color="#059669"/> }
    : isCritical
    ? { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '#f87171', color: '#7f1d1d', icon: <AlertCircle size={18} color="#dc2626"/> }
    : { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '#fbbf24', color: '#78350f', icon: <AlertTriangle size={18} color="#d97706"/> };
  return (
    <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{cfg.icon}</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: cfg.color, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doctor's Recommendation</div>
        <div style={{ fontSize: '0.88rem', color: cfg.color, lineHeight: 1.6 }}>{text}</div>
      </div>
    </div>
  );
};

const DiseaseCard = ({ d }) => {
  const lc = {
    Possible: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    Probable: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    Detected: { bg: '#ede9fe', color: '#4c1d95', border: '#c4b5fd' },
  }[d.likelihood] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  return (
    <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '0.9rem 1.1rem', border: '1px solid var(--border-color)' }}>
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
};

const TestResultRow = ({ t, isOdd }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.6fr 0.9fr',
    gap: '0.5rem', alignItems: 'center',
    padding: '0.6rem 0.9rem',
    background: isOdd ? 'var(--bg-subtle)' : 'transparent',
    borderRadius: 8
  }}>
    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{t.testName}</div>
    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: t.status === 'Normal' ? '#065f46' : t.status === 'Low' ? '#1e40af' : '#991b1b' }}>
      {t.value} <span style={{ fontWeight: 400, fontSize: '0.73rem', color: 'var(--text-muted)' }}>{t.unit}</span>
    </div>
    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.refRange}</div>
    <StatusBadge status={t.status} />
  </div>
);

export const ReportUploadView = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const { addReport, consultationSummaries, prescriptions } = useHealth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg','image/png','image/jpg','application/pdf','image/webp'];
    if (!allowed.includes(f.type)) { setError('Please upload a PDF, PNG, JPG, or WebP file.'); return; }
    if (f.size > 15 * 1024 * 1024) { setError('File must be smaller than 15MB.'); return; }
    setFile(f); setError('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else { setPreview(null); }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const analyzeReport = async () => {
    if (!file) return;
    setAnalyzing(true); setError(''); setAnalysisStage('Reading document...');
    const stages = ['Extracting test values...','Identifying biomarkers...','Comparing with reference ranges...','Generating clinical insights...','Finalising your health summary...'];
    let idx = 0;
    const timer = setInterval(() => { if (idx < stages.length) setAnalysisStage(stages[idx++]); }, 1800);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', String(currentUser?.id || 1));
      const recentConsults = (consultationSummaries || []).slice(0,3).map(c =>
        `Consultation (${c.date || 'recent'}): ${c.diagnosis || c.summary || 'N/A'}`).join('\n');
      const activeMeds = (prescriptions || []).filter(p => p.status === 'Active').map(p =>
        `${p.drug} ${p.dosage} - ${p.frequency}`).join(', ');
      const context = [recentConsults, activeMeds ? `Active medications: ${activeMeds}` : ''].filter(Boolean).join('\n');
      if (context) formData.append('patient_context', context);

      const res = await fetch(`${API_BASE}/reports/analyze`, { method: 'POST', body: formData });
      clearInterval(timer);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `Server error: ${res.status}`);
      }
      const data = await res.json();

      // Non-medical document rejection (422)
      if (res.status === 422 || (data.error && data.errorType === 'NON_MEDICAL_DOCUMENT')) {
        setError('This does not appear to be a medical lab report. Please upload a blood test, urine test, or pathology report.');
        setAnalyzing(false); return;
      }

      const reportObj = {
        fileName: file.name, fileType: file.type,
        reportType: data.reportType || 'Medical Report',
        summary: data.summary || '',
        triageRecommendation: data.triageRecommendation || '',
        testResults: data.testResults || [],
        diseaseSummary: data.diseaseSummary || [],
        aiExplanation: data.aiExplanation || [],
        labName: data.labName || '',
        patientName: data.patientName || '',
        reportDate: data.reportDate || '',
        patientContext: context,
        // Demo/quota flags from backend
        isDemo: data._isDemo || false,
        quotaWarning: data._quotaWarning || false,
        errorDetail: data._errorDetail || '',
        rawData: data
      };
      addReport(reportObj);
      setResult(reportObj);
    } catch (err) {
      clearInterval(timer);
      console.error('[ReportUpload]', err);
      setError(`Analysis failed: ${err.message}. Please ensure the backend is running and try again.`);
    } finally {
      clearInterval(timer);
      setAnalyzing(false); setAnalysisStage('');
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(''); };

  if (result) {
    const normalCount = (result.testResults || []).filter(t => t.status === 'Normal').length;
    const abnormalCount = (result.testResults || []).length - normalCount;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }} onClick={reset}>
            <ArrowLeft size={14}/> Upload Another
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Report Analysis</h2>
            {result.reportType && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{result.reportType}</div>}
          </div>
          {result.isDemo ? (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={11}/> Demo Mode
            </span>
          ) : (
            <span className="badge-tag badge-green" style={{ fontSize: '0.7rem' }}>
              <CheckCircle2 size={11}/> Saved to Health Records
            </span>
          )}
        </div>

        {/* Quota / Demo warning banner */}
        {result.isDemo && (
          <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1.5px solid #f59e0b', borderRadius: 14, padding: '0.9rem 1.1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }}/>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#92400e', marginBottom: '0.2rem' }}>
                {result.quotaWarning ? '⚡ API Quota Exceeded — Showing Demo Analysis' : '⚠ Demo Mode — Sample Report Data'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.55 }}>
                {result.quotaWarning
                  ? 'The Gemini AI API rate limit has been reached for this session. The analysis below is a sample demo showing what your real results would look like. Please wait a few minutes and try again for actual analysis of your uploaded report.'
                  : (result.errorDetail || 'Showing sample demo data. Upload a real medical report for actual analysis.')}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '0.75rem 1.1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', border: '1px solid var(--border-color)', alignItems: 'center' }}>
          {result.patientName && <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Patient: </span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.patientName}</span></div>}
          {result.labName && <div style={{ fontSize: '0.8rem' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Lab: </span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.labName}</span></div>}
          {result.reportDate && <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} color="#94a3b8"/><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{result.reportDate}</span></div>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: 20, border: '1px solid #6ee7b7' }}>{normalCount} Normal</span>
            {abnormalCount > 0 && <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: 20, border: '1px solid #fca5a5' }}>{abnormalCount} Abnormal</span>}
          </div>
        </div>

        <div className="ui-card" style={{ border: '1.5px solid #bfdbfe', background: 'linear-gradient(135deg,#f0f9ff 0%,#eff6ff 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(59,130,246,0.07)', borderRadius: '50%' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e40af' }}>Clinical Summary</div>
              <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>AI-Powered Analysis</div>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.85, fontWeight: 500 }}>{result.summary}</div>
        </div>

        {result.diseaseSummary && result.diseaseSummary.length > 0 && (
          <div className="ui-card">
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Activity size={16} color="#e11d48" /> Conditions Suggested by This Report
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {result.diseaseSummary.map((d, i) => <DiseaseCard key={i} d={d} />)}
            </div>
          </div>
        )}

        {result.testResults && result.testResults.length > 0 && (
          <div className="ui-card">
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <BarChart3 size={16} color="#f59e0b" /> Test Results
              <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>{result.testResults.length} tests analysed</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.6fr 0.9fr', gap: '0.5rem', padding: '0.35rem 0.9rem', marginBottom: '0.25rem' }}>
              {['Test Name','Your Value','Normal Range','Status'].map((h, i) => (
                <div key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {result.testResults.map((t, i) => <TestResultRow key={i} t={t} isOdd={i % 2 === 0} />)}
            </div>
          </div>
        )}

        {result.aiExplanation && result.aiExplanation.length > 0 && (
          <div className="ui-card">
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Zap size={16} color="#8b5cf6" /> Key Clinical Insights
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {result.aiExplanation.map((insight, i) => (
                <div key={i} style={{ padding: '0.75rem 1rem', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 11, borderLeft: '3.5px solid #8b5cf6', fontSize: '0.87rem', color: '#1e293b', lineHeight: 1.75 }}>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        <TriageBanner text={result.triageRecommendation} />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveTab('records')}>
            <Eye size={14}/> View in Health Records
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveTab('dashboard')}>Back to Dashboard</button>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '0.65rem 1rem', fontSize: '0.77rem', color: '#78350f', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }}/>
          AI analysis is for informational purposes only. Always consult a qualified physician for medical decisions.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 600, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>Upload Lab Report</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Get instant AI-powered analysis - disease insights, value ranges, and clinical recommendations
        </p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !analyzing && fileRef.current && fileRef.current.click()}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : file ? '#10b981' : '#cbd5e1'}`,
          borderRadius: 16, padding: '2.5rem', textAlign: 'center',
          cursor: analyzing ? 'default' : 'pointer',
          background: dragOver ? '#eff6ff' : file ? '#f0fdf4' : 'var(--bg-subtle)',
          transition: 'all 0.2s'
        }}
      >
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <>
            {preview && <img src={preview} alt="preview" style={{ maxHeight: 160, borderRadius: 10, marginBottom: '0.75rem', objectFit: 'contain' }} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <span style={{ fontWeight: 700, color: '#14532d' }}>{file.name}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB - Click to change file</div>
          </>
        ) : (
          <>
            <UploadCloud size={44} color="#94a3b8" style={{ marginBottom: '0.85rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>Drop your report here or click to browse</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Supports PDF, JPG, PNG, WebP - Max 15MB</div>
          </>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, padding: '0.7rem 1rem', fontSize: '0.83rem', color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }}/> {error}
        </div>
      )}

      {file && !analyzing && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" style={{ flex: 1, padding: '0.9rem', fontSize: '0.95rem' }} onClick={analyzeReport}>
            <Stethoscope size={16}/> Analyze Report with AI
          </button>
          <button className="btn btn-outline" style={{ padding: '0.9rem 1rem' }} onClick={reset}><X size={16}/></button>
        </div>
      )}

      {analyzing && (
        <div className="ui-card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg,#f0f9ff,#eff6ff)', border: '1.5px solid #bfdbfe' }}>
          <Loader2 size={40} color="#2563eb" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '1rem', marginBottom: '0.4rem' }}>AI is analyzing your report...</div>
          <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 500 }}>{analysisStage}</div>
          <div style={{ fontSize: '0.77rem', color: '#93c5fd', marginTop: '0.5rem' }}>Extracting values - Checking ranges - Generating clinical insights</div>
        </div>
      )}

      {!file && !analyzing && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.77rem', marginBottom: '0.5rem' }}>— or —</div>
          <button
            onClick={async () => {
              setAnalyzing(true); setError(''); setAnalysisStage('Loading demo report...');
              try {
                const r = await fetch(`${API_BASE}/reports/sample-result`);
                const data = await r.json();
                const reportObj = {
                  fileName: 'demo_report.pdf', fileType: 'application/pdf',
                  reportType: data.reportType || 'Sample CBC + Vitamin Panel',
                  summary: data.summary || '',
                  triageRecommendation: data.triageRecommendation || '',
                  testResults: data.testResults || [],
                  diseaseSummary: data.diseaseSummary || [
                    { condition: 'Vitamin D Deficiency', likelihood: 'Probable', evidencedBy: 'Vitamin D: 18 ng/mL', leadsto: 'Bone weakness, fatigue, immune dysfunction' },
                    { condition: 'Mild Leukocytosis', likelihood: 'Possible', evidencedBy: 'WBC: 11,200 /µL', leadsto: 'Subclinical infection or inflammatory response' },
                  ],
                  aiExplanation: data.aiExplanation || [],
                  labName: data.labName || 'Apollo Diagnostics',
                  patientName: data.patientName || 'Demo Patient',
                  reportDate: data.reportDate || 'Today',
                  isDemo: true, quotaWarning: false,
                  errorDetail: 'This is a sample demonstration of the AI analysis feature.',
                  rawData: data
                };
                setResult(reportObj);
              } catch(e) { setError('Could not load demo. Is the backend running?'); }
              finally { setAnalyzing(false); setAnalysisStage(''); }
            }}
            style={{ background: 'none', border: '1.5px dashed #94a3b8', borderRadius: 10, padding: '0.55rem 1.4rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.borderColor='#2563eb'; e.target.style.color='#2563eb'; }}
            onMouseLeave={e => { e.target.style.borderColor='#94a3b8'; e.target.style.color='#64748b'; }}
          >
            ✨ Try Demo Analysis
          </button>
        </div>
      )}

      <div className="ui-card" style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem 1.1rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Info size={13}/> Medical Disclaimer
        </div>
        <div style={{ fontSize: '0.77rem', color: '#78350f', lineHeight: 1.5 }}>AI analysis is for informational purposes only. Always consult a qualified physician for medical decisions.</div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};
