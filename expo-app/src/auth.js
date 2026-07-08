// Supabase auth for the Expo app — email OTP only (no OAuth redirect
// complexity inside the app). Configure supabaseUrl/supabaseAnonKey in
// app.json → expo.extra. When unset, auth is disabled and the app runs
// anonymously (5 free jugaads/day per device).

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { API_BASE, authHeaders, getDeviceIdSync, setAccessToken } from './api';

const extra = Constants.expoConfig?.extra || {};

export const supabase = extra.supabaseUrl && extra.supabaseAnonKey
  ? createClient(extra.supabaseUrl, extra.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const authEnabled = Boolean(supabase);

export async function restoreSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  setAccessToken(data.session?.access_token || null);
  return data.session?.user || null;
}

export async function sendOtp(email) {
  if (!supabase) return { error: { message: 'Auth not configured' } };
  return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
}

export async function verifyOtp(email, token) {
  if (!supabase) return { error: { message: 'Auth not configured' } };
  const result = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (!result.error) {
    setAccessToken(result.data.session?.access_token || null);
    claimSessions().catch(() => {});
  }
  return result;
}

export async function signInWithPassword(email, password) {
  if (!supabase) return { error: { message: 'Auth not configured' } };
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (!result.error) {
    setAccessToken(result.data.session?.access_token || null);
    claimSessions().catch(() => {});
  }
  return result;
}

export async function signUpWithPassword(email, password) {
  if (!supabase) return { error: { message: 'Auth not configured' } };
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  setAccessToken(null);
}

// Attach this device's anonymous chats to the account after login
export async function claimSessions() {
  const deviceId = getDeviceIdSync();
  if (!deviceId) return;
  await fetch(`${API_BASE}/api/sessions/claim`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ device_id: deviceId }),
  });
}
