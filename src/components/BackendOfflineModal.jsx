import React, { useEffect, useRef, useState } from 'react';
import { useBackendStatus } from '../context/BackendStatusContext';

/**
 * BackendOfflineModal
 * ───────────────────
 * A centered explanatory modal that appears ~10 seconds after page load
 * when the backend is confirmed offline.
 *
 * Behavior:
 *   - Only appears when isOnline === false
 *   - Waits 10 seconds after the offline state is confirmed before showing
 *   - Does NOT show if:
 *       • Backend comes online before the timer fires
 *       • Already dismissed this session (sessionStorage flag)
 *   - Dismissal stored in sessionStorage — resets on new tab/session
 *   - Can be closed by: "Explore Website" button, backdrop click, Escape key
 *   - Does NOT block the page — pure overlay (same pattern as LoginModal)
 *   - Focus is trapped to the primary button on open for accessibility
 *
 * Styling: Matches LoginModal — white card, border-2 border-black,
 * shadow-jugaad-lg, semi-transparent navy backdrop.
 */

const DISMISS_KEY = 'jg_offline_modal_dismissed';
const GITHUB_URL = 'https://github.com/jayranedev/Odyssey-IUA-2026';

const BackendOfflineModal = () => {
  const { isOnline } = useBackendStatus();
  const [visible, setVisible] = useState(false);
  const primaryBtnRef = useRef(null);

  // Timer logic: show modal after ~10 seconds if offline and not previously dismissed
  useEffect(() => {
    // Don't show if backend is online or status unknown yet
    if (isOnline !== false) return;

    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;

    const timerId = setTimeout(() => {
      // Double-check: only show if still relevant when timer fires
      setVisible(true);
    }, 10_000); // 10-second delay

    return () => clearTimeout(timerId);
  }, [isOnline]);

  // If backend comes online while modal is showing, hide it
  useEffect(() => {
    if (isOnline === true) {
      setVisible(false);
    }
  }, [isOnline]);

  // Focus the primary button when modal opens
  useEffect(() => {
    if (visible && primaryBtnRef.current) {
      primaryBtnRef.current.focus();
    }
  }, [visible]);

  // Keyboard: Escape to close
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
    } catch { /* sessionStorage may be unavailable in some contexts */ }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 700, // Above LoginModal (600)
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
        className="bg-white border-2 border-black shadow-jugaad-lg"
        style={{
          background: 'var(--jg2-card, #FFFFFF)',
          maxWidth: 460,
          width: '100%',
          padding: 28,
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid var(--jg2-ink, #000000)',
          boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            color: 'var(--jg2-mute)',
          }}
        >
          ✕
        </button>

        {/* Status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--jg2-brick-soft)',
            border: '1.5px solid var(--jg2-brick)',
            padding: '4px 10px',
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--jg2-brick)',
            marginBottom: 14,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--jg2-brick)',
            }}
            aria-hidden="true"
          />
          Backend Offline
        </div>

        {/* Title */}
        <h2
          id="offline-modal-title"
          className="font-display font-black uppercase text-jugaad-blue"
          style={{ fontSize: 20, marginBottom: 14, lineHeight: 1.3 }}
        >
          JugaadGPT AI is currently offline
        </h2>

        {/* Body text */}
        <div style={{ fontSize: 13, color: 'var(--jg2-graphite)', lineHeight: 1.7 }}>
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

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            ref={primaryBtnRef}
            onClick={dismiss}
            className="jg2-btn-yellow"
            style={{ fontSize: 12, padding: '10px 20px' }}
          >
            Explore Website
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--jg2-graphite)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              letterSpacing: '0.03em',
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

