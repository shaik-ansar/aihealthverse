/**
 * ConsultationView.jsx -- Dr. HealthVerse AI Consultation (Enhanced)
 * NEW: Disease Estimation, Symptom Tags, Severity Gauge, Safety Reminders,
 *      Differential Diagnoses, Top Specialist Card
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import { DOCTORS_DATABASE } from '../data/hospitalsData';
import {
  Send, Mic, MicOff, Volume2, VolumeX,
  Sparkles, Calendar, Building2, Star,
  CheckCircle2, AlertCircle, FlaskConical, Pill, User,
  RotateCcw, Stethoscope, Wifi, WifiOff, AlertTriangle,
  Brain, Activity, Bell, Info, ClipboardList, ChevronRight, Salad,
  ShieldAlert, TrendingUp, Tag, ChevronDown, ChevronUp, Zap
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const TypingIndicator = ({ reasoning }) => (
  <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start' }}>
    <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, marginTop:2, background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 3px 12px rgba(29,78,216,.3)' }}>
      <Stethoscope size={16} />
    </div>
    <div style={{ padding:'0.85rem 1.1rem', borderRadius:'14px 14px 14px 2px', background:'#fff', border:'1px solid #e2e8f0', boxShadow:'0 1px 4px rgba(0,0,0,.06)', maxWidth:280 }}>
      {reasoning ? (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Brain size={13} color='#7c3aed' style={{ flexShrink:0 }} />
          <span style={{ fontSize:'0.78rem', color:'#7c3aed', fontStyle:'italic', fontWeight:600 }}>Analysing your symptoms...</span>
          <span className='typing-dots' />
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
          <span style={{ fontSize:'0.78rem', color:'#64748b', fontStyle:'italic' }}>Dr. HealthVerse is typing</span>
          <span className='typing-dots' />
        </div>
      )}
    </div>
  </div>
);

const MessageBubble = ({ m }) => {
  const isAi = m.sender === 'ai';
  const isTriage = m.phase === 'TRIAGE' && isAi;
  return (
    <div style={{ display:'flex', alignSelf: isAi ? 'flex-start' : 'flex-end', maxWidth:'88%', gap:'0.5rem', animation:'fadeSlideIn 0.22s ease-out forwards' }}>
      {isAi && (<div style={{ width:34, height:34, borderRadius:10, flexShrink:0, marginTop:2, background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 3px 10px rgba(29,78,216,.25)' }}><Stethoscope size={15} /></div>)}
      <div style={{ padding:'0.95rem 1.1rem', borderRadius: isAi ? '14px 14px 14px 2px' : '14px 14px 2px 14px', background: isAi ? '#fff' : 'linear-gradient(135deg,#2563eb,#7c3aed)', color: isAi ? 'var(--text-main)' : '#fff', border: isAi ? (isTriage?'1.5px solid #c7d2fe':'1px solid #e2e8f0') : 'none', boxShadow: isAi ? (isTriage?'0 2px 12px rgba(99,102,241,.12)':'0 1px 6px rgba(0,0,0,.07)') : '0 4px 16px rgba(37,99,235,.28)', fontSize:'0.885rem', lineHeight:1.72 }}>
        {isTriage && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', marginBottom:'0.5rem', paddingBottom:'0.45rem', borderBottom:'1px solid #e0e7ff' }}>
            <Brain size={12} color='#6366f1' />
            <span style={{ fontSize:'0.68rem', fontWeight:800, color:'#4338ca', textTransform:'uppercase', letterSpacing:'0.05em' }}>Clinical Assessment</span>
          </div>
        )}
        <div style={{ whiteSpace:'pre-line', color: isAi ? '#1e293b' : '#fff', fontWeight: isAi ? 450 : 400 }}>{m.text}</div>
        <div style={{ fontSize:'0.62rem', marginTop:'0.35rem', textAlign:'right', opacity:0.45 }}>
          {m.time}
        </div>
      </div>
      {!isAi && (<div style={{ width:34, height:34, borderRadius:10, flexShrink:0, marginTop:2, background:'#e0e7ff', color:'#4338ca', display:'flex', alignItems:'center', justifyContent:'center' }}><User size={15} /></div>)}
    </div>
  );
};

const TriageCard = ({ icon, title, accent, bg, borderColor, children }) => (
  <div style={{ background: bg||'#fff', borderRadius:12, border:`1.5px solid ${borderColor||'#e2e8f0'}`, padding:'0.9rem 1rem', marginBottom:'0.6rem' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:'0.55rem' }}>
      <div style={{ width:26, height:26, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:accent+'22', flexShrink:0 }}>
        {React.cloneElement(icon, { size:13, color:accent })}
      </div>
      <span style={{ fontSize:'0.76rem', fontWeight:800, color:accent, letterSpacing:'0.03em', textTransform:'uppercase' }}>{title}</span>
    </div>
    <div style={{ fontSize:'0.82rem', color:'#1e293b', lineHeight:1.65 }}>{children}</div>
  </div>
);

const SeverityGauge = ({ score=1 }) => {
  const pct = Math.min(Math.max((score/10)*100, 3), 100);
  const color = score<=3 ? '#16a34a' : score<=6 ? '#d97706' : '#dc2626';
  const label = score<=3 ? 'Mild' : score<=6 ? 'Moderate' : score<=8 ? 'Severe' : 'Critical';
  return (
    <div style={{ marginBottom:'0.6rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.3rem' }}>
        <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em' }}>Symptom Severity</span>
        <span style={{ fontSize:'0.72rem', fontWeight:800, color, padding:'2px 8px', borderRadius:20, background:color+'15' }}>{score}/10 &mdash; {label}</span>
      </div>
      <div style={{ height:7, borderRadius:10, background:'#f1f5f9', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:10, background: score<=3 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : score<=6 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)', transition:'width 0.8s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
};

const SymptomTags = ({ tags=[] }) => {
  if (!tags?.length) return null;
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginBottom:'0.65rem' }}>
      {tags.map((t,i) => (
        <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', padding:'3px 10px', borderRadius:20, background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', fontSize:'0.7rem', fontWeight:700 }}>
          <Tag size={9} /> {t}
        </span>
      ))}
    </div>
  );
};

const urgencyColors = {
  Low:      { bg:'#f0fdf4', bar:'#22c55e', text:'#166534', border:'#bbf7d0' },
  Moderate: { bg:'#fffbeb', bar:'#f59e0b', text:'#92400e', border:'#fde68a' },
  High:     { bg:'#fff7ed', bar:'#f97316', text:'#9a3412', border:'#fed7aa' },
  Critical: { bg:'#fef2f2', bar:'#ef4444', text:'#991b1b', border:'#fca5a5' },
};

const DiseaseEstimationPanel = ({ diseases=[], differentials=[] }) => {
  const [showDiff, setShowDiff] = useState(false);
  if (!diseases?.length) return null;
  return (
    <div style={{ borderRadius:12, border:'1.5px solid #c7d2fe', background:'linear-gradient(135deg,#eef2ff,#f5f3ff)', padding:'0.9rem 1rem', marginBottom:'0.6rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:'0.7rem' }}>
        <div style={{ width:26, height:26, borderRadius:7, background:'#6366f122', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><TrendingUp size={13} color='#6366f1' /></div>
        <span style={{ fontSize:'0.76rem', fontWeight:800, color:'#4338ca', textTransform:'uppercase', letterSpacing:'0.04em' }}>Estimated Disease Probability</span>
        <span style={{ marginLeft:'auto', fontSize:'0.6rem', color:'#7c3aed', fontWeight:700, background:'#ede9fe', padding:'2px 7px', borderRadius:10 }}>AI Analysis</span>
      </div>
      {diseases.map((d,i) => {
        const uc = urgencyColors[d.urgency] || urgencyColors.Moderate;
        const pct = Math.min(Math.max(d.probability||5, 3), 98);
        return (
          <div key={i} style={{ background:'#fff', borderRadius:10, border:`1px solid ${uc.border}`, padding:'0.65rem 0.75rem', marginBottom:i<diseases.length-1?'0.45rem':0, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.35rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', minWidth:0 }}>
                <span style={{ fontWeight:800, fontSize:'0.82rem', color:'#1e293b' }}>
                  {i===0 && <Zap size={11} color='#f59e0b' style={{ marginRight:3, verticalAlign:'middle' }} />}
                  {d.name}
                </span>
                {d.icd10 && <span style={{ fontSize:'0.6rem', color:'#94a3b8', fontWeight:600, fontFamily:'monospace', flexShrink:0 }}>ICD-10: {d.icd10}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0, marginLeft:'0.5rem' }}>
                <span style={{ fontSize:'0.63rem', fontWeight:800, color:uc.text, background:uc.bg, padding:'1px 7px', borderRadius:10, border:`1px solid ${uc.border}` }}>{d.urgency}</span>
                <span style={{ fontSize:'0.9rem', fontWeight:900, color:uc.bar }}>{d.probability}%</span>
              </div>
            </div>
            <div style={{ height:6, borderRadius:6, background:'#f1f5f9', overflow:'hidden', marginBottom:'0.3rem' }}>
              <div style={{ height:'100%', width:`${pct}%`, borderRadius:6, background:uc.bar, opacity:0.85, transition:'width 1s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            {d.description && <div style={{ fontSize:'0.7rem', color:'#64748b', lineHeight:1.5 }}>{d.description}</div>}
          </div>
        );
      })}
      {differentials?.length>0 && (
        <div style={{ marginTop:'0.5rem' }}>
          <button onClick={()=>setShowDiff(v=>!v)} style={{ width:'100%', padding:'0.4rem 0.6rem', borderRadius:8, background:'none', border:'1px dashed #c7d2fe', color:'#6366f1', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>Differential Diagnoses ({differentials.length} considered)</span>
            {showDiff ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          {showDiff && (
            <div style={{ marginTop:'0.4rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
              {differentials.map((dd,i) => (
                <div key={i} style={{ padding:'0.45rem 0.6rem', borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <div style={{ fontWeight:700, fontSize:'0.77rem', color:'#334155' }}>&#x21aa; {dd.name}</div>
                  {dd.reason && <div style={{ fontSize:'0.68rem', color:'#64748b', marginTop:'0.1rem', lineHeight:1.5 }}>{dd.reason}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize:'0.63rem', color:'#94a3b8', marginTop:'0.5rem', fontStyle:'italic', lineHeight:1.4 }}>
        &#9888; Probabilities are AI estimates based on reported symptoms only and do not replace clinical diagnosis.
      </div>
    </div>
  );
};

const SafetyRemindersPanel = ({ reminders=[] }) => {
  if (!reminders?.length) return null;
  return (
    <div style={{ borderRadius:12, border:'1.5px solid #fed7aa', background:'linear-gradient(135deg,#fff7ed,#fffbeb)', padding:'0.9rem 1rem', marginBottom:'0.6rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:'0.55rem' }}>
        <div style={{ width:26, height:26, borderRadius:7, background:'#f9731622', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><ShieldAlert size={13} color='#ea580c' /></div>
        <span style={{ fontSize:'0.76rem', fontWeight:800, color:'#c2410c', textTransform:'uppercase', letterSpacing:'0.04em' }}>Safety Reminders Until You See the Doctor</span>
      </div>
      {reminders.map((rem,i) => {
        const clean = rem.replace(/^[\u23f0\uD83D\uDD50]\s*/u, '');
        const parts = clean.split(/\s*--\s*/);
        const timeStr = parts[0]?.trim()||'';
        const action  = parts[1]?.trim()||clean;
        const reason  = parts[2]?.trim()||'';
        return (
          <div key={i} style={{ display:'flex', gap:'0.55rem', alignItems:'flex-start', padding:'0.45rem 0.55rem', borderRadius:9, background:'#fff', border:'1px solid #fed7aa', marginBottom:i<reminders.length-1?'0.3rem':0, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
            <div style={{ minWidth:64, height:22, borderRadius:6, background:'#ffedd5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'0.6rem', fontWeight:800, color:'#c2410c' }}>&#9200; {timeStr.length>12?'Daily':timeStr}</span>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.77rem', color:'#7c2d12' }}>{action}</div>
              {reason && <div style={{ fontSize:'0.67rem', color:'#9a3412', marginTop:'0.05rem', opacity:0.85 }}>{reason}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TopSpecialistCard = ({ doc, theme, setSelectedDoctor, setActiveTab }) => {
  if (!doc) return null;
  return (
    <div style={{ borderRadius:12, border:`1.5px solid ${theme.border}`, background:'#fff', padding:'0.85rem', marginBottom:'0.6rem', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize:'0.68rem', fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>&#127973; Top Specialist Matched</div>
      <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
        <img src={doc.avatar} alt={doc.name} style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', border:`2px solid ${theme.border}`, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:'0.88rem', color:'#1e293b' }}>{doc.name}</div>
          <div style={{ fontSize:'0.73rem', color:theme.accent, fontWeight:700 }}>{doc.specialization} &middot; {doc.experience}+ yrs</div>
          <div style={{ fontSize:'0.67rem', color:'#64748b', display:'flex', alignItems:'center', gap:'0.35rem', marginTop:'0.15rem', flexWrap:'wrap' }}>
            <Building2 size={10}/>{doc.hospitalName}
            <Star size={10} fill='#f59e0b' color='#f59e0b'/> {doc.rating}
            <span style={{ color:'#10b981', fontWeight:700 }}>Slots: 09:10 AM</span>
          </div>
        </div>
      </div>
      <button onClick={()=>{ if(doc) setSelectedDoctor(doc); setActiveTab('appointments'); }}
        style={{ width:'100%', marginTop:'0.65rem', padding:'0.6rem', borderRadius:10, border:'none', background:theme.btnBg, color:'#fff', fontWeight:800, fontSize:'0.8rem', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', boxShadow:`0 4px 14px ${theme.btnShadow}`, transition:'transform 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';}}
        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}>
        <Calendar size={13}/> Book Appointment with {doc.specialization}
        {doc.fee && <span style={{ opacity:0.85, fontSize:'0.73rem' }}>({doc.fee})</span>}
      </button>
    </div>
  );
};

export const ConsultationView = ({ setActiveTab, isActive }) => {
  const { currentUser, token, logout } = useAuth();
  const { setSelectedDoctor, addConsultationRecord, prescriptions, consultationSummaries, doctors } = useHealth();
  const userName = currentUser?.name?.split(' ')[0] || 'there';

  const buildGreeting = () => ({
    id:'init', sender:'ai', phase:'QUESTIONING',
    text:`Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, ${userName}. I'm Dr. HealthVerse, your AI physician. Please describe what you're experiencing — your symptoms, how long they've been going on, and anything else that's been concerning you. I'm here to help.`,
    time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  });

  const [messages, setMessages]             = useState([buildGreeting()]);
  const [input, setInput]                   = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [isListening, setIsListening]       = useState(false);
  const [voiceMuted, setVoiceMuted]         = useState(false);
  const [triage, setTriage]                 = useState(null);
  const [matchedDoc, setMatchedDoc]         = useState(null);
  const [contextUsed, setContextUsed]       = useState(false);
  const [backendOk, setBackendOk]           = useState(null);
  const [micError, setMicError]             = useState(null);
  const [turnCount, setTurnCount]           = useState(0);
  const [isReasoning, setIsReasoning]       = useState(false);
  const [savedToRecords, setSavedToRecords] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const bottomRef=useRef(null); const inputRef=useRef(null); const speechRef=useRef(null);
  const silenceTimer=useRef(null); const latestText=useRef(''); const sendMessageRef=useRef(null);

  useEffect(()=>{fetch(`${API_BASE}/health`).then(r=>setBackendOk(r.ok)).catch(()=>setBackendOk(false));},[]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages,isLoading]);

  // ─── TTS: Text-to-Speech ─────────────────────────────────────────────────
  const ttsKeepalive = useRef(null);
  const speak = useCallback((rawText, isLong=false) => {
    if(voiceMuted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    clearInterval(ttsKeepalive.current);

    // Clean text: remove markdown symbols, °F/°C units kept readable, truncate
    const maxLen = isLong ? 500 : 320;
    const clean = rawText
      .replace(/[*_#`\[\]]/g, '')
      .replace(/—/g, ', ')
      .replace(/\n+/g, '. ')
      .replace(/\.\s*\./g, '.')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, maxLen);

    if(!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);

    const pickVoice = () => {
      const vs = window.speechSynthesis.getVoices();
      return (
        vs.find(v => v.name === 'Google UK English Male') ||
        vs.find(v => v.name.includes('Microsoft David')) ||
        vs.find(v => v.name.includes('Microsoft Mark')) ||
        vs.find(v => v.lang === 'en-GB' && !v.name.includes('Female')) ||
        vs.find(v => v.lang === 'en-US' && !v.name.includes('Female')) ||
        vs.find(v => v.lang?.startsWith('en')) ||
        null
      );
    };

    const trySpeak = () => {
      const v = pickVoice();
      if(v) utter.voice = v;
      utter.rate  = 0.90;
      utter.pitch = 0.95;
      utter.volume = 1.0;

      // Chrome bug: speechSynthesis pauses after ~15s on some systems
      // Keepalive: pause/resume every 10s to prevent silent death
      ttsKeepalive.current = setInterval(() => {
        if(window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(ttsKeepalive.current);
        }
      }, 10000);

      utter.onend  = () => clearInterval(ttsKeepalive.current);
      utter.onerror = () => clearInterval(ttsKeepalive.current);
      window.speechSynthesis.speak(utter);
    };

    if(window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [voiceMuted]);

  // Speak greeting only when the user actively navigates to the Consultation tab
  // (isActive flips from false → true). Never fire on initial app mount/login.
  const prevIsActive = useRef(false);
  useEffect(()=>{
    if(isActive && !prevIsActive.current){
      const t=setTimeout(()=>speak(buildGreeting().text),700);
      prevIsActive.current=true;
      return()=>clearTimeout(t);
    }
    if(!isActive) prevIsActive.current=false;
  // eslint-disable-next-line
  },[isActive]);

  // ─── STT: Speech-to-Text ──────────────────────────────────────────────────
  const accumulatedRef = useRef(''); // accumulates final transcripts
  const startListening = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ setMicError('Voice input needs Chrome or Edge browser.'); return; }
    setMicError(null);

    // Request mic permission explicitly
    try {
      if(navigator.mediaDevices?.getUserMedia)
        await navigator.mediaDevices.getUserMedia({audio:true});
    } catch {
      setMicError('Microphone access denied. Enable it in browser settings.');
      return;
    }

    window.speechSynthesis?.cancel(); // stop TTS while listening
    accumulatedRef.current = '';
    latestText.current = '';

    const rec = new SR();
    speechRef.current = rec;
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = 'en-US';
    rec.maxAlternatives = 1;

    let active = true;
    rec.onstart = () => setIsListening(true);

    rec.onresult = (e) => {
      if(!active) return;
      // Accumulate all final results + show interim
      let newFinal = '';
      let interim  = '';
      for(let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if(e.results[i].isFinal) newFinal += t + ' ';
        else interim += t;
      }
      if(newFinal) accumulatedRef.current += newFinal;
      const display = (accumulatedRef.current + interim).trim();
      if(display) { setInput(display); latestText.current = display; }

      // Reset silence timer on new speech
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if(active && latestText.current.trim().length > 2) {
          active = false;
          try { rec.stop(); } catch {}
        }
      }, 2800);
    };

    rec.onerror = (e) => {
      if(e.error === 'not-allowed') {
        setMicError('Microphone blocked. Click the camera icon in your browser address bar to allow.');
      } else if(e.error === 'network') {
        setMicError('Network error with voice recognition. Check your internet connection.');
      } else if(e.error !== 'aborted' && e.error !== 'no-speech') {
        setMicError(`Voice error: ${e.error}`);
      }
      active = false;
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      clearTimeout(silenceTimer.current);
      const finalText = latestText.current.trim();
      if(active && finalText.length > 2) {
        active = false;
        sendMessageRef.current?.(finalText);
      }
    };

    try { rec.start(); }
    catch(err) { setMicError('Could not start microphone: ' + err.message); }
  }, []);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimer.current);
    try { speechRef.current?.stop(); } catch {}
    setIsListening(false);
    // Auto-send whatever was captured
    const captured = latestText.current.trim();
    if(captured.length > 2) sendMessageRef.current?.(captured);
  }, []);

  const toggleMic = useCallback(async () => {
    if(isListening) { stopListening(); }
    else { setInput(''); latestText.current=''; accumulatedRef.current=''; await startListening(); }
  }, [isListening, startListening, stopListening]);

  useEffect(() => { sendMessageRef.current = sendMessage; });
  useEffect(() => () => {
    clearTimeout(silenceTimer.current);
    clearInterval(ttsKeepalive.current);
    try { speechRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }, []);

  // Search live DB doctors first, fall back to local seed data
  const findDoctor = (specialty) => {
    const pool = (doctors && doctors.length > 0) ? doctors : DOCTORS_DATABASE;
    if (!specialty) return pool[0];
    const kw = specialty.toLowerCase().split(' ')[0];
    return pool.find(d => d.specialization?.toLowerCase().includes(kw)) || pool[0];
  };

  const buildPatientContext = () => {
    const ctx = {};
    if (currentUser?.name)              ctx.name               = currentUser.name;
    if (currentUser?.age)               ctx.age                = currentUser.age;
    if (currentUser?.sex)               ctx.sex                = currentUser.sex;
    if (currentUser?.blood_group)       ctx.blood_group        = currentUser.blood_group;
    if (currentUser?.height)            ctx.height             = currentUser.height;
    if (currentUser?.weight)            ctx.weight             = currentUser.weight;
    if (currentUser?.allergies)         ctx.allergies          = currentUser.allergies;
    // Include chronic conditions — critical for accurate AI triage
    if (currentUser?.chronic_conditions) ctx.chronic_conditions = currentUser.chronic_conditions;
    // Active medications from prescriptions
    const meds = (prescriptions || []).filter(p => p.status === 'Active').map(p => p.drug).filter(Boolean);
    if (meds.length) ctx.active_medications = meds;
    // Recent diagnoses from consultation history
    const dx = (consultationSummaries || []).slice(0, 3).map(c => c.diagnosis).filter(Boolean);
    if (dx.length) ctx.recent_conditions = dx.join(', ');
    return Object.keys(ctx).length ? ctx : null;
  };

  const sendMessage=async(text)=>{
    const content=(text||input).trim();if(!content||isLoading)return;
    const userMsg={id:`u-${Date.now()}`,sender:'user',text:content,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
    const updated=[...messages,userMsg];setMessages(updated);setInput('');latestText.current='';
    setIsLoading(true);setIsReasoning(false);
    const reasoningTimer=setTimeout(()=>setIsReasoning(true),800);
    const history=updated.filter(m=>m.id!=='init').map(m=>({sender:m.sender,text:m.text}));
    const patientCtx=buildPatientContext();
    try{
      const res=await fetch(`${API_BASE}/consultation/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({query:content,conversation_history:history,patient_context:patientCtx})});
      clearTimeout(reasoningTimer);
      if(!res.ok){
        if(res.status===401){
          // Stale/invalid token — clear it and force re-login
          const em={id:`e-${Date.now()}`,sender:'ai',phase:'QUESTIONING',text:'Your session has expired. Redirecting you to sign in again…',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
          setMessages(prev=>[...prev,em]);speak(em.text);
          setTimeout(()=>logout(),1800);
          return;
        }
        if(res.status===429||res.status===503){const bm={id:`e-${Date.now()}`,sender:'ai',phase:'QUESTIONING',text:'The AI is temporarily busy. Please wait a moment and try again.',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};setMessages(prev=>[...prev,bm]);speak(bm.text);return;}
        throw new Error(`HTTP ${res.status}`);
      }
      const data=await res.json();
      const aiMsg={id:`a-${Date.now()}`,sender:'ai',phase:data.phase,text:data.message,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
      setMessages(prev=>[...prev,aiMsg]);setContextUsed(data.context_used);setTurnCount(c=>c+1);speak(data.message);
      if(data.phase==='TRIAGE'&&data.triage){
        const t=data.triage;setTriage(t);setSavedToRecords(false);
        if(t.type==='DOCTOR_NEEDED'||t.doctorSpecialty)setMatchedDoc(findDoctor(t.doctorSpecialty));
        const transcript=[...updated,aiMsg].filter(m=>m.id!=='init').map(m=>`${m.sender==='user'?'Patient':'Dr. HealthVerse'}: ${m.text}`).join('\n\n');
        addConsultationRecord({diagnosis:t.diagnosis||'Consultation completed',reasoning:t.reasoning||'',triageType:t.type||'LOW_CONCERN',doctorSpecialty:t.doctorSpecialty||'General Physician',tests:t.tests||[],medicationTips:t.medicationTips||[],reminderList:t.reminders||[],dietaryAdvice:t.dietaryAdvice||'',doctorInstructions:t.doctorInstructions||'',badge:t.badge||'',appointmentNeeded:t.appointmentNeeded||false,transcript});
        setSavedToRecords(true);
      }
    }catch(err){
      clearTimeout(reasoningTimer);
      const isOffline=backendOk===false||err.message?.includes('fetch')||err.message?.includes('network');
      const errText=isOffline?'The AI backend appears to be offline. Please ensure FastAPI is running on port 8000.':`Connection issue: ${err.message}. Please try again.`;
      const errMsg={id:`e-${Date.now()}`,sender:'ai',phase:'QUESTIONING',text:errText,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
      setMessages(prev=>[...prev,errMsg]);speak(errText);
    }finally{setIsLoading(false);setIsReasoning(false);inputRef.current?.focus();}
  };

  const resetChat=()=>{
    window.speechSynthesis?.cancel();speechRef.current?.stop();
    const g=buildGreeting();
    setMessages([g]);setTriage(null);setMatchedDoc(null);setContextUsed(false);setTurnCount(0);setSavedToRecords(false);setInput('');latestText.current='';
    setTimeout(()=>speak(g.text),400);
  };

  const chips=['I have a throbbing headache on my left temple since yesterday','Fever with body chills and shivering since this morning','Burning pain in my chest and stomach after eating','Constantly thirsty, frequent urination, and tired all day','Sharp knee pain when climbing stairs or bending'];
  const statusLabel=isListening?'Listening':isLoading?'Thinking...':'Online';
  const statusColor=isListening?'#ef4444':isLoading?'#f59e0b':'#10b981';

  const triageTheme={
    LOW_CONCERN:{bg:'linear-gradient(135deg,#f0fdf4,#ecfdf5)',border:'#86efac',accent:'#16a34a',text:'#14532d',badgeBg:'#dcfce7',icon:<CheckCircle2 size={20} color='#16a34a'/>,btnBg:'linear-gradient(135deg,#16a34a,#15803d)',btnShadow:'rgba(22,163,74,.25)'},
    LAB_TEST:{bg:'linear-gradient(135deg,#fffbeb,#fef9c3)',border:'#fde68a',accent:'#d97706',text:'#78350f',badgeBg:'#fef3c7',icon:<FlaskConical size={20} color='#d97706'/>,btnBg:'linear-gradient(135deg,#d97706,#b45309)',btnShadow:'rgba(217,119,6,.25)'},
    DOCTOR_NEEDED:{bg:'linear-gradient(135deg,#fef2f2,#fff1f2)',border:'#fca5a5',accent:'#dc2626',text:'#991b1b',badgeBg:'#fee2e2',icon:<AlertCircle size={20} color='#dc2626'/>,btnBg:'linear-gradient(135deg,#dc2626,#b91c1c)',btnShadow:'rgba(220,38,38,.25)'}
  };
  const theme=triage?(triageTheme[triage.type]||triageTheme.LOW_CONCERN):null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',height:'calc(100vh - 5.5rem)'}}>

      <div className='ui-card' style={{padding:'0.75rem 1.1rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.7rem'}}>
          <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',boxShadow:'0 4px 16px rgba(29,78,216,.3)'}}><Stethoscope size={21}/></div>
          <div>
            <div style={{fontWeight:800,fontSize:'0.96rem',color:'var(--text-main)',display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap'}}>
              Dr. HealthVerse
              <span style={{fontSize:'0.67rem',color:'#7c3aed',fontWeight:700,background:'#f5f3ff',padding:'2px 8px',borderRadius:12,border:'1px solid #e0e7ff'}}>AI Clinical &middot; Gemini</span>
              <span style={{fontSize:'0.62rem',padding:'1px 7px',borderRadius:20,fontWeight:700,background:isLoading?'#fffbeb':'#ecfdf5',color:statusColor,border:`1px solid ${isLoading?'#fde68a':'#86efac'}`}}>&#9679; {statusLabel}</span>
            </div>
            <div style={{fontSize:'0.71rem',color:'#64748b',marginTop:'0.05rem'}}>
              Patient: <b>{currentUser?.name||'Patient'}</b>
              {currentUser?.age && <> &middot; {currentUser.age}y</>}
              {currentUser?.blood_group && <> &middot; {currentUser.blood_group}</>}
              {contextUsed && <span style={{color:'#10b981',fontWeight:700}}> &middot; History Synced</span>}
              {turnCount>0 && <span style={{color:'#94a3b8'}}> &middot; {turnCount} turn{turnCount>1?'s':''}</span>}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.4rem',alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:'0.67rem',fontWeight:700,padding:'0.22rem 0.6rem',borderRadius:20,background:backendOk===true?'#f0fdf4':backendOk===false?'#fef2f2':'#f8fafc',color:backendOk===true?'#16a34a':backendOk===false?'#dc2626':'#64748b',border:`1px solid ${backendOk===true?'#86efac':backendOk===false?'#fca5a5':'#e2e8f0'}`,display:'flex',alignItems:'center',gap:'0.3rem'}}>
            {backendOk===true?<><Wifi size={10}/> AI Connected</>:backendOk===false?<><WifiOff size={10}/> Offline</>:'Connecting...'}
          </span>
          <button className='btn btn-secondary' style={{fontSize:'0.75rem',padding:'0.35rem 0.65rem',display:'flex',alignItems:'center',gap:'0.3rem'}} onClick={()=>{window.speechSynthesis?.cancel();setVoiceMuted(v=>!v);}}>
            {voiceMuted?<VolumeX size={13} color='#ef4444'/>:<Volume2 size={13} color='#2563eb'/>} {voiceMuted?'Muted':'Voice On'}
          </button>
          <button className='btn btn-outline' style={{fontSize:'0.75rem',padding:'0.35rem 0.65rem',display:'flex',alignItems:'center',gap:'0.3rem'}} onClick={resetChat}>
            <RotateCcw size={13}/> New Chat
          </button>
        </div>
      </div>

      {micError && <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'0.5rem 0.85rem',fontSize:'0.75rem',color:'#92400e',display:'flex',alignItems:'center',gap:'0.4rem',flexShrink:0}}><AlertTriangle size={14} color='#d97706'/> {micError}</div>}
      {sessionExpired && (
        <div style={{background:'linear-gradient(135deg,#fef2f2,#fff1f2)',border:'1.5px solid #fca5a5',borderRadius:10,padding:'0.65rem 1rem',fontSize:'0.78rem',color:'#991b1b',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><AlertCircle size={16} color='#dc2626'/><span><b>Session expired.</b> Please log out and sign in again.</span></div>
          <button onClick={()=>{window.speechSynthesis?.cancel();logout();}} style={{padding:'0.35rem 0.85rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:800,fontSize:'0.75rem',cursor:'pointer',fontFamily:'inherit',marginLeft:'1rem',flexShrink:0}}>Log Out &amp; Re-Login</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:triage?'1.35fr 1fr':'1fr',gap:'0.85rem',flex:1,minHeight:0}}>
        <div className='ui-card' style={{display:'flex',flexDirection:'column',padding:'1rem',minHeight:0,overflow:'hidden'}}>
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'0.75rem',paddingRight:'0.1rem'}}>
            {messages.map(m=><MessageBubble key={m.id} m={m}/>)}
            {isLoading && <TypingIndicator reasoning={isReasoning}/>}
            <div ref={bottomRef}/>
          </div>

          {messages.length<=2&&!triage&&(
            <div style={{borderTop:'1px solid var(--border-color)',paddingTop:'0.55rem',marginTop:'0.55rem',flexShrink:0}}>
              <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginBottom:'0.35rem',display:'flex',gap:'0.3rem',alignItems:'center'}}><Sparkles size={10} color='#7c3aed'/> Quick start &mdash; tap a symptom:</div>
              <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
                {chips.map((c,i)=>(<button key={i} onClick={()=>sendMessage(c)} disabled={isLoading} style={{padding:'0.28rem 0.65rem',borderRadius:20,background:'#f5f3ff',border:'1px solid #e0e7ff',color:'#4338ca',fontSize:'0.7rem',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#ede9fe';}} onMouseLeave={e=>{e.currentTarget.style.background='#f5f3ff';}}>{c}</button>))}
              </div>
            </div>
          )}

          {isListening&&(
            <div style={{marginTop:'0.5rem',padding:'0.45rem 0.75rem',borderRadius:8,flexShrink:0,background:'linear-gradient(90deg,#eff6ff,#fdf2f8)',border:'1px solid #bfdbfe',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',animation:'pulse 1s infinite'}}/><span style={{fontSize:'0.76rem',color:'#1e40af',fontWeight:700}}>Listening... speak naturally</span></div>
              <button type='button' onClick={toggleMic} style={{fontSize:'0.7rem',fontWeight:700,color:'#dc2626',background:'none',border:'none',cursor:'pointer'}}>Done</button>
            </div>
          )}

          <form onSubmit={e=>{e.preventDefault();sendMessage(input);}} style={{display:'flex',gap:'0.4rem',alignItems:'center',marginTop:'0.65rem',flexShrink:0}}>
            <input ref={inputRef} type='text' className='input-field' placeholder={isListening?'Listening... speak now':'Describe your symptoms or tap mic to speak...'} value={input} onChange={e=>{setInput(e.target.value);latestText.current=e.target.value;}} disabled={isLoading} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage(input)} style={{flex:1,padding:'0.78rem 0.95rem',fontSize:'0.88rem',background:isListening?'#f0fdf4':'#fff',borderColor:isListening?'#16a34a':undefined,transition:'all 0.2s'}}/>
            <button type='button' onClick={toggleMic} style={{width:44,height:44,borderRadius:11,cursor:'pointer',flexShrink:0,background:isListening?'#ef4444':'#f5f3ff',color:isListening?'#fff':'#7c3aed',border:isListening?'none':'1.5px solid #c4b5fd',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isListening?'0 0 18px rgba(239,68,68,.5)':'none',transition:'all .2s'}}>{isListening?<MicOff size={19}/>:<Mic size={19}/>}</button>
            <button type='submit' className='btn btn-primary' disabled={!input.trim()||isLoading} style={{height:44,padding:'0 1.1rem',background:'linear-gradient(135deg,#2563eb,#7c3aed)',border:'none',flexShrink:0,display:'flex',alignItems:'center',gap:'0.3rem'}}><Send size={15}/></button>
          </form>
        </div>

        {triage&&theme&&(
          <div style={{display:'flex',flexDirection:'column',overflowY:'auto',gap:0}}>
            {(triage.type==='DOCTOR_NEEDED'||triage.type==='LAB_TEST')&&(
              <div style={{borderRadius:12,padding:'0.7rem 0.9rem',marginBottom:'0.55rem',background:theme.bg,border:`1.5px solid ${theme.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>
                <span style={{fontSize:'0.7rem',fontWeight:800,color:theme.text,textTransform:'uppercase',letterSpacing:'0.04em'}}>{triage.type==='DOCTOR_NEEDED'?'Specialist Consultation Needed':'Lab Tests Required'}</span>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>{savedToRecords&&<span style={{fontSize:'0.63rem',color:'#10b981',fontWeight:700,display:'flex',alignItems:'center',gap:3}}><CheckCircle2 size={10}/> Saved</span>}{theme.icon}</div>
              </div>
            )}

            <div style={{borderRadius:14,padding:'1rem 1.1rem',marginBottom:'0.55rem',background:theme.bg,border:`1.5px solid ${theme.border}`,boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem'}}>
                <span style={{fontSize:'0.67rem',fontWeight:800,padding:'3px 10px',borderRadius:20,background:theme.badgeBg,color:theme.accent,border:`1px solid ${theme.border}`,letterSpacing:'0.04em'}}>{triage.badge||triage.type}</span>
                {triage.type==='LOW_CONCERN'&&savedToRecords&&<span style={{fontSize:'0.63rem',color:'#10b981',fontWeight:700,display:'flex',alignItems:'center',gap:3}}><CheckCircle2 size={10}/> Saved to Records</span>}
              </div>
              <h3 style={{fontSize:'0.93rem',fontWeight:900,color:theme.text,margin:'0 0 0.35rem',lineHeight:1.35}}>{triage.diagnosis}</h3>
              <p style={{fontSize:'0.76rem',color:theme.accent,margin:'0 0 0.55rem',lineHeight:1.6,opacity:0.9}}>{triage.reasoning}</p>
              {triage.severityScore&&<SeverityGauge score={triage.severityScore}/>}
              {triage.symptomTags?.length>0&&<SymptomTags tags={triage.symptomTags}/>}
            </div>

            {triage.diseaseEstimation?.length>0&&<DiseaseEstimationPanel diseases={triage.diseaseEstimation} differentials={triage.differentialDiagnoses||[]}/>}
            {triage.safetyReminders?.length>0&&<SafetyRemindersPanel reminders={triage.safetyReminders}/>}

            {triage.doctorInstructions&&(
              <TriageCard icon={<ClipboardList/>} title='What to Tell Your Physician' accent='#dc2626' bg='#fef2f2' borderColor='#fca5a5'>
                <p style={{margin:0,lineHeight:1.65,color:'#991b1b'}}>{triage.doctorInstructions}</p>
              </TriageCard>
            )}

            {triage.dietaryAdvice&&<TriageCard icon={<Salad/>} title='Diet and Daily Routine' accent='#059669' bg='#f0fdf4' borderColor='#bbf7d0'>{triage.dietaryAdvice}</TriageCard>}

            {triage.medicationTips?.length>0&&(
              <TriageCard icon={<Pill/>} title='Medications' accent='#2563eb' bg='#eff6ff' borderColor='#bfdbfe'>
                {triage.medicationTips.map((med,i)=>{const parts=med.split('--').map(s=>s.trim());const drugLine=parts[0]||med;const schedule=parts.slice(1).join(' \u00b7 ');return(<div key={i} style={{display:'flex',gap:'0.55rem',alignItems:'flex-start',padding:'0.55rem 0.65rem',borderRadius:9,background:'#fff',border:'1px solid #dbeafe',marginBottom:i<triage.medicationTips.length-1?'0.4rem':0}}><div style={{width:22,height:22,borderRadius:6,background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}><Pill size={11} color='#2563eb'/></div><div><div style={{fontWeight:800,fontSize:'0.8rem',color:'#1e3a8a',marginBottom:'0.1rem'}}>{drugLine}</div>{schedule&&<div style={{fontSize:'0.72rem',color:'#3b82f6',fontWeight:600}}>{schedule}</div>}</div></div>);})}
                <div style={{fontSize:'0.68rem',color:'#64748b',marginTop:'0.5rem',fontStyle:'italic'}}>OTC medications only. Consult a pharmacist if unsure.</div>
              </TriageCard>
            )}

            {triage.tests?.length>0&&(
              <TriageCard icon={<FlaskConical/>} title='Lab Tests Required' accent='#d97706' bg='#fffbeb' borderColor='#fde68a'>
                {triage.tests.map((test,i)=>(<div key={i} style={{display:'flex',gap:'0.5rem',alignItems:'center',padding:'0.45rem 0.6rem',borderRadius:8,background:'#fff',border:'1px solid #fef3c7',marginBottom:i<triage.tests.length-1?'0.35rem':0}}><FlaskConical size={12} color='#d97706' style={{flexShrink:0}}/><span style={{fontWeight:700,fontSize:'0.79rem',color:'#78350f'}}>{test}</span></div>))}
                <button onClick={()=>setActiveTab('reports-upload')} style={{width:'100%',marginTop:'0.5rem',padding:'0.5rem',background:'none',border:'1.5px dashed #fde68a',borderRadius:8,color:'#d97706',fontSize:'0.76rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#fef3c7';}} onMouseLeave={e=>{e.currentTarget.style.background='none';}}><FlaskConical size={12}/> Upload Report for AI Analysis <ChevronRight size={12}/></button>
              </TriageCard>
            )}

            {triage.reminders?.length>0&&(
              <TriageCard icon={<Bell/>} title='Daily Reminders and Schedule' accent='#7c3aed' bg='#faf5ff' borderColor='#e9d5ff'>
                {triage.reminders.map((rem,i)=>{const clean=rem.replace(/^[\u23f0]\s*/,'');const parts=clean.split(/\s*--\s*/);const timeStr=parts[0]?.trim()||'';const action=parts[1]?.trim()||clean;const reason=parts[2]?.trim()||'';const isTime=/^\d{1,2}:\d{2}\s*(AM|PM)/i.test(timeStr);return(<div key={i} style={{display:'flex',gap:'0.6rem',alignItems:'flex-start',padding:'0.45rem 0.55rem',borderRadius:9,background:'#fff',border:'1px solid #ede9fe',marginBottom:i<triage.reminders.length-1?'0.3rem':0}}><div style={{minWidth:56,height:22,borderRadius:6,background:'#ede9fe',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:'0.63rem',fontWeight:800,color:'#7c3aed'}}>{isTime?timeStr:'Daily'}</span></div><div><div style={{fontWeight:700,fontSize:'0.77rem',color:'#4c1d95'}}>{isTime?action:clean}</div>{reason&&<div style={{fontSize:'0.68rem',color:'#7c3aed',marginTop:'0.05rem',opacity:0.8}}>{reason}</div>}</div></div>);})}
              </TriageCard>
            )}

            {matchedDoc&&<TopSpecialistCard doc={matchedDoc} theme={theme} setSelectedDoctor={setSelectedDoctor} setActiveTab={setActiveTab}/>}

            <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',marginTop:'0.1rem'}}>
              {triage.type==='LAB_TEST'&&!matchedDoc&&(<button onClick={()=>setActiveTab('appointments')} style={{width:'100%',padding:'0.7rem',borderRadius:11,border:'none',background:'linear-gradient(135deg,#d97706,#b45309)',color:'#fff',fontWeight:800,fontSize:'0.83rem',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',boxShadow:'0 4px 14px rgba(217,119,6,.25)',transition:'transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}><Calendar size={14}/> Book Lab Appointment</button>)}
              {triage.type==='LOW_CONCERN'&&(<button onClick={()=>setActiveTab('dashboard')} style={{width:'100%',padding:'0.7rem',borderRadius:11,border:'none',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'#fff',fontWeight:800,fontSize:'0.83rem',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',boxShadow:'0 4px 14px rgba(22,163,74,.25)',transition:'transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}><Activity size={14}/> View My Wellness Plan</button>)}
              <button onClick={()=>setTriage(null)} className='btn btn-outline' style={{fontSize:'0.77rem',padding:'0.5rem'}}>Continue Consultation</button>
            </div>

            <div style={{fontSize:'0.66rem',color:'#94a3b8',lineHeight:1.5,marginTop:'0.4rem',padding:'0.5rem 0.6rem',background:'#f8fafc',borderRadius:8,border:'1px solid #f1f5f9'}}>
              <Info size={10} style={{marginRight:3,verticalAlign:'middle'}}/>
              AI clinical assessment for informational purposes only. Always consult a qualified physician.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.25)} }
        .typing-dots::after { content:''; display:inline-block; width:20px; animation:typingDots 1.4s infinite; letter-spacing:2px; vertical-align:bottom; }
        @keyframes typingDots { 0%{content:''} 25%{content:'.'} 50%{content:'..'} 75%{content:'...'} 100%{content:''} }
      `}</style>
    </div>
  );
};
