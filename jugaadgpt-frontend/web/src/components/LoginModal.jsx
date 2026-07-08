'use client';
import React, { useState } from 'react';
import { X, Mail, KeyRound, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Login modal — email OTP & Password, styled to the JugaadGPT
// paper/ink/yellow design language (same tokens as the chat UI).

const LoginModal = () => {
  const { loginOpen, closeLogin, sendOtp, signInWithPassword, signUpWithPassword, authEnabled } = useAuth();
  const [step, setStep] = useState('start'); // start | password-login | password-signup | magic-link-sent
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loginOpen) return null;

  const handleSendMagicLink = async () => {
    if (!email.trim()) return;
    setBusy(true); setError('');
    const { error: err } = await sendOtp(email.trim());
    setBusy(false);
    if (err) { setError(err.message); return; }
    setStep('magic-link-sent');
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setBusy(true); setError('');
    const { error: err } = await signInWithPassword(email.trim(), password);
    setBusy(false);
    if (err) { setError(err.message); return; }
    // onAuthStateChange handles closing modal
  };

  const handlePasswordSignup = async () => {
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true); setError('');
    const { error: err } = await signUpWithPassword(email.trim(), password);
    setBusy(false);
    if (err) { 
      setError(err.message); 
      return; 
    }
    // Signup successful. Some Supabase configs require email verification.
    setError('Signup successful! If you are not automatically logged in, check your email for a verification link.');
  };

  const renderInput = (type, value, onChange, placeholder, onEnter) => (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '9px 12px',
        border: '1.5px solid var(--jg2-ink)', fontSize: 14, marginBottom: 10,
        fontFamily: 'inherit', background: 'var(--jg2-paper)',
      }}
    />
  );

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
            {renderInput('email', email, setEmail, 'you@example.com')}
            
            <button className="jg2-btn-yellow" style={{ width: '100%', marginBottom: 10, display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => setStep('password-login')} disabled={!email.trim()}>
              <KeyRound size={16} /> Log in with Password
            </button>
            <button className="jg2-btn" style={{ width: '100%', marginBottom: 10, display: 'flex', justifyContent: 'center', gap: 8, background: 'var(--jg2-paper)' }} onClick={() => setStep('password-signup')} disabled={!email.trim()}>
              <UserPlus size={16} /> Create an Account
            </button>
            <button className="jg2-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: 'var(--jg2-paper)' }} onClick={handleSendMagicLink} disabled={busy || !email.trim()}>
              <Mail size={16} /> {busy ? 'Sending…' : 'Send Magic Link'}
            </button>
          </>
        )}

        {authEnabled && (step === 'password-login' || step === 'password-signup') && (
          <>
            {renderInput('email', email, setEmail, 'you@example.com')}
            {renderInput('password', password, setPassword, 'Enter password', step === 'password-login' ? handlePasswordLogin : handlePasswordSignup)}
            
            <button 
              className="jg2-btn-yellow" 
              style={{ width: '100%', marginBottom: 10 }} 
              onClick={step === 'password-login' ? handlePasswordLogin : handlePasswordSignup} 
              disabled={busy}
            >
              {busy ? 'Please wait...' : step === 'password-login' ? 'Log in' : 'Sign up'}
            </button>
            
            <button onClick={() => setStep('start')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--jg2-graphite)', textDecoration: 'underline' }}>
              Back to options
            </button>
          </>
        )}

        {authEnabled && step === 'magic-link-sent' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--jg2-graphite)', marginBottom: 10, lineHeight: 1.5 }}>
              We sent a secure magic link to <strong>{email}</strong>. 
              Check your inbox and click the link to log in!
            </p>
            <button onClick={() => setStep('start')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, fontSize: 12, color: 'var(--jg2-graphite)', textDecoration: 'underline' }}>
              Back
            </button>
          </>
        )}

        {error && (
          <p style={{ fontSize: 12, color: error.includes('successful') ? 'var(--jg2-ink)' : 'var(--jg2-brick)', marginTop: 10 }}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default LoginModal;

