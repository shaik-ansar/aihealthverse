import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import { RobotMascot } from '../components/RobotMascot';
import { HistoryModal } from '../components/HistoryModal';
import {
  MessageSquare, Calendar, FileText, Pill,
  UploadCloud, ClipboardList, Bell, Search, ArrowRight,
  ChevronRight, MapPin, Clock
} from 'lucide-react';

const MetricCard = ({ icon, label, count, badge, iconBg, iconColor, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff',
      border: '1px solid #e8eef4',
      borderRadius: 14,
      padding: '1.1rem 1.3rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.9rem',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s, transform 0.15s',
      flex: '1 1 160px',
      minWidth: 0,
      boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.1rem', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
        {count}
        {badge && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.4rem', color: '#10b981', verticalAlign: 'middle' }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  </div>
);

const QuickActionRow = ({ icon, label, onClick, iconColor }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 1rem', borderRadius: 8, border: 'none',
      background: '#f1f5f9', cursor: 'pointer', gap: '0.75rem',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{label}</span>
    </div>
    <ChevronRight size={16} color="#94a3b8" />
  </div>
);

export const PatientDashboardView = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const { consultationSummaries, historyList, reports, prescriptions, upcomingAppointment, cancelAppointment } = useHealth();

  const [modal, setModal] = useState(null);
  const [managingAppt, setManagingAppt] = useState(false);

  const confirmedAppts = (historyList || []).filter(h => h.category === 'appointment' && h.status === 'Confirmed');
  const activeMeds = (prescriptions || []).filter(p => p.status === 'Active');

  const name = currentUser?.name?.split(' ')[0] || 'User';

  const metrics = [
    {
      icon: <MessageSquare size={18} />, label: 'Consultations', iconBg: '#eef2ff', iconColor: '#6366f1',
      count: consultationSummaries.length,
      onClick: () => setModal({ type: 'consultations', data: (historyList || []).filter(h => h.category === 'consultation') })
    },
    {
      icon: <Calendar size={18} />, label: 'Appointments', iconBg: '#ecfdf5', iconColor: '#10b981',
      count: confirmedAppts.length,
      badge: confirmedAppts.length > 0 ? 'Upcoming' : null,
      onClick: () => setActiveTab('appointments')
    },
    {
      icon: <FileText size={18} />, label: 'Reports', iconBg: '#fffbeb', iconColor: '#f59e0b',
      count: reports.length,
      onClick: () => setModal({ type: 'reports', data: (historyList || []).filter(h => h.category === 'report') })
    },
    {
      icon: <Pill size={18} />, label: 'Medications / Plan', iconBg: '#faf5ff', iconColor: '#8b5cf6',
      count: activeMeds.length,
      onClick: () => setModal({ type: 'medications', data: prescriptions })
    },
  ];

  const quickActions = [
    { icon: <UploadCloud size={16} />, label: 'Upload Lab Report',          onClick: () => setActiveTab('reports-upload'), iconColor: '#3b82f6' },
    { icon: <ClipboardList size={16} />, label: 'View Health History',       onClick: () => setActiveTab('records'), iconColor: '#10b981' },
    { icon: <Bell size={16} />, label: 'Wellness Reminders',                 onClick: () => setActiveTab('reminders'), iconColor: '#f59e0b' },
    { icon: <Search size={16} />, label: 'Hospital Directory & Specialists', onClick: () => setActiveTab('appointments'), iconColor: '#8b5cf6' },
  ];

  // Format display date from YYYY-MM-DD
  const fmtDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    } catch { return d; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', maxWidth: '100%' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
          Hello, {name}! 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.2rem 0 0', fontWeight: 400 }}>
          Here's your <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>personal</span> health overview
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Middle Row: AI Banner + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
        {/* AI Consultation Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0eafe 100%)',
          borderRadius: 16,
          padding: '2rem 2rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'space-between',
          border: '1px solid #c7d7f8',
          minHeight: 180,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.2px' }}>
              Start AI Consultation
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1.35rem', lineHeight: 1.55, maxWidth: 260 }}>
              Consult with Dr. HealthVerse via voice or text.<br />
              Receive instant clinical triage &amp; guidance.
            </p>
            <button
              onClick={() => setActiveTab('consultation')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: 10, padding: '0.65rem 1.25rem',
                fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'inherit', letterSpacing: '0.01em',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >
              Start Consultation Now <ArrowRight size={15} />
            </button>
          </div>
          <div style={{ flexShrink: 0, opacity: 0.92 }}>
            <RobotMascot size={120} />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem 1.25rem', border: '1px solid #e8eef4', minWidth: 280, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.85rem' }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {quickActions.map(a => (
              <QuickActionRow key={a.label} {...a} />
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Appointment */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8eef4', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Upcoming Appointment</span>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            View All
          </button>
        </div>

        {upcomingAppointment ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.9rem 1.1rem',
            background: '#f8faff', borderRadius: 12,
            border: '1px solid #e0eafe',
          }}>
            <img
              src={upcomingAppointment.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80&auto=format&fit=crop&q=80'}
              alt={upcomingAppointment.doctorName}
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #dbeafe', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{upcomingAppointment.doctorName}</div>
              <div style={{ fontSize: '0.79rem', color: '#64748b', fontWeight: 500, marginTop: '0.08rem' }}>
                {upcomingAppointment.specialization} • {upcomingAppointment.hospitalName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
                <Clock size={13} color="#3b82f6" />
                <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>
                  {fmtDate(upcomingAppointment.date)} • {upcomingAppointment.time}
                </span>
              </div>
              <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: 20, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                {upcomingAppointment.status}
              </span>
            </div>
            <button
              onClick={() => setManagingAppt(true)}
              style={{
                background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: 10, padding: '0.55rem 1.1rem', fontSize: '0.82rem',
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >
              Manage
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.75rem', background: '#fafbfd', borderRadius: 12, border: '1px solid #f0f3f8' }}>
            <Calendar size={32} color="#cbd5e1" style={{ marginBottom: '0.65rem' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8' }}>No upcoming appointments</div>
            <button
              onClick={() => setActiveTab('appointments')}
              style={{ marginTop: '0.85rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Book Now
            </button>
          </div>
        )}
      </div>

      {/* Manage Appointment Modal */}
      {managingAppt && upcomingAppointment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setManagingAppt(false)}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', margin: '0 0 0.5rem' }}>Manage Appointment</h3>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {upcomingAppointment.doctorName} · {fmtDate(upcomingAppointment.date)} · {upcomingAppointment.time}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setManagingAppt(false); setActiveTab('appointments'); }}>
                Reschedule Appointment
              </button>
              <button
                style={{ width: '100%', background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', borderRadius: 10, padding: '0.7rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={async () => {
                  if (upcomingAppointment.appointmentId) await cancelAppointment(upcomingAppointment.appointmentId);
                  setManagingAppt(false);
                }}
              >
                Cancel Appointment
              </button>
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setManagingAppt(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modals */}
      {modal && (
        <HistoryModal type={modal.type} data={modal.data} onClose={() => setModal(null)} onNavigate={setActiveTab} />
      )}
    </div>
  );
};
