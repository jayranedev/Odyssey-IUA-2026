'use client';
import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Login modal — email OTP, styled to the JugaadGPT
// paper/ink/yellow design language (same tokens as the chat UI).

const LoginModal = () => {
  const { loginOpen, closeLogin, sendOtp, verifyOtp, authEnabled } = useAuth();
  const [step, setStep] = useState('start'); // start | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loginOpen) return null;

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setBusy(true); setError('');
    const { error: err } = await sendOtp(email.trim());
    setBusy(false);
    if (err) { setError(err.message); return; }
    setStep('code');
  };

  const handleVerify = async () => {
    if (!code.trim()) return;
    setBusy(true); setError('');
    const { error: err } = await verifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (err) { setError(err.message); return; }
    // onAuthStateChange in AuthContext closes the modal + claims sessions
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(14, 27, 45, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={closeLogin}
    >
      <div
        style={{ 
          background: 'var(--jg2-paper)',
          border: '2px solid var(--jg2-ink)',
          boxShadow: '4px 4px 0 var(--jg2-ink)',
          maxWidth: 380, width: '100%', padding: 32, position: 'relative',
          boxSizing: 'border-box', display: 'flex', flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeLogin}
          aria-label="Close login"
          style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <h2 className="font-display font-black uppercase tracking-tight text-jugaad-blue" style={{ fontSize: 20, marginBottom: 4 }}>
          Log in to JugaadGPT
        </h2>
        <p style={{ fontSize: 13, color: 'var(--jg2-graphite)', marginBottom: 18 }}>
          Get 25 jugaads/day and keep your chats saved to your account.
        </p>

        {!authEnabled && (
          <p style={{ fontSize: 13, color: 'var(--jg2-brick)' }}>
            Login isn't configured on this deployment yet (missing Supabase keys).
          </p>
        )}

        {authEnabled && step === 'start' && (
          <>
            <div style={{ display: 'inline-flex', padding: '4px 8px', marginBottom: 12, border: '1px dashed var(--jg2-kraft-deep)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--jg2-mute)' }}>
              Email login only
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              placeholder="you@example.com"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                border: '1.5px solid var(--jg2-ink)', fontSize: 14, marginBottom: 10,
                fontFamily: 'inherit', background: 'var(--jg2-paper)',
              }}
            />
            <button
              className="jg2-btn-yellow"
              style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              onClick={handleSendOtp}
              disabled={busy}
            >
              <Mail size={14} /> {busy ? 'Sending…' : 'Send magic link'}
            </button>
          </>
        )}

        {authEnabled && step === 'code' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--jg2-graphite)', marginBottom: 10, lineHeight: 1.5 }}>
              We sent a secure magic link to <strong>{email}</strong>. 
              Check your inbox and click the link to log in!
            </p>
            <div style={{ padding: 12, background: 'var(--jg2-kraft-light)', borderRadius: 6, fontSize: 12, color: 'var(--jg2-ink)', marginBottom: 10, lineHeight: 1.5, fontFamily: 'JetBrains Mono, monospace' }}>
              You can close this window. The magic link will automatically log you in.
            </div>
            <button
              onClick={() => { setStep('start'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', marginTop: 10,
                fontSize: 12, color: 'var(--jg2-graphite)', textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </>
        )}

        {error && (
          <p style={{ fontSize: 12, color: 'var(--jg2-brick)', marginTop: 10 }}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default LoginModal;

