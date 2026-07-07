// Supabase client for auth ONLY (Google OAuth + email OTP).
// The app's data lives in our own backend — Supabase issues the JWT
// that the FastAPI backend verifies.
//
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing, auth features
// are disabled and the app keeps working anonymously (5 free/day).

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const authEnabled = Boolean(supabase);
