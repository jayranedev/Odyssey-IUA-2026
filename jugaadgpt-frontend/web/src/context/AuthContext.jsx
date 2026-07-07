'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, getDeviceId, setAccessToken } from '../services/api';
import { authEnabled, supabase } from '../services/supabase';

const AuthContext = createContext({
  user: null,
  authEnabled: false,
  loginOpen: false,
  openLogin: () => {},
  closeLogin: () => {},
  signInWithGoogle: async () => {},
  sendOtp: async () => {},
  verifyOtp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // After login, attach this device's anonymous chats to the account.
  const claimSessions = useCallback(async () => {
    try {
      await apiFetch('/api/sessions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: getDeviceId() }),
      });
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    if (!authEnabled) return;

    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token || null);
      setUser(data.session?.user || null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setAccessToken(session?.access_token || null);
      setUser(session?.user || null);

      // Broadcast token to the Chrome Extension
      if (typeof window !== 'undefined') {
        window.postMessage({
          type: 'JUGAADGPT_AUTH_SYNC',
          token: session?.access_token || null
        }, '*');
      }

      if (event === 'SIGNED_IN') {
        claimSessions();
        setLoginOpen(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [claimSessions]);

  // ?login=1 in the URL (used by the browser extension) opens the modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === '1') setLoginOpen(true);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!authEnabled) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const sendOtp = useCallback(async (email) => {
    if (!authEnabled) return { error: { message: 'Auth not configured' } };
    return supabase.auth.signInWithOtp({ 
      email, 
      options: { 
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin
      } 
    });
  }, []);

  const verifyOtp = useCallback(async (email, token) => {
    if (!authEnabled) return { error: { message: 'Auth not configured' } };
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  }, []);

  const signOut = useCallback(async () => {
    if (!authEnabled) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authEnabled,
        loginOpen,
        openLogin: () => setLoginOpen(true),
        closeLogin: () => setLoginOpen(false),
        signInWithGoogle,
        sendOtp,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

