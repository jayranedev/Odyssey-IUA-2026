'use client';
import React, { useState } from 'react';
import { useBackendStatus } from './BackendStatusContext';

const BackendOfflineBanner = () => {
  const { isOnline } = useBackendStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline !== false || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: '#EBDDC3', // --jg2-kraft-light
        borderBottom: '2px solid var(--ink)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 51,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FDE8E1', // --jg2-brick-soft
          border: '1.5px solid #C24F2C', // --jg2-brick
          padding: '3px 10px',
          fontSize: 10,
          fontFamily: 'var(--font-mono), monospace',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#C24F2C',
          flexShrink: 0,
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#C24F2C', flexShrink: 0 }}
          aria-hidden="true"
        />
        Backend Offline
      </div>
      <span style={{ fontSize: 12, color: 'var(--graphite)', fontFamily: 'var(--font-display), sans-serif', lineHeight: 1.4, textAlign: 'center' }}>
        JugaadGPT AI is currently offline. The backend has been taken offline to avoid hosting costs. You can still explore the complete frontend and project experience.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notification"
        style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--mute)', lineHeight: 1, fontSize: 18 }}
      >
        ✕
      </button>
    </div>
  );
};

export default BackendOfflineBanner;
