// Shared fetch wrapper: attaches X-Device-Id + Authorization on every API call,
// and broadcasts quota SSE events so the pill in the header stays live.

export const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';

const DEVICE_KEY = 'jg_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// Set by AuthContext whenever the Supabase session changes
let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }
export function getAccessToken() { return _accessToken; }

export function authHeaders(extra = {}) {
  const headers = { 'X-Device-Id': getDeviceId(), ...extra };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  return headers;
}

export function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });
}

// ── Quota event bus ──────────────────────────────────────────
// Chat SSE parsing dispatches here; QuotaPill listens.

const QUOTA_EVENT = 'jg-quota-update';

export function broadcastQuota(quota) {
  try {
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT, { detail: quota }));
    sessionStorage.setItem('jg_quota', JSON.stringify(quota));
  } catch { /* ignore */ }
}

export function getLastQuota() {
  try { return JSON.parse(sessionStorage.getItem('jg_quota') || 'null'); } catch { return null; }
}

export function onQuotaUpdate(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(QUOTA_EVENT, listener);
  return () => window.removeEventListener(QUOTA_EVENT, listener);
}
