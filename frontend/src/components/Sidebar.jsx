import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, MessageSquare, FileText, Calendar,
  ClipboardList, Pill, Bell, User, Settings, LogOut,
  Heart, Stethoscope, Activity, Menu, X, ChevronLeft
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const { currentUser, isDoctor, logout } = useAuth();

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'consultation', label: 'Consultation',     icon: MessageSquare   },
    { id: 'records',      label: 'Health Records',   icon: ClipboardList   },
    { id: 'appointments', label: 'Appointments',     icon: Calendar        },
    { id: 'reports',      label: 'Reports',          icon: FileText        },
    { id: 'medications',  label: 'Medications',      icon: Pill            },
    { id: 'reminders',    label: 'Reminders',        icon: Bell            },
    { id: 'doctor-cdss',  label: 'Doctor / CDSS',   icon: Stethoscope     },
    { id: 'profile',      label: 'Profile',          icon: User            },
    { id: 'settings',     label: 'Settings',         icon: Settings        },
  ];

  const sidebarWidth = collapsed ? '64px' : '240px';

  return (
    <aside
      className="sidebar"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '1rem 0.5rem' : '1.25rem 0.85rem',
      }}
    >
      {/* Brand + Hamburger toggle row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        marginBottom: '1.5rem',
        gap: '0.5rem',
      }}>
        {/* Logo — hidden when collapsed */}
        {!collapsed && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flex: 1, minWidth: 0 }}
            onClick={() => setActiveTab('dashboard')}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#2563eb,#38bdf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
            }}>
              <Heart size={17} fill="#fff"/>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                AI HealthVerse
              </div>
              <p style={{ fontSize: '0.65rem', color: '#64748b', margin: 0, fontWeight: 500, whiteSpace: 'nowrap' }}>
                Health Companion
              </p>
            </div>
          </div>
        )}

        {/* Collapsed logo icon */}
        {collapsed && (
          <div
            style={{
              width: 34, height: 34, borderRadius: 9, cursor: 'pointer',
              background: 'linear-gradient(135deg,#2563eb,#38bdf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
            }}
            onClick={() => setActiveTab('dashboard')}
            title="AI HealthVerse"
          >
            <Heart size={16} fill="#fff"/>
          </div>
        )}

        {/* Hamburger / close toggle */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: '0.25rem', borderRadius: 6,
              display: 'flex', alignItems: 'center', flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <ChevronLeft size={18}/>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: '0.25rem', borderRadius: 6,
              display: 'flex', alignItems: 'center',
              marginTop: '0.4rem',
            }}
          >
            <Menu size={18}/>
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id ||
            (item.id === 'consultation' && ['consultation','consultation-qa','consultation-summary'].includes(activeTab)) ||
            (item.id === 'reports'      && ['reports-upload','reports-analysis'].includes(activeTab));

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
              onClick={() => {
                if (item.id === 'reports') setActiveTab('reports-upload');
                else setActiveTab(item.id);
              }}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0.6rem' : '0.55rem 0.75rem',
                gap: collapsed ? 0 : '0.65rem',
                position: 'relative',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }}/>
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Bottom User section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: 'auto' }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.5rem', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)', marginBottom: '0.6rem'
          }}>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User'}
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                {isDoctor ? 'Doctor' : 'Patient'}
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }} title={currentUser?.name || 'User'}>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User'}
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
            />
          </div>
        )}

        <div
          className="nav-item"
          style={{
            color: '#ef4444',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : '0.65rem',
            padding: collapsed ? '0.6rem' : '0.55rem 0.75rem',
          }}
          title={collapsed ? 'Logout' : ''}
          onClick={() => { logout(); setActiveTab('login'); }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }}/>
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
};
