import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { HOSPITALS_DATABASE, DOCTORS_DATABASE } from '../data/hospitalsData';
import { useAuth } from './AuthContext';

const HealthContext = createContext(null);

const INITIAL_HEALTH_TRENDS = [
  { date: '11 Aug', steps: 6800, sleep: 7.2, heartRate: 74 },
  { date: '12 Aug', steps: 8200, sleep: 6.8, heartRate: 76 },
  { date: '13 Aug', steps: 5900, sleep: 7.5, heartRate: 71 },
  { date: '14 Aug', steps: 7400, sleep: 7.0, heartRate: 73 },
  { date: '15 Aug', steps: 8900, sleep: 8.0, heartRate: 70 },
  { date: '16 Aug', steps: 6400, sleep: 7.1, heartRate: 72 },
  { date: '17 Aug', steps: 6432, sleep: 7.25, heartRate: 72 }
];

export const HealthProvider = ({ children }) => {
  const { currentUser, token } = useAuth();

  const [hospitals, setHospitals] = useState(HOSPITALS_DATABASE || []);
  const [doctors, setDoctors] = useState(DOCTORS_DATABASE || []);
  const [healthTrends] = useState(INITIAL_HEALTH_TRENDS);

  // Fetch live hospitals and doctors from PostgreSQL
  useEffect(() => {
    fetch('http://localhost:8000/hospitals')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.length > 0) setHospitals(data); })
      .catch(() => {});
    fetch('http://localhost:8000/doctors')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.length > 0) setDoctors(data); })
      .catch(() => {});
  }, []);

  const [reports,               setReports]               = useState([]);
  const [historyList,           setHistoryList]           = useState([]);
  const [prescriptions,         setPrescriptions]         = useState([]);
  const [consultationSummaries, setConsultationSummaries] = useState([]);
  const [reminders,             setReminders]             = useState([]);

  const [vitals] = useState({
    healthScore: 82, stepsToday: 6432, stepsGoal: 10000,
    sleepHours: '7h 15m', sleepStatus: 'Good', heartRate: 72, heartRateStatus: 'Normal'
  });

  const [consultationMode, setConsultationMode] = useState('text');
  const [chatMessages,     setChatMessages]     = useState([]);
  const [questionStep,     setQuestionStep]     = useState(2);
  const [selectedSeverity, setSelectedSeverity] = useState('Moderate');
  const [doctorNotes,      setDoctorNotes]      = useState('');
  const [selectedDoctor,   setSelectedDoctor]   = useState(DOCTORS_DATABASE?.[0] || null);

  // Build auth headers helper
  const authHeaders = (extra = {}) => ({
    ...extra,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  });

  // ── Load user-specific records ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) {
      setReports([]); setHistoryList([]); setReminders([]);
      setPrescriptions([]); setConsultationSummaries([]);
      return;
    }

    const storageKey = `ai_healthverse_records_u${currentUser.id}`;

    // 1. Load reminders from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
        let loadedReminders = parsed.reminders || [];
        loadedReminders = loadedReminders.map(rem => {
          if (!rem.completed) {
            const ts = rem.id && rem.id.startsWith('rem-')
              ? parseInt(rem.id.split('-')[1], 10)
              : (rem.createdAt ? new Date(rem.createdAt).getTime() : now);
            if (ts && now - ts > FIVE_DAYS_MS) return { ...rem, completed: true };
          }
          return rem;
        });
        setReminders(loadedReminders);
      }
    } catch (e) {}

    // 2. Fetch records from backend (with auth token)
    fetch(`http://localhost:8000/records/${currentUser.id}`, {
      headers: authHeaders()
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const rep = [], cons = [], rx = [], hist = [];
        data.forEach(r => {
          const base = { ...r.content, id: `db-${r.id}`, db_timestamp: r.timestamp };
          if (r.record_type === 'report') {
            rep.push(base);
            hist.push({ id: base.id, dedupKey: `report-${r.id}`, category: 'report', title: base.fileName || 'Lab Report', date: (base.date && base.time) ? `${base.date} • ${base.time}` : 'Recent', actionText: 'View Report', details: base.summary || 'Lab report processed via OCR.', summary: base.summary, triageRecommendation: base.triageRecommendation, testResults: base.testResults, labName: base.labName });
          } else if (r.record_type === 'consultation') {
            cons.push(base);
            hist.push({ id: base.id, dedupKey: `cons-${r.id}`, category: 'consultation', title: base.diagnosis || base.summary || 'AI Consultation', date: (base.date && base.time) ? `${base.date} • ${base.time}` : 'Recent', actionText: 'View Details', details: base.reasoning || 'Consultation complete', triageType: base.triageType });
          } else if (r.record_type === 'prescription') {
            rx.push(base);
            hist.push({ id: base.id, dedupKey: `rx-${r.id}`, category: 'prescription', title: base.drug || 'Prescription', date: base.date || 'Recent', actionText: 'View Details', details: base.notes || 'Prescribed medication' });
          }
        });

        setReports(rep);
        setConsultationSummaries(cons);
        const now = Date.now();
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
        setPrescriptions(rx.map(p => {
          if (p.status === 'Active') {
            const ts = new Date(p.db_timestamp).getTime();
            if (ts && now - ts > FIVE_DAYS_MS) return { ...p, status: 'Completed' };
          }
          return p;
        }));
        setHistoryList(prev => {
          const existingKeys = new Set(prev.map(h => h.dedupKey));
          const toAdd = hist.filter(h => !existingKeys.has(h.dedupKey));
          return [...toAdd, ...prev];
        });
      })
      .catch(e => console.error('Error fetching records:', e));

    // 3. Fetch appointments from backend (with auth token)
    fetch(`http://localhost:8000/appointments/patient/${currentUser.id}`, {
      headers: authHeaders()
    })
      .then(res => res.ok ? res.json() : [])
      .then(appts => {
        if (!appts || appts.length === 0) return;
        const todayStr = new Date().toISOString().slice(0, 10);
        const newEntries = appts.map(a => {
          const dedupKey = `apt-${a.doctor_id}-${a.appointment_date}-${a.slot_time}`;
          const isPast = a.appointment_date < todayStr;
          return { id: dedupKey, dedupKey, category: 'appointment', title: `Appointment with ${a.doctor_name}`, date: `${a.appointment_date} • ${a.slot_time}`, actionText: 'View Summary', details: `${isPast ? 'Past' : 'Upcoming'} appointment at ${a.hospital_name || 'Hospital'} for ${a.doctor_specialization}.`, status: a.status, isPast, appointmentId: a.id, doctorId: a.doctor_id };
        });
        if (newEntries.length > 0) {
          setHistoryList(prev => {
            const stateKeys = new Set(prev.filter(h => h.category === 'appointment').map(h => h.dedupKey || h.id));
            const toAdd = newEntries.filter(e => !stateKeys.has(e.dedupKey));
            return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
          });
        }
      })
      .catch(() => {});
  }, [currentUser?.id, token]);

  // ── Persist to localStorage ───────────────────────────────────────────────
  useEffect(() => {
    if (currentUser?.id) {
      const storageKey = `ai_healthverse_records_u${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ reports, historyList, reminders, prescriptions, consultationSummaries }));
    }
  }, [reports, historyList, reminders, prescriptions, consultationSummaries, currentUser?.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  const removeReminder  = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  const addReminder = (titleOrObj, subtitle = '', icon = 'pill') => {
    const base = typeof titleOrObj === 'object' && titleOrObj !== null
      ? { title: titleOrObj.title || 'Reminder', subtitle: titleOrObj.dosage ? `${titleOrObj.dosage} • ${titleOrObj.time || 'Daily'}` : (titleOrObj.time || 'Daily'), icon: titleOrObj.icon || 'pill' }
      : { title: titleOrObj, subtitle, icon };
    const nr = { id: `rem-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ...base, completed: false, createdAt: new Date().toISOString() };
    setReminders(prev => {
      const exists = prev.some(r => r.title === nr.title && r.subtitle === nr.subtitle);
      return exists ? prev : [nr, ...prev];
    });
  };

  const addReport = (newReport) => {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const now = new Date();
    const enriched = {
      ...newReport, id: reportId, uploadedAt: now.toISOString(),
      date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      fileName: newReport.fileName || newReport.title || 'Lab Report',
      summary: newReport.summary || '', triageRecommendation: newReport.triageRecommendation || 'N/A',
      testResults: newReport.testResults || [], aiExplanation: newReport.aiExplanation || [],
      labName: newReport.labName || '', patientContext: newReport.patientContext || ''
    };
    setReports(prev => [enriched, ...prev]);
    setHistoryList(prev => [{ id: reportId, dedupKey: reportId, category: 'report', title: enriched.fileName, date: `${enriched.date} • ${enriched.time}`, uploadedAt: enriched.uploadedAt, actionText: 'View Report', details: enriched.summary || 'Lab report processed via OCR.', summary: enriched.summary, triageRecommendation: enriched.triageRecommendation, testResults: enriched.testResults, labName: enriched.labName }, ...prev]);
    if (currentUser?.id) {
      fetch('http://localhost:8000/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ patient_id: currentUser.id, record_type: 'report', content: enriched })
      }).catch(() => {});
    }
  };

  const addPrescription = (rx) => {
    const newRx = {
      id: `rx-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      drug: rx.drug || rx.name || 'Unknown medication',
      dosage: rx.dosage || 'As prescribed',
      frequency: rx.frequency || 'As directed',
      duration: rx.duration || 'As advised',
      doctorName: rx.doctorName || 'Dr. HealthVerse AI',
      specialty: rx.specialty || 'General Physician',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Active',
      notes: rx.notes || ''
    };
    setPrescriptions(prev => {
      const exists = prev.some(p => p.drug?.toLowerCase() === newRx.drug?.toLowerCase() && p.status === 'Active');
      return exists ? prev : [newRx, ...prev];
    });
    setHistoryList(prev => [{
      id: newRx.id, dedupKey: newRx.id, category: 'prescription',
      title: newRx.drug,
      date: `Today • ${newRx.dosage} • ${newRx.frequency}`,
      actionText: 'View Medications',
      details: `Prescribed by ${newRx.doctorName} • ${newRx.specialty}. Duration: ${newRx.duration}.`
    }, ...prev]);
    if (currentUser?.id) {
      fetch('http://localhost:8000/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ patient_id: currentUser.id, record_type: 'prescription', content: newRx })
      }).catch(() => {});
    }
  };

  const addConsultationRecord = (data) => {
    const id = `consult-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const summary = {
      id,
      diagnosis: data.diagnosis || data.summary || 'Consultation completed',
      reasoning: data.reasoning || '',
      doctorSpecialty: data.doctorSpecialty || 'General Physician',
      tests: data.tests || [],
      medicationTips: data.medicationTips || [],
      dietaryAdvice: data.dietaryAdvice || '',
      doctorInstructions: data.doctorInstructions || '',
      triageType: data.triageType || 'LOW_CONCERN',
      date: dateStr,
      time: timeStr
    };
    setConsultationSummaries(prev => [summary, ...prev]);
    setHistoryList(prev => [{
      id, dedupKey: id, category: 'consultation',
      title: summary.diagnosis,
      date: `${dateStr} • ${timeStr}`,
      actionText: 'View Details',
      details: summary.doctorSpecialty +
        (summary.tests?.length ? ` • Tests: ${summary.tests.slice(0,2).join(', ')}` : '') +
        (summary.reasoning ? ` — ${summary.reasoning.slice(0, 80)}` : ''),
      consultId: id,
      triageType: summary.triageType
    }, ...prev]);
    if (currentUser?.id) {
      fetch('http://localhost:8000/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ patient_id: currentUser.id, record_type: 'consultation', content: summary })
      }).catch(() => {});
    }

    // Auto-add medications — LLM uses ' -- ' as separator (support both '--' and '—')
    (data.medicationTips || []).forEach(tip => {
      const sep = tip.includes(' -- ') ? ' -- ' : (tip.includes('—') ? '—' : '--');
      const parts = tip.split(sep).map(s => s.trim());
      const nameAndDose = parts[0] || tip;
      const freqPart    = parts[1] || 'As directed';
      const timingPart  = parts[2] || '';
      const durationPart = parts[3] || 'As advised';
      // Extract drug name and dose (e.g. "Paracetamol 500MG")
      const doseMatch = nameAndDose.match(/^([\w\s-]+?)\s+(\d[\d.,]*\s*(?:MG|mg|IU|mcg|ml|g))/i);
      const drug   = doseMatch ? doseMatch[1].trim() : nameAndDose.trim();
      const dosage = doseMatch ? doseMatch[2].trim() : 'As prescribed';
      addPrescription({
        drug, dosage,
        frequency: timingPart ? `${freqPart} • ${timingPart}` : freqPart,
        duration: durationPart,
        doctorName: 'Dr. HealthVerse AI',
        specialty: data.doctorSpecialty || 'General Physician',
        notes: tip
      });
      addReminder(`💊 Take ${drug}`, `${dosage} — ${freqPart}${timingPart ? ' — ' + timingPart : ''}`, 'pill');
    });

    (data.reminderList || data.reminders || []).forEach(rem => {
      if (!rem || typeof rem !== 'string') return;
      const isTimedMedication = rem.includes('Take') || rem.includes('take');
      const isHydration = rem.toLowerCase().includes('water') || rem.toLowerCase().includes('drink');
      const isSleep = rem.toLowerCase().includes('sleep') || rem.toLowerCase().includes('rest');
      const isMonitor = rem.toLowerCase().includes('temperature') || rem.toLowerCase().includes('check') || rem.toLowerCase().includes('monitor');
      const icon = isTimedMedication ? 'pill' : isHydration ? 'water' : isSleep ? 'sleep' : isMonitor ? 'monitor' : 'calendar';
      const timeMatch = rem.match(/⏰\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[—\-]\s*(.+)/i);
      const title = timeMatch ? timeMatch[2].trim().split(/[—\-]/)[0].trim() : rem.replace(/^⏰\s*/, '').split(/[—\-]/)[0].trim();
      const subtitle = timeMatch ? timeMatch[1] : 'Daily';
      addReminder(title.slice(0, 60), subtitle, icon);
    });

    if (data.dietaryAdvice) addReminder('🥗 Diet Advice', data.dietaryAdvice.slice(0, 80), 'steps');
    if (summary.triageType === 'DOCTOR_NEEDED' && data.doctorSpecialty) {
      addReminder(
        `🏥 Book ${data.doctorSpecialty} appointment`,
        data.doctorInstructions ? data.doctorInstructions.slice(0, 80) : 'Specialist consultation required',
        'calendar'
      );
    }
  };

  const bookDoctorAppointment = (aptData) => {
    const k = `apt-${aptData.doctorId || 'doc'}-${aptData.date}-${aptData.time}`.replace(/\s/g, '_');
    const rec = {
      id: k, dedupKey: k,
      doctorId: aptData.doctorId || 'doc-unknown',
      doctorName: aptData.doctorName || 'Specialist Doctor',
      specialization: aptData.specialization || 'Consultant',
      hospitalName: aptData.hospitalName || 'Super Speciality Hospital',
      date: aptData.date || 'Tomorrow',
      time: aptData.time || '10:00 AM',
      status: 'Confirmed',
      appointmentId: aptData.appointmentId || null,
      avatar: aptData.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
    };
    setHistoryList(prev => {
      const newEntry = {
        id: rec.id, dedupKey: rec.dedupKey, category: 'appointment',
        title: `Appointment with ${rec.doctorName}`,
        date: `${rec.date} • ${rec.time}`,
        actionText: 'View Summary',
        details: `Confirmed appointment at ${rec.hospitalName} for ${rec.specialization}.`,
        status: 'Confirmed',
        appointmentId: rec.appointmentId,
        doctorId: rec.doctorId
      };
      const existingIdx = prev.findIndex(h =>
        h.category === 'appointment' && h.status === 'Confirmed' &&
        (h.appointmentId === rec.appointmentId || h.doctorId === rec.doctorId ||
         (h.title && h.title.includes(rec.doctorName)))
      );
      if (existingIdx >= 0) { const next = [...prev]; next[existingIdx] = newEntry; return next; }
      const exists = prev.some(h => h.category === 'appointment' && (h.dedupKey === rec.dedupKey || h.id === rec.id));
      return exists ? prev : [newEntry, ...prev];
    });
    addReminder(`📅 Apt: ${rec.doctorName}`, `${rec.date} at ${rec.time}`, 'calendar');
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await fetch(`http://localhost:8000/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: authHeaders()
      });
    } catch (e) { console.warn('[Cancel]', e); }
    setHistoryList(prev => prev.map(h => h.appointmentId === appointmentId ? { ...h, status: 'Cancelled' } : h));
  };

  // ── Derived: upcoming appointment ─────────────────────────────────────────
  const upcomingAppointment = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1], 10), m = parseInt(match[2], 10);
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const future = historyList
      .filter(h => h.category === 'appointment' && h.status === 'Confirmed')
      .map(h => { const parts = h.date.split(' • '); return { ...h, rawDate: parts[0] || '', rawTime: parts[1] || '' }; })
      .filter(h => h.rawDate >= todayStr);
    if (future.length === 0) return null;
    future.sort((a, b) => { const d = a.rawDate.localeCompare(b.rawDate); return d !== 0 ? d : (parseTime(a.rawTime) - parseTime(b.rawTime)); });
    const soonest = future[0];
    return {
      id: soonest.id, appointmentId: soonest.appointmentId, doctorId: soonest.doctorId,
      doctorName: soonest.title.replace('Appointment with ', ''),
      specialization: soonest.details.split('for ')[1]?.replace('.', '') || 'Specialist',
      hospitalName: soonest.details.split('at ')[1]?.split(' for')[0] || 'Hospital',
      date: soonest.rawDate, time: soonest.rawTime, status: soonest.status,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
    };
  }, [historyList]);

  return (
    <HealthContext.Provider value={{
      hospitals, doctors, selectedDoctor, setSelectedDoctor, healthTrends, vitals,
      reports, addReport,
      historyList, setHistoryList,
      reminders, toggleReminder, addReminder, removeReminder,
      prescriptions, setPrescriptions, addPrescription,
      consultationSummaries, addConsultationRecord,
      upcomingAppointment, bookDoctorAppointment, cancelAppointment,
      consultationMode, setConsultationMode,
      chatMessages, setChatMessages,
      questionStep, setQuestionStep,
      selectedSeverity, setSelectedSeverity,
      doctorNotes, setDoctorNotes
    }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) throw new Error('useHealth must be used within a HealthProvider');
  return context;
};
