'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useBackendStatus } from './BackendStatusContext';

const DISMISS_KEY = 'jg_offline_modal_dismissed';
const GITHUB_URL = 'https://github.com/jayranedev/Odyssey-IUA-2026';

const BackendOfflineModal = () => {
  const { isOnline } = useBackendStatus();
  const [visible, setVisible] = useState(false);
  const primaryBtnRef = useRef(null);

  useEffect(() => {
    if (isOnline !== false) return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;

    const timerId = setTimeout(() => {
      setVisible(true);
    }, 5_000);

    return () => clearTimeout(timerId);
  }, [isOnline]);

  useEffect(() => {
    if (isOnline === true) {
      setVisible(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (visible && primaryBtnRef.current) {
      primaryBtnRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch { }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 700,
        background: 'rgba(14, 27, 45, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-modal-title"
    >
      <div
        style={{
          background: 'var(--paper)',
          background: 'var(--card, #FFFFFF)',
          maxWidth: 460,
          width: '100%',
          padding: 28,
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid var(--border)',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close modal"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, lineHeight: 1, color: 'var(--mute)',
          }}
        >
          ✕
        </button>

        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#FDE8E1', border: '1.5px solid #C24F2C',
            padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font-mono), monospace',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: '#C24F2C', marginBottom: 14,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C24F2C' }} aria-hidden="true" />
          Backend Offline
        </div>

        <h2 id="offline-modal-title" style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 900, textTransform: 'uppercase', color: 'var(--jblue)', fontSize: 20, marginBottom: 14, lineHeight: 1.3 }}>
          JugaadGPT AI is currently offline
        </h2>

        <div style={{ fontSize: 13, color: 'var(--graphite)', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>
          <p style={{ marginBottom: 12 }}>
            JugaadGPT was built as a hackathon project to explore how multimodal
            AI and Retrieval-Augmented Generation could be used to generate
            practical, affordable solutions to real-world problems.
          </p>
          <p style={{ marginBottom: 12 }}>
            The original backend has been taken offline to avoid ongoing hosting
            and infrastructure costs. Because the AI backend is unavailable,
            interactive AI responses are currently disabled.
          </p>
          <p style={{ marginBottom: 20 }}>
            You can still explore the complete frontend, product experience,
            interfaces, and project information.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            ref={primaryBtnRef}
            onClick={dismiss}
            style={{
              background: 'var(--jyellow)', color: 'var(--ink)', border: '1.5px solid var(--ink)',
              padding: '10px 20px', fontWeight: 700, fontFamily: 'var(--font-mono), monospace',
              textTransform: 'uppercase', fontSize: 12, cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--ink)'
            }}
          >
            Explore Website
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12, fontFamily: 'var(--font-mono), monospace', fontWeight: 700,
              textTransform: 'uppercase', color: 'var(--graphite)',
              textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.03em',
            }}
          >
            View GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default BackendOfflineModal;

