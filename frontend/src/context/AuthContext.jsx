import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();
const API = 'http://localhost:8000';

/* ── Parse profile_data JSON safely ─────────────────────────────────────── */
const parseProfile = (raw) => {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch { return {}; }
};

/* ── Build normalized user object from backend response ─────────────────── */
const buildUser = (dbUser) => {
  const profile = parseProfile(dbUser.profile_data);
  return {
    id:                  dbUser.id,
    name:                dbUser.full_name,
    email:               dbUser.email,
    role:                dbUser.role,
    avatar:              `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.full_name)}&size=200&background=e0e7ff&color=3730a3`,
    // Demographics — surfaced to the AI chatbot's patient context
    age:                 profile.age               || null,
    sex:                 profile.gender            || null,
    blood_group:         profile.blood_group       || null,
    height:              profile.height            || null,
    weight:              profile.weight            || null,
    allergies:           profile.allergies !== 'None' ? profile.allergies : null,
    chronic_conditions:  profile.chronic_conditions || null,
    phone:               profile.phone             || null,
    dob:                 profile.dob               || null,
  };
};

export const AuthProvider = ({ children }) => {
  /* ── Restore session from localStorage ─────────────────────────────────── */
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ahv_user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('ahv_token') || null; } catch { return null; }
  });

  const isLoggedIn = !!currentUser;
  const isDoctor   = currentUser?.role === 'doctor';

  /* ── Persist helpers ───────────────────────────────────────────────────── */
  const persist = (user, tok) => {
    setCurrentUser(user);
    setToken(tok);
    try {
      localStorage.setItem('ahv_user', JSON.stringify(user));
      localStorage.setItem('ahv_token', tok || '');
    } catch {}
  };

  /* ── Login ─────────────────────────────────────────────────────────────── */
  const loginWithBackend = useCallback(async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    const user = buildUser(data.user);
    persist(user, data.access_token);
    return user;
  }, []);

  /* ── Register ──────────────────────────────────────────────────────────── */
  const registerWithBackend = useCallback(async (fullName, email, password, role = 'patient') => {
    const res = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ full_name: fullName.trim(), email: email.trim(), password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    const user = buildUser(data.user);
    persist(user, data.access_token);
    return user;
  }, []);

  /* ── Refresh profile from backend (call after profile update) ──────────── */
  const refreshProfile = useCallback(async (overrideToken) => {
    const tok = overrideToken || token;
    if (!tok) return;
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${tok}` }
      });
      if (res.ok) {
        const dbUser = await res.json();
        const user = buildUser(dbUser);
        setCurrentUser(user);
        try { localStorage.setItem('ahv_user', JSON.stringify(user)); } catch {}
      }
    } catch {}
  }, [token]);

  /* ── Logout ────────────────────────────────────────────────────────────── */
  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    try {
      localStorage.removeItem('ahv_user');
      localStorage.removeItem('ahv_token');
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoggedIn, isDoctor, token,
      logout, loginWithBackend, registerWithBackend, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
