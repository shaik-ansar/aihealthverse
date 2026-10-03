import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RobotMascot } from '../components/RobotMascot';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Heart, Shield, Database, Cpu,
  User, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

/* ─── Tiny reusable input ─────────────────────────────────────────────────── */
const Field = ({ id, label, type = 'text', icon: Icon, value, onChange, placeholder, right, error }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    {label && (
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.45rem', letterSpacing: '0.01em' }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          <Icon size={15} />
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : 'email'}
        style={{
          width: '100%',
          padding: `0.75rem 0.9rem 0.75rem ${Icon ? '2.65rem' : '0.9rem'}`,
          paddingRight: right ? '3rem' : '0.9rem',
          background: '#f1f5fb',
          border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
          borderRadius: 12,
          fontSize: '0.9rem',
          color: '#111827',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f1f5fb'; }}
      />
      {right}
    </div>
    {error && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{error}</p>}
  </div>
);

/* ─── Feature pill ────────────────────────────────────────────────────────── */
const FeaturePill = ({ icon: Icon, text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.65rem 1rem',
    background: 'rgba(255,255,255,0.65)',
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
  }}>
    <Icon size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151' }}>{text}</span>
  </div>
);

/* ─── Main LoginView ──────────────────────────────────────────────────────── */
export const LoginView = ({ onLoginSuccess }) => {
  const { loginWithBackend, registerWithBackend } = useAuth();

  const [mode,      setMode]      = useState('login');   // 'login' | 'register'
  const [role,      setRole]      = useState('patient'); // 'patient' | 'doctor'
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [fullName,  setFullName]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [fieldErrs, setFieldErrs] = useState({});

  const switchMode = (m) => {
    setMode(m); setError(''); setSuccess(''); setFieldErrs({});
    setEmail(''); setPassword(''); setFullName(''); setConfirm('');
  };

  /* ─── Validation ─────────────────────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (mode === 'register') {
      if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = 'Full name must be at least 2 characters';
    }
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    else if (mode === 'register' && password.length < 4) errs.password = 'Password must be at least 4 characters';
    if (mode === 'register' && password !== confirm) errs.confirm = 'Passwords do not match';
    setFieldErrs(errs);
    return Object.keys(errs).length === 0;
  };

  /* ─── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithBackend(email.trim(), password);
        setSuccess('Signed in successfully!');
        setTimeout(() => onLoginSuccess?.(), 500);
      } else {
        await registerWithBackend(fullName.trim(), email.trim(), password, role);
        setSuccess('Account created! Redirecting…');
        setTimeout(() => onLoginSuccess?.(), 700);
      }
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.';
      if (msg.includes('already exists')) setError('An account with this email already exists. Try signing in.');
      else if (msg.includes('Invalid email or password')) setError('Incorrect email or password. Please try again.');
      else if (msg.toLowerCase().includes('network') || msg.includes('fetch') || msg.includes('Failed'))
        setError('Cannot connect to server. Please ensure the AI HealthVerse backend is running on port 8000.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Eye button ──────────────────────────────────────────────────────────── */
  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button" onClick={toggle}
      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8f5f2 0%, #eef2fb 50%, #f0eafa 100%)',
      padding: '1.5rem',
      fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
    }}>
      {/* Card container */}
      <div style={{
        width: '100%', maxWidth: 900,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(15,23,42,0.12), 0 4px 20px rgba(15,23,42,0.06)',
        minHeight: 560,
      }}>

        {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #eef3ff 0%, #e8f0fe 40%, #dbeafe 100%)',
          padding: '2.5rem 2.25rem',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(59,130,246,0.07)', pointerEvents: 'none' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <Heart size={18} fill="#fff" color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.02em' }}>AI HealthVerse</div>
            </div>
          </div>

          {/* Tagline */}
          <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0 0 1.75rem', fontWeight: 400, lineHeight: 1.5 }}>
            Your AI-Powered Health Companion
          </p>

          {/* Robot */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
            <RobotMascot size={170} />
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
            <FeaturePill icon={Shield}   text="HIPAA-grade data privacy" />
            <FeaturePill icon={Database} text="End-to-end encrypted records" />
            <FeaturePill icon={Cpu}      text="AI-powered triage & insights" />
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div style={{
          background: '#ffffff',
          padding: '2.5rem 2.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
              {mode === 'login' ? <>Welcome Back <span>👋</span></> : <>Create Account <span>✨</span></>}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, fontWeight: 400 }}>
              {mode === 'login'
                ? 'Sign in to continue to your health dashboard'
                : 'Join AI HealthVerse and take control of your health'}
            </p>
          </div>

          {/* Role Toggle (register only) */}
          {mode === 'register' && (
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: '3px', marginBottom: '1.25rem', gap: '3px' }}>
              {['patient', 'doctor'].map(r => (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '0.5rem', fontSize: '0.82rem', fontWeight: 700, border: 'none', borderRadius: 8,
                    background: role === r ? '#fff' : 'transparent',
                    color: role === r ? '#6366f1' : '#6b7280',
                    boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'capitalize',
                  }}
                >
                  {r === 'patient' ? '🧑 Patient' : '👨‍⚕️ Doctor'}
                </button>
              ))}
            </div>
          )}

          {/* Error / Success banners */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: '1.1rem' }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.83rem', color: '#b91c1c', fontWeight: 500 }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, marginBottom: '1.1rem' }}>
              <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.83rem', color: '#065f46', fontWeight: 500 }}>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Full name (register only) */}
            {mode === 'register' && (
              <Field
                id="fullName" label="Full Name" icon={User}
                value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Ansar Khan" error={fieldErrs.fullName}
              />
            )}

            {/* Email */}
            <Field
              id="email" label="Email or Username" type="email" icon={Mail}
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" error={fieldErrs.email}
            />

            {/* Password */}
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label htmlFor="password" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                  <Lock size={15} />
                </div>
                <input
                  id="password" type={showPwd ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{
                    width: '100%', padding: '0.75rem 3rem 0.75rem 2.65rem',
                    background: '#f1f5fb', border: `1.5px solid ${fieldErrs.password ? '#fca5a5' : '#e5e7eb'}`,
                    borderRadius: 12, fontSize: '0.9rem', color: '#111827',
                    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = fieldErrs.password ? '#fca5a5' : '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f1f5fb'; }}
                />
                <EyeBtn show={showPwd} toggle={() => setShowPwd(v => !v)} />
              </div>
              {fieldErrs.password && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{fieldErrs.password}</p>}
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div style={{ marginBottom: '1.1rem' }}>
                <label htmlFor="confirm" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.45rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                    <Lock size={15} />
                  </div>
                  <input
                    id="confirm" type={showConf ? 'text' : 'password'}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password"
                    style={{
                      width: '100%', padding: '0.75rem 3rem 0.75rem 2.65rem',
                      background: '#f1f5fb', border: `1.5px solid ${fieldErrs.confirm ? '#fca5a5' : '#e5e7eb'}`,
                      borderRadius: 12, fontSize: '0.9rem', color: '#111827',
                      fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = fieldErrs.confirm ? '#fca5a5' : '#e5e7eb'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f1f5fb'; }}
                  />
                  <EyeBtn show={showConf} toggle={() => setShowConf(v => !v)} />
                </div>
                {fieldErrs.confirm && <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{fieldErrs.confirm}</p>}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'all 0.15s', marginBottom: '1.25rem',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; } }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'ahv-spin 1s linear infinite' }} /> Processing…</>
                : mode === 'login'
                  ? <>Sign In <ArrowRight size={16} /></>
                  : <>Create Account <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Mode switch */}
          <p style={{ textAlign: 'center', fontSize: '0.84rem', color: '#6b7280', margin: 0 }}>
            {mode === 'login'
              ? <>Don&apos;t have an account?{' '}<button type="button" onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem' }}>Register</button></>
              : <>Already have an account?{' '}<button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem' }}>Sign In</button></>
            }
          </p>

          {/* Security notice */}
          <div style={{ marginTop: '1.5rem', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={12} color="#6366f1" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
              Your data is encrypted and stored securely. AI HealthVerse does not share your medical information.
            </span>
          </div>
        </div>
      </div>

      {/* Responsive & spin animation */}
      <style>{`
        @keyframes ahv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .ahv-login-grid { grid-template-columns: 1fr !important; }
          .ahv-login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
};
