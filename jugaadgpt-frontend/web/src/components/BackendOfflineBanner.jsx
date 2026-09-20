'use client';
import React, { useState } from 'react';
import { useBackendStatus } from '../context/BackendStatusContext';
import { IconX } from './Icons2';

const BackendOfflineBanner = () => {
  const { isOnline } = useBackendStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline !== false || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--jg2-kraft-light)',
        borderBottom: '2px solid var(--jg2-ink)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 51,
        animation: 'jg-fade-up 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--jg2-brick-soft)',
          border: '1.5px solid var(--jg2-brick)',
          padding: '3px 10px',
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--jg2-brick)',
          flexShrink: 0,
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jg2-brick)', flexShrink: 0 }}
          aria-hidden="true"
        />
        Backend Offline
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--jg2-ink)', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5, textAlign: 'center' }}>
        JugaadGPT AI is currently offline. The backend has been taken offline to avoid hosting costs. You can still explore the complete frontend and project experience.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notification"
        style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--jg2-mute)', lineHeight: 1 }}
      >
        <IconX size={14} />
      </button>
    </div>
  );
};

export default BackendOfflineBanner;
