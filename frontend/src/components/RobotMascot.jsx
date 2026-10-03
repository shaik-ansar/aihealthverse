import React from 'react';

export const RobotMascot = ({ size = 120 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Drop shadow definition */}
      <defs>
        <filter id="robot-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ground Shadow */}
      <ellipse cx="60" cy="110" rx="25" ry="4" fill="#cbd5e1" opacity="0.5" />

      {/* Floating Sparkles (Plus signs & circles) */}
      <path d="M15 45 L21 45 M18 42 L18 48" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M100 35 L106 35 M103 32 L103 38" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <circle cx="25" cy="25" r="2" fill="#38bdf8" opacity="0.5"/>
      <circle cx="95" cy="65" r="2.5" fill="#38bdf8" opacity="0.5"/>
      <circle cx="15" cy="80" r="1.5" fill="#38bdf8" opacity="0.4"/>

      {/* Antenna */}
      <rect x="58.5" y="15" width="3" height="15" fill="#cbd5e1" rx="1.5" />
      <circle cx="60" cy="14" r="5" fill="#3b82f6" />
      <circle cx="61.5" cy="12.5" r="1.5" fill="#ffffff" opacity="0.6" />

      {/* Body */}
      <rect x="42" y="65" width="36" height="32" rx="16" fill="#ffffff" filter="url(#robot-shadow)" />
      
      {/* Chest Heart */}
      <path d="M60 84.5 C60 84.5 56 81.5 56 79 C56 77.5 57 76.5 58.5 76.5 C59.5 76.5 60 77.5 60 77.5 C60 77.5 60.5 76.5 61.5 76.5 C63 76.5 64 77.5 64 79 C64 81.5 60 84.5 60 84.5 Z" fill="#38bdf8" />

      {/* Head */}
      <rect x="28" y="28" width="64" height="44" rx="22" fill="#ffffff" filter="url(#robot-shadow)" />

      {/* Face Visor */}
      <rect x="34" y="34" width="52" height="32" rx="16" fill="#0f172a" />
      
      {/* Visor Shine */}
      <path d="M 38 40 Q 60 36 82 40" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.15" />

      {/* Eyes (Cyan, slightly glowing) */}
      <circle cx="48" cy="50" r="4.5" fill="#38bdf8" filter="url(#glow)" />
      <circle cx="72" cy="50" r="4.5" fill="#38bdf8" filter="url(#glow)" />
      
      {/* Eye Pupils (White shine) */}
      <circle cx="49" cy="48.5" r="1.5" fill="#ffffff" opacity="0.9" />
      <circle cx="73" cy="48.5" r="1.5" fill="#ffffff" opacity="0.9" />

      {/* Floating Hands */}
      <circle cx="20" cy="68" r="7" fill="#38bdf8" filter="url(#glow)" />
      <circle cx="21.5" cy="66" r="2" fill="#ffffff" opacity="0.6" />
      
      <circle cx="100" cy="68" r="7" fill="#38bdf8" filter="url(#glow)" />
      <circle cx="101.5" cy="66" r="2" fill="#ffffff" opacity="0.6" />
      
    </svg>
  );
};
