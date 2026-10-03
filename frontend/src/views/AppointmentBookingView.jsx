import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import {
  Search, Star, MapPin, Clock, CheckCircle2, ChevronRight,
  X, Loader2, CalendarDays, RefreshCw, Building2, Award,
  Phone, Filter, ArrowLeft, Users, Zap, Calendar,
  AlertCircle, Stethoscope, CreditCard, ChevronLeft,
  ChevronDown, Shield, Activity
} from 'lucide-react';

const API = 'http://localhost:8000';

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getUpcoming14Days() {
  const out = [], base = new Date();
  base.setHours(0,0,0,0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0,10),
      day: d.getDate(),
      month: MONTHS[d.getMonth()],
      monthLong: MONTHS_LONG[d.getMonth()],
      year: d.getFullYear(),
      dow: DAYS[d.getDay()],
      isToday: i === 0,
      isSunday: d.getDay() === 0,
    });
  }
  return out;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  } catch { return iso; }
}

function fmtDateShort(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return iso; }
}

// ── Specialty color map ───────────────────────────────────────────────────────
const SPEC_COLOR = {
  'Cardiologist':       { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  'Neurologist':        { bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
  'Gastroenterologist': { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  'Endocrinologist':    { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  'Orthopedist':        { bg: '#e0f2fe', color: '#075985', dot: '#0ea5e9' },
  'Pulmonologist':      { bg: '#f0fdf4', color: '#14532d', dot: '#22c55e' },
  'Dermatologist':      { bg: '#fdf4ff', color: '#701a75', dot: '#d946ef' },
  'Gynecologist':       { bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' },
  'Nephrologist':       { bg: '#e0f2fe', color: '#0c4a6e', dot: '#06b6d4' },
  'Oncologist':         { bg: '#fff7ed', color: '#7c2d12', dot: '#f97316' },
  'Urologist':          { bg: '#ecfdf5', color: '#064e3b', dot: '#059669' },
  'ENT Specialist':     { bg: '#f1f5f9', color: '#1e3a5f', dot: '#3b82f6' },
  'Pediatrician':       { bg: '#fff1f2', color: '#881337', dot: '#fb7185' },
  'Psychiatrist':       { bg: '#f5f3ff', color: '#4c1d95', dot: '#7c3aed' },
  'General Physician':  { bg: '#f0f9ff', color: '#0c4a6e', dot: '#2563eb' },
};
const specStyle = (s) => SPEC_COLOR[s] || { bg: '#f1f5f9', color: '#334155', dot: '#94a3b8' };

const SPECIALTY_TABS = [
  'All','General Physician','Cardiologist','Neurologist','Gastroenterologist',
  'Endocrinologist','Orthopedist','Pulmonologist','Dermatologist','Gynecologist',
  'Nephrologist','Oncologist','Urologist','ENT Specialist','Pediatrician','Psychiatrist'
];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepDot = ({ n, active, done, label }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem' }}>
    <div style={{
      width: 32, height: 32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.25s',
      background: done ? '#10b981' : active ? '#2563eb' : '#e2e8f0',
      color: done || active ? '#fff' : '#94a3b8',
      boxShadow: active ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
    }}>
      {done ? <CheckCircle2 size={16}/> : n}
    </div>
    <span style={{ fontSize:'0.68rem', fontWeight: 600, color: active ? '#2563eb' : done ? '#10b981' : '#94a3b8', whiteSpace:'nowrap' }}>{label}</span>
  </div>
);

const StepLine = ({ done }) => (
  <div style={{ flex:1, height: 2, background: done ? '#10b981' : '#e2e8f0', borderRadius: 4, marginBottom: 18, transition:'all 0.25s' }}/>
);

// ── Doctor Card ───────────────────────────────────────────────────────────────
const DoctorCard = ({ doc, selected, onClick }) => {
  const sc = specStyle(doc.specialization);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(doc)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', gap:'1rem', alignItems:'flex-start',
        padding:'1rem 1.1rem', borderRadius: 14,
        border: `1.5px solid ${selected ? '#2563eb' : hovered ? '#bfdbfe' : '#e8eef4'}`,
        background: selected ? 'linear-gradient(135deg,#eff6ff,#f0f9ff)' : hovered ? '#f8fbff' : '#fff',
        cursor:'pointer', transition:'all 0.18s',
        boxShadow: selected ? '0 4px 18px rgba(37,99,235,0.13)' : hovered ? '0 2px 10px rgba(37,99,235,0.06)' : '0 1px 4px rgba(15,23,42,0.04)',
        position:'relative',
      }}
    >
      {selected && (
        <div style={{ position:'absolute', top: 10, right: 12, width:20, height:20, borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CheckCircle2 size={12} color="#fff"/>
        </div>
      )}
      <div style={{ position:'relative', flexShrink:0 }}>
        <img
          src={doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&size=100&background=dbeafe&color=1e40af`}
          alt={doc.name}
          style={{ width:58, height:58, borderRadius:'50%', objectFit:'cover', border:'2.5px solid #dbeafe' }}
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&size=100&background=dbeafe&color=1e40af`; }}
        />
        <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:'#10b981', border:'2px solid #fff' }}/>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:'0.92rem', color:'#0f172a', marginBottom:'0.18rem' }}>{doc.name}</div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:sc.bg, color:sc.color, marginBottom:'0.25rem' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:sc.dot, flexShrink:0 }}/>
          {doc.specialization}
        </span>
        {doc.sub_specialty && <div style={{ fontSize:'0.74rem', color:'#64748b', marginBottom:'0.2rem', lineHeight:1.3 }}>{doc.sub_specialty}</div>}
        <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.71rem', color:'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
            <MapPin size={10}/> {doc.hospital_name}
          </span>
          <span style={{ fontSize:'0.71rem', color:'#94a3b8' }}>·</span>
          <span style={{ fontSize:'0.71rem', color:'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
            <Award size={10}/> {doc.experience}
          </span>
        </div>
      </div>

      <div style={{ flexShrink:0, textAlign:'right', display:'flex', flexDirection:'column', gap:'0.2rem', alignItems:'flex-end', paddingTop:'0.15rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.2rem' }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b"/>
          <span style={{ fontWeight:800, fontSize:'0.85rem', color:'#0f172a' }}>{doc.rating}</span>
          <span style={{ fontSize:'0.68rem', color:'#94a3b8' }}>({(doc.reviews_count||0).toLocaleString()})</span>
        </div>
        <div style={{ fontWeight:900, fontSize:'0.95rem', color:'#0f172a' }}>₹{doc.fee}</div>
        <div style={{ fontSize:'0.65rem', color:'#94a3b8' }}>consult fee</div>
        <div style={{ fontSize:'0.68rem', color:'#10b981', fontWeight:700, background:'#d1fae5', padding:'2px 7px', borderRadius:20, border:'1px solid #a7f3d0' }}>
          {doc.available_dates?.length || 0} dates open
        </div>
      </div>
    </div>
  );
};

// ── Date Cell ─────────────────────────────────────────────────────────────────
const DateCell = ({ d, available, selected, onSelect }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => available && onSelect(d.iso)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={available ? fmtDate(d.iso) : 'Not available'}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        borderRadius:10, padding:'0.5rem 0.2rem', cursor:available ? 'pointer' : 'not-allowed',
        background: selected ? '#2563eb' : available && hov ? '#eff6ff' : available ? '#fff' : '#f8fafc',
        border: `1.5px solid ${selected ? '#2563eb' : available && hov ? '#93c5fd' : available ? '#e2e8f0' : '#f1f5f9'}`,
        opacity: available ? 1 : 0.38,
        transition:'all 0.14s', minWidth:42,
      }}
    >
      {d.isToday && !selected && (
        <div style={{ fontSize:'0.45rem', fontWeight:800, color:'#2563eb', textTransform:'uppercase', letterSpacing:'0.05em', lineHeight:1, marginBottom:1 }}>TODAY</div>
      )}
      <div style={{ fontSize:'1rem', fontWeight:800, color: selected ? '#fff' : available ? '#0f172a' : '#cbd5e1', lineHeight:1.1 }}>{d.day}</div>
      <div style={{ fontSize:'0.58rem', color: selected ? '#bfdbfe' : '#94a3b8', marginTop:'0.08rem' }}>{d.month}</div>
      <div style={{ fontSize:'0.52rem', color: selected ? '#bfdbfe' : '#94a3b8' }}>{d.dow}</div>
      {available && (
        <div style={{ width:5, height:5, borderRadius:'50%', background: selected ? '#bfdbfe' : '#10b981', marginTop:'0.22rem' }}/>
      )}
    </div>
  );
};

// ── Time Slot ─────────────────────────────────────────────────────────────────
const SlotPill = ({ slot, selected, onSelect, booked }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => !booked && onSelect(slot)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:'0.55rem 0.95rem', borderRadius:9, cursor: booked ? 'not-allowed' : 'pointer',
        textAlign:'center', fontSize:'0.82rem', fontWeight:600, transition:'all 0.14s',
        border: `1.5px solid ${selected ? '#2563eb' : booked ? '#f1f5f9' : hov ? '#93c5fd' : '#e2e8f0'}`,
        background: selected ? '#2563eb' : booked ? '#f8fafc' : hov ? '#eff6ff' : '#fff',
        color: selected ? '#fff' : booked ? '#cbd5e1' : '#334155',
        textDecoration: booked ? 'line-through' : 'none',
        opacity: booked ? 0.5 : 1,
        display:'flex', alignItems:'center', gap:4,
      }}
    >
      <Clock size={11} style={{ opacity:0.6 }}/> {slot}
    </div>
  );
};

// ── My Appointments Card ──────────────────────────────────────────────────────
const MyApptCard = ({ appt, onCancel }) => {
  const todayStr = new Date().toISOString().slice(0,10);
  const isPast = appt.appointment_date < todayStr;
  const isCancelled = appt.status === 'Cancelled';
  return (
    <div style={{
      background:'#fff', border:'1.5px solid #e8eef4', borderRadius:14,
      padding:'1rem 1.25rem', display:'flex', gap:'1rem', alignItems:'flex-start',
      boxShadow:'0 1px 4px rgba(15,23,42,0.04)', position:'relative'
    }}>
      <div style={{ flexShrink:0 }}>
        <div style={{ width:46, height:46, borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Stethoscope size={20} color="#2563eb"/>
        </div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#0f172a' }}>{appt.doctor_name || appt.title?.replace('Appointment with ','')}</div>
        <div style={{ fontSize:'0.75rem', color:'#2563eb', fontWeight:600, marginBottom:'0.3rem' }}>{appt.doctor_specialization || appt.details?.split('for ')[1]?.replace('.','')}</div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.75rem', color:'#64748b', display:'flex', alignItems:'center', gap:3 }}>
            <CalendarDays size={11}/> {fmtDateShort(appt.appointment_date || appt.date?.split(' • ')[0])}
          </span>
          <span style={{ fontSize:'0.75rem', color:'#64748b', display:'flex', alignItems:'center', gap:3 }}>
            <Clock size={11}/> {appt.slot_time || appt.date?.split(' • ')[1]}
          </span>
          <span style={{ fontSize:'0.75rem', color:'#64748b', display:'flex', alignItems:'center', gap:3 }}>
            <Building2 size={11}/> {appt.hospital_name || 'Hospital'}
          </span>
        </div>
      </div>
      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:'0.4rem', alignItems:'flex-end' }}>
        <span style={{
          padding:'2px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:700,
          background: isCancelled ? '#fee2e2' : isPast ? '#f1f5f9' : '#d1fae5',
          color: isCancelled ? '#991b1b' : isPast ? '#64748b' : '#065f46',
          border: `1px solid ${isCancelled ? '#fca5a5' : isPast ? '#e2e8f0' : '#a7f3d0'}`
        }}>
          {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}
        </span>
        {!isPast && !isCancelled && appt.appointmentId && (
          <button
            onClick={() => onCancel(appt.appointmentId)}
            style={{ background:'none', border:'1px solid #fca5a5', borderRadius:8, padding:'2px 9px', fontSize:'0.68rem', color:'#dc2626', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const AppointmentBookingView = ({ setActiveTab }) => {
  const { currentUser, token } = useAuth();
  const { hospitals, doctors: ctxDoctors, bookDoctorAppointment, historyList, cancelAppointment } = useHealth();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  const [hospFilter, setHospFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [step, setStep] = useState(1); // 1=pick doctor, 2=pick datetime, 3=confirm
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedInfo, setBookedInfo] = useState(null);
  const [tab, setTab] = useState('book'); // 'book' | 'my'
  const [showFilters, setShowFilters] = useState(false);

  const DATE_GRID = useMemo(() => getUpcoming14Days(), []);

  // ── Fetch doctors ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/doctors`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.length > 0) {
          setDoctors(data.map(d => ({ ...d, fee: d.fee?.toString().replace('₹','') || '800' })));
        } else if (ctxDoctors?.length) {
          setDoctors(ctxDoctors.map(d => ({ ...d, fee: d.fee?.toString().replace('₹','') || '800' })));
        }
        setLoading(false);
      })
      .catch(() => {
        if (ctxDoctors?.length) setDoctors(ctxDoctors.map(d => ({ ...d, fee: d.fee?.toString().replace('₹','') || '800' })));
        setLoading(false);
      });
  }, []);

  // ── Pre-select first available date when doc chosen ──────────────────────
  useEffect(() => {
    if (!selectedDoc) return;
    const avail = selectedDoc.available_dates || [];
    const first = DATE_GRID.find(d => avail.includes(d.iso) && !d.isSunday);
    setSelectedDate(first?.iso || '');
    setSelectedSlot('');
  }, [selectedDoc, DATE_GRID]);

  // ── Slots for chosen date ────────────────────────────────────────────────
  const availableSlots = useMemo(() => {
    if (!selectedDoc || !selectedDate) return [];
    const avail = selectedDoc.available_dates || [];
    if (!avail.includes(selectedDate)) return [];
    return selectedDoc.slots || [];
  }, [selectedDoc, selectedDate]);

  // ── Filtered doctors ─────────────────────────────────────────────────────
  const filteredDocs = useMemo(() => doctors.filter(d => {
    const matchSpec = specFilter === 'All' || d.specialization === specFilter;
    const matchHosp = hospFilter === 'All' || d.hospital_id === hospFilter || d.hospital_name === hospFilter;
    const matchSearch = !search || [d.name, d.specialization, d.sub_specialty, d.hospital_name].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchSpec && matchHosp && matchSearch;
  }), [doctors, specFilter, hospFilter, search]);

  // ── My appointments ──────────────────────────────────────────────────────
  const myAppts = useMemo(() => {
    return (historyList || [])
      .filter(h => h.category === 'appointment')
      .sort((a, b) => {
        const da = a.appointment_date || a.date?.split(' • ')[0] || '';
        const db2 = b.appointment_date || b.date?.split(' • ')[0] || '';
        return db2.localeCompare(da);
      });
  }, [historyList]);

  const upcomingCount = myAppts.filter(a => {
    const d = a.appointment_date || a.date?.split(' • ')[0] || '';
    return d >= new Date().toISOString().slice(0,10) && a.status !== 'Cancelled';
  }).length;

  // ── Book ─────────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!selectedDoc || !selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      // patient_id is derived from JWT on the backend — do NOT send it in body
      const body = {
        doctor_id: selectedDoc.id,
        appointment_date: selectedDate,
        slot_time: selectedSlot,
        notes: `Appointment with ${selectedDoc.name} (${selectedDoc.specialization})`,
      };
      const res = await fetch(`${API}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      const data = res.ok ? await res.json() : null;
      const info = {
        doctorId: selectedDoc.id, doctorName: selectedDoc.name,
        specialization: selectedDoc.specialization, hospitalName: selectedDoc.hospital_name,
        date: selectedDate, time: selectedSlot, fee: selectedDoc.fee,
        avatar: selectedDoc.avatar, status: 'Confirmed',
        appointmentId: data?.id || null,
      };
      bookDoctorAppointment(info);
      setBookedInfo(info);
      setBooked(true);
    } catch (e) {
      console.error('[AppointmentBook]', e);
    } finally {
      setBooking(false);
    }
  };

  const resetBooking = () => {
    setBooked(false); setBookedInfo(null);
    setSelectedDoc(null); setSelectedDate(''); setSelectedSlot('');
    setStep(1);
  };

  // ── CONFIRMATION SCREEN ──────────────────────────────────────────────────
  if (booked && bookedInfo) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'75vh' }}>
        <div style={{
          background:'#fff', borderRadius:24, border:'1px solid #e8eef4',
          padding:'2.5rem 2rem', maxWidth:480, width:'100%', textAlign:'center',
          boxShadow:'0 12px 48px rgba(15,23,42,0.1)'
        }}>
          {/* Success animation */}
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:'linear-gradient(135deg,#d1fae5,#a7f3d0)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 1.25rem', border:'3px solid #6ee7b7',
            boxShadow:'0 0 0 8px rgba(16,185,129,0.08)'
          }}>
            <CheckCircle2 size={36} color="#059669"/>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#d1fae5', color:'#065f46', borderRadius:20, padding:'4px 14px', fontSize:'0.75rem', fontWeight:700, marginBottom:'1rem', border:'1px solid #a7f3d0' }}>
            <Zap size={12}/> Appointment Confirmed
          </div>
          <h2 style={{ fontSize:'1.4rem', fontWeight:900, color:'#0f172a', margin:'0 0 0.4rem' }}>You're all set!</h2>
          <p style={{ fontSize:'0.875rem', color:'#64748b', margin:'0 0 1.5rem' }}>
            Your appointment has been successfully booked. You'll receive a reminder before your visit.
          </p>

          {/* Summary card */}
          <div style={{ background:'linear-gradient(135deg,#f8faff,#eff6ff)', border:'1.5px solid #dbeafe', borderRadius:16, padding:'1.25rem', textAlign:'left', marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.85rem', marginBottom:'1rem', paddingBottom:'0.85rem', borderBottom:'1px solid #e0eafe' }}>
              <img
                src={bookedInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(bookedInfo.doctorName)}&size=100&background=dbeafe&color=1e40af`}
                alt={bookedInfo.doctorName}
                style={{ width:50, height:50, borderRadius:'50%', objectFit:'cover', border:'2px solid #dbeafe' }}
                onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(bookedInfo.doctorName)}&size=100&background=dbeafe&color=1e40af`}
              />
              <div>
                <div style={{ fontWeight:800, color:'#0f172a', fontSize:'0.95rem' }}>{bookedInfo.doctorName}</div>
                <div style={{ fontSize:'0.78rem', color:'#2563eb', fontWeight:600 }}>{bookedInfo.specialization}</div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontWeight:900, fontSize:'1rem', color:'#0f172a' }}>₹{bookedInfo.fee}</div>
                <div style={{ fontSize:'0.65rem', color:'#94a3b8' }}>consult fee</div>
              </div>
            </div>
            {[
              ['Hospital', bookedInfo.hospitalName, <Building2 size={13}/>],
              ['Date', fmtDate(bookedInfo.date), <CalendarDays size={13}/>],
              ['Time', bookedInfo.time + ' IST', <Clock size={13}/>],
              ['Status', 'Confirmed', <Shield size={13}/>],
            ].map(([k,v,icon]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.82rem', padding:'0.3rem 0', borderBottom:'1px solid #f0f5ff' }}>
                <span style={{ color:'#64748b', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>{icon} {k}</span>
                <span style={{ color:'#0f172a', fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={() => { setTab('my'); setBooked(false); setBookedInfo(null); }}>
              <Calendar size={14}/> View My Appointments
            </button>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={resetBooking}>
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statsBar = (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.65rem', marginBottom:'1rem' }}>
      {[
        { icon:<Building2 size={16} color="#2563eb"/>, val:(hospitals||[]).length, label:'Hospitals', bg:'#eff6ff', border:'#bfdbfe' },
        { icon:<Users size={16} color="#7c3aed"/>, val:doctors.length, label:'Specialists', bg:'#f5f3ff', border:'#ddd6fe' },
        { icon:<Activity size={16} color="#059669"/>, val:doctors.reduce((a,d)=>(a+(d.available_dates?.length||0)),0), label:'Open Dates', bg:'#f0fdf4', border:'#a7f3d0' },
        { icon:<CalendarDays size={16} color="#d97706"/>, val:upcomingCount, label:'My Upcoming', bg:'#fffbeb', border:'#fde68a' },
      ].map(({icon,val,label,bg,border}) => (
        <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'0.75rem 1rem', textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.3rem' }}>{icon}</div>
          <div style={{ fontWeight:900, fontSize:'1.1rem', color:'#0f172a' }}>{val}</div>
          <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0', height:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:900, color:'#0f172a', margin:'0 0 0.15rem', letterSpacing:'-0.3px' }}>
            Book Appointment
          </h1>
          <div style={{ fontSize:'0.8rem', color:'#64748b' }}>
            Connect with top specialists across 12 premium hospitals in Hyderabad
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button
            onClick={() => setTab('book')}
            style={{ padding:'0.5rem 1rem', borderRadius:20, border:'1.5px solid', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              background: tab==='book' ? '#2563eb' : '#fff',
              color: tab==='book' ? '#fff' : '#64748b',
              borderColor: tab==='book' ? '#2563eb' : '#e2e8f0'
            }}
          >
            <CalendarDays size={13} style={{ marginRight:5 }}/> Book New
          </button>
          <button
            onClick={() => setTab('my')}
            style={{ padding:'0.5rem 1rem', borderRadius:20, border:'1.5px solid', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', position:'relative',
              background: tab==='my' ? '#0f172a' : '#fff',
              color: tab==='my' ? '#fff' : '#64748b',
              borderColor: tab==='my' ? '#0f172a' : '#e2e8f0'
            }}
          >
            <Calendar size={13} style={{ marginRight:5 }}/> My Appointments
            {upcomingCount > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', fontSize:'0.6rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' }}>{upcomingCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── MY APPOINTMENTS TAB ── */}
      {tab === 'my' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
          {statsBar}
          {myAppts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:18, border:'1.5px dashed #e2e8f0' }}>
              <Calendar size={40} color="#cbd5e1" style={{ marginBottom:'0.85rem' }}/>
              <div style={{ fontWeight:700, color:'#94a3b8', fontSize:'1rem', marginBottom:'0.5rem' }}>No appointments yet</div>
              <div style={{ fontSize:'0.82rem', color:'#cbd5e1', marginBottom:'1.25rem' }}>Book your first appointment with a specialist</div>
              <button className="btn btn-primary" onClick={() => setTab('book')}>Book an Appointment</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'0.8rem', color:'#64748b', fontWeight:600 }}>{myAppts.length} appointment{myAppts.length !== 1 ? 's' : ''} total · {upcomingCount} upcoming</div>
              {myAppts.map((a,i) => (
                <MyApptCard
                  key={a.id || i}
                  appt={a}
                  onCancel={(id) => cancelAppointment(id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── BOOK TAB ── */}
      {tab === 'book' && (
        <>
          {statsBar}

          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem', padding:'1rem 1.25rem', background:'#fff', borderRadius:14, border:'1px solid #e8eef4', boxShadow:'0 1px 4px rgba(15,23,42,0.04)' }}>
            <StepDot n={1} active={step===1} done={step>1} label="Choose Doctor"/>
            <StepLine done={step>1}/>
            <StepDot n={2} active={step===2} done={step>2} label="Date & Time"/>
            <StepLine done={step>2}/>
            <StepDot n={3} active={step===3} done={false} label="Confirm"/>
          </div>

          {/* STEP 1: Doctor selection */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {/* Search bar */}
              <div style={{ display:'flex', gap:'0.6rem' }}>
                <div style={{ position:'relative', flex:1 }}>
                  <Search size={15} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                  <input
                    className="input-field"
                    placeholder="Search by doctor name, specialty, or hospital..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft:'2.4rem', height:42, fontSize:'0.85rem' }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(f=>!f)}
                  style={{ height:42, padding:'0 1rem', borderRadius:10, border:`1.5px solid ${showFilters ? '#2563eb' : '#e2e8f0'}`, background: showFilters ? '#eff6ff' : '#fff', color: showFilters ? '#2563eb' : '#475569', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}
                >
                  <Filter size={14}/> Filter {showFilters ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                </button>
                <button onClick={() => { setSearch(''); setSpecFilter('All'); setHospFilter('All'); }} title="Reset filters" style={{ width:42, height:42, border:'1.5px solid #e2e8f0', borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8' }}>
                  <RefreshCw size={14}/>
                </button>
              </div>

              {/* Specialty tabs */}
              <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                {SPECIALTY_TABS.map(s => {
                  const sc = s === 'All' ? null : specStyle(s);
                  const active = specFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSpecFilter(s)}
                      style={{
                        padding:'0.3rem 0.75rem', fontSize:'0.75rem', fontWeight:700, borderRadius:20, border:'1.5px solid',
                        background: active ? (sc?.bg || '#2563eb') : '#fff',
                        color: active ? (sc?.color || '#fff') : '#475569',
                        borderColor: active ? (sc?.dot || '#2563eb') : '#e2e8f0',
                        cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'all 0.12s'
                      }}
                    >
                      {s === 'All' ? `All (${doctors.length})` : s}
                    </button>
                  );
                })}
              </div>

              {/* Hospital filter */}
              {showFilters && (
                <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', padding:'0.75rem 1rem', background:'#f8fafc', borderRadius:12, border:'1px solid #e8eef4' }}>
                  <div style={{ width:'100%', fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.35rem' }}>Filter by Hospital</div>
                  {['All', ...(hospitals||[]).map(h=>h.id)].map(hid => {
                    const hosp = hid === 'All' ? null : (hospitals||[]).find(h=>h.id===hid);
                    const active = hospFilter === hid;
                    return (
                      <button
                        key={hid}
                        onClick={() => setHospFilter(hid)}
                        style={{
                          padding:'0.3rem 0.75rem', fontSize:'0.74rem', fontWeight:700, borderRadius:20, border:'1.5px solid',
                          background: active ? '#0f172a' : '#fff',
                          color: active ? '#fff' : '#334155',
                          borderColor: active ? '#0f172a' : '#e2e8f0',
                          cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                          display:'flex', alignItems:'center', gap:'0.3rem'
                        }}
                      >
                        {hid === 'All' ? 'All Hospitals' : hosp?.name?.split(' ')[0]}
                        {hosp && <span style={{ opacity:0.6, fontSize:'0.65rem' }}>{hosp.rating}★</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Results header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:'0.82rem', color:'#64748b', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                  <Building2 size={14} color="#2563eb"/>
                  {filteredDocs.length} specialist{filteredDocs.length !== 1 ? 's' : ''} found
                  {specFilter !== 'All' && ` · ${specFilter}`}
                </div>
                {specFilter !== 'All' && (
                  <button onClick={() => setSpecFilter('All')} style={{ background:'none', border:'none', color:'#2563eb', fontSize:'0.79rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    View All
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8' }}>
                  <Loader2 size={32} style={{ animation:'spin 1s linear infinite', marginBottom:'0.75rem' }}/>
                  <div style={{ fontSize:'0.875rem', fontWeight:600 }}>Loading specialists…</div>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'3.5rem', background:'#fff', borderRadius:16, border:'1.5px dashed #e2e8f0' }}>
                  <Search size={36} color="#cbd5e1" style={{ marginBottom:'0.75rem' }}/>
                  <div style={{ fontWeight:700, color:'#94a3b8', marginBottom:'0.4rem' }}>No doctors match your filters</div>
                  <button className="btn btn-outline" style={{ marginTop:'0.75rem', fontSize:'0.82rem' }} onClick={() => { setSearch(''); setSpecFilter('All'); setHospFilter('All'); }}>
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.55rem' }}>
                  {filteredDocs.map(doc => (
                    <DoctorCard
                      key={doc.id} doc={doc}
                      selected={selectedDoc?.id === doc.id}
                      onClick={d => { setSelectedDoc(d); setStep(2); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Date & Time */}
          {step === 2 && selectedDoc && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1rem', alignItems:'start' }}>

              {/* Left: doctor summary + date/time */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>

                {/* Selected doctor mini-card */}
                <div style={{ display:'flex', gap:'0.85rem', alignItems:'center', padding:'0.85rem 1.1rem', background:'linear-gradient(135deg,#eff6ff,#f0f9ff)', border:'1.5px solid #bfdbfe', borderRadius:14 }}>
                  <button onClick={() => { setSelectedDoc(null); setStep(1); }} style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #bfdbfe', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                    <ArrowLeft size={14} color="#2563eb"/>
                  </button>
                  <img
                    src={selectedDoc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoc.name)}&size=100&background=dbeafe&color=1e40af`}
                    alt={selectedDoc.name}
                    style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid #dbeafe', flexShrink:0 }}
                    onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoc.name)}&size=100&background=dbeafe&color=1e40af`}
                  />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:'0.92rem', color:'#0f172a' }}>{selectedDoc.name}</div>
                    <div style={{ fontSize:'0.76rem', color:'#2563eb', fontWeight:700 }}>{selectedDoc.specialization} · {selectedDoc.hospital_name}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ fontWeight:900, fontSize:'1rem', color:'#0f172a' }}>₹{selectedDoc.fee}</div>
                    <div style={{ fontSize:'0.65rem', color:'#94a3b8' }}>consult fee</div>
                  </div>
                </div>

                {/* Date picker */}
                <div style={{ background:'#fff', border:'1px solid #e8eef4', borderRadius:14, padding:'1.1rem 1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.85rem' }}>
                    <span style={{ fontWeight:800, fontSize:'0.88rem', color:'#0f172a', display:'flex', alignItems:'center', gap:6 }}>
                      <CalendarDays size={16} color="#2563eb"/> Select Date
                    </span>
                    <div style={{ display:'flex', gap:'0.6rem', fontSize:'0.68rem', color:'#64748b' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', display:'inline-block' }}/> Available
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:'#e2e8f0', display:'inline-block' }}/> Unavailable
                      </span>
                    </div>
                  </div>
                  {selectedDate && (
                    <div style={{ fontSize:'0.78rem', color:'#2563eb', fontWeight:700, marginBottom:'0.6rem', background:'#eff6ff', padding:'0.4rem 0.75rem', borderRadius:8, border:'1px solid #bfdbfe', display:'inline-flex', alignItems:'center', gap:5 }}>
                      <CheckCircle2 size={12}/> {fmtDate(selectedDate)}
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'0.3rem' }}>
                    {DATE_GRID.map(d => (
                      <DateCell
                        key={d.iso} d={d}
                        available={(selectedDoc.available_dates || []).includes(d.iso) && !d.isSunday}
                        selected={selectedDate === d.iso}
                        onSelect={date => { setSelectedDate(date); setSelectedSlot(''); }}
                      />
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                <div style={{ background:'#fff', border:'1px solid #e8eef4', borderRadius:14, padding:'1.1rem 1.25rem' }}>
                  <div style={{ fontWeight:800, fontSize:'0.88rem', color:'#0f172a', marginBottom:'0.8rem', display:'flex', alignItems:'center', gap:6 }}>
                    <Clock size={16} color="#2563eb"/> Available Time Slots (IST)
                    {availableSlots.length > 0 && (
                      <span style={{ fontSize:'0.7rem', color:'#64748b', fontWeight:500 }}>
                        {availableSlots.length} slots
                      </span>
                    )}
                  </div>
                  {!selectedDate ? (
                    <div style={{ color:'#94a3b8', fontSize:'0.82rem', fontStyle:'italic', textAlign:'center', padding:'1rem' }}>
                      Please select a date first
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ color:'#94a3b8', fontSize:'0.82rem', fontStyle:'italic', textAlign:'center', padding:'1rem' }}>
                      No slots available on this date. Please select another date.
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:'0.5rem' }}>
                      {availableSlots.map(s => (
                        <SlotPill key={s} slot={s} selected={selectedSlot === s} onSelect={setSelectedSlot} booked={false}/>
                      ))}
                    </div>
                  )}
                </div>

                {/* Proceed to confirm */}
                <button
                  onClick={() => selectedDate && selectedSlot && setStep(3)}
                  disabled={!selectedDate || !selectedSlot}
                  style={{
                    padding:'0.9rem', borderRadius:12, border:'none', fontSize:'0.92rem', fontWeight:800,
                    background: selectedDate && selectedSlot ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e2e8f0',
                    color: selectedDate && selectedSlot ? '#fff' : '#94a3b8',
                    cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
                    fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    boxShadow: selectedDate && selectedSlot ? '0 4px 15px rgba(37,99,235,0.3)' : 'none',
                    transition:'all 0.15s'
                  }}
                >
                  Continue to Confirm <ChevronRight size={16}/>
                </button>
              </div>

              {/* Right: doctor info sidebar */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', position:'sticky', top:'1rem' }}>
                <div style={{ background:'#fff', border:'1px solid #e8eef4', borderRadius:14, padding:'1.25rem', boxShadow:'0 2px 8px rgba(15,23,42,0.05)' }}>
                  <div style={{ fontWeight:800, fontSize:'0.85rem', color:'#0f172a', marginBottom:'1rem', display:'flex', alignItems:'center', gap:5 }}>
                    <Stethoscope size={15} color="#2563eb"/> Doctor Profile
                  </div>
                  <img
                    src={selectedDoc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoc.name)}&size=120&background=dbeafe&color=1e40af`}
                    alt={selectedDoc.name}
                    style={{ width:'100%', height:140, objectFit:'cover', objectPosition:'top', borderRadius:12, marginBottom:'0.85rem', border:'2px solid #e0e7ff' }}
                    onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoc.name)}&size=120&background=dbeafe&color=1e40af`}
                  />
                  <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0f172a', marginBottom:'0.25rem' }}>{selectedDoc.name}</div>
                  <div style={{ fontSize:'0.78rem', color:'#2563eb', fontWeight:700, marginBottom:'0.5rem' }}>{selectedDoc.specialization}</div>
                  {selectedDoc.sub_specialty && <div style={{ fontSize:'0.73rem', color:'#64748b', marginBottom:'0.75rem' }}>{selectedDoc.sub_specialty}</div>}
                  {[
                    [<Award size={12}/>, selectedDoc.experience + ' experience'],
                    [<Star size={12} fill="#f59e0b" color="#f59e0b"/>, `${selectedDoc.rating} · ${(selectedDoc.reviews_count||0).toLocaleString()} reviews`],
                    [<MapPin size={12}/>, selectedDoc.hospital_name],
                    [<CreditCard size={12}/>, `₹${selectedDoc.fee} consultation fee`],
                  ].map(([icon,txt],i) => (
                    <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', fontSize:'0.78rem', color:'#475569', marginBottom:'0.35rem' }}>
                      <div style={{ flexShrink:0, color:'#94a3b8', marginTop:1 }}>{icon}</div> {txt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && selectedDoc && selectedDate && selectedSlot && (
            <div style={{ maxWidth:520, margin:'0 auto', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <button onClick={() => setStep(2)} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'none', border:'none', color:'#2563eb', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start' }}>
                <ArrowLeft size={14}/> Back to Date & Time
              </button>

              <div style={{ background:'linear-gradient(135deg,#f8faff,#eff6ff)', border:'1.5px solid #bfdbfe', borderRadius:20, padding:'1.75rem', boxShadow:'0 4px 24px rgba(37,99,235,0.08)' }}>
                <div style={{ fontWeight:900, fontSize:'1.05rem', color:'#0f172a', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:6 }}>
                  <Shield size={18} color="#2563eb"/> Booking Summary
                </div>

                <div style={{ display:'flex', gap:'1rem', alignItems:'center', marginBottom:'1.25rem', paddingBottom:'1.1rem', borderBottom:'1.5px solid #dbeafe' }}>
                  <img
                    src={selectedDoc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoc.name)}&size=100&background=dbeafe&color=1e40af`}
                    alt={selectedDoc.name}
                    style={{ width:60, height:60, borderRadius:'50%', objectFit:'cover', border:'2.5px solid #bfdbfe' }}
                    onError={e => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoc.name)}&size=100&background=dbeafe&color=1e40af`}
                  />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:'1rem', color:'#0f172a' }}>{selectedDoc.name}</div>
                    <div style={{ fontSize:'0.8rem', color:'#2563eb', fontWeight:700 }}>{selectedDoc.specialization}</div>
                    <div style={{ fontSize:'0.73rem', color:'#64748b' }}>{selectedDoc.sub_specialty}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:900, fontSize:'1.15rem', color:'#0f172a' }}>₹{selectedDoc.fee}</div>
                    <div style={{ fontSize:'0.65rem', color:'#94a3b8' }}>consultation fee</div>
                  </div>
                </div>

                {[
                  [<Building2 size={14} color="#2563eb"/>, 'Hospital', selectedDoc.hospital_name],
                  [<CalendarDays size={14} color="#2563eb"/>, 'Date', fmtDate(selectedDate)],
                  [<Clock size={14} color="#2563eb"/>, 'Time', selectedSlot + ' IST'],
                  [<Users size={14} color="#2563eb"/>, 'Patient', currentUser?.full_name || currentUser?.name || 'Patient'],
                ].map(([icon,k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', fontSize:'0.85rem', padding:'0.5rem 0', borderBottom:'1px solid #e0eafe' }}>
                    <span style={{ color:'#64748b', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>{icon} {k}</span>
                    <span style={{ color:'#0f172a', fontWeight:700, textAlign:'right', maxWidth:200, lineHeight:1.35 }}>{v}</span>
                  </div>
                ))}

                <div style={{ background:'#fff', border:'1px solid #bfdbfe', borderRadius:12, padding:'0.85rem', marginTop:'1.1rem', display:'flex', alignItems:'flex-start', gap:'0.6rem' }}>
                  <AlertCircle size={15} color="#2563eb" style={{ flexShrink:0, marginTop:1 }}/>
                  <div style={{ fontSize:'0.76rem', color:'#64748b', lineHeight:1.5 }}>
                    Please arrive 10 minutes before your appointment. Carry a valid ID and any previous medical records for reference.
                  </div>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={booking}
                style={{
                  padding:'1rem', borderRadius:14, border:'none', fontSize:'1rem', fontWeight:900,
                  background: booking ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  color: booking ? '#94a3b8' : '#fff',
                  cursor: booking ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: booking ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
                  transition:'all 0.15s', letterSpacing:'-0.01em'
                }}
              >
                {booking
                  ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Confirming your appointment…</>
                  : <><CheckCircle2 size={18}/> Confirm Appointment · ₹{selectedDoc.fee}</>
                }
              </button>

              <button
                onClick={resetBooking}
                style={{ background:'none', border:'none', color:'#94a3b8', fontSize:'0.8rem', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}
              >
                Cancel & start over
              </button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};
