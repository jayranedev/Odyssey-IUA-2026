/**
 * Backend Health Check Service
 * ─────────────────────────────
 * Pings the JugaadGPT backend's /health endpoint to determine availability.
 *
 * How it works:
 *   - Sends a GET request to {API_BASE}/health with a 5-second timeout.
 *   - Returns `true` if the server responds with a 2xx status.
 *   - Returns `false` on any error: network failure, timeout, CORS block,
 *     non-2xx status, or any other exception.
 *   - Never throws — always resolves to a boolean.
 *
 * This module has no React dependency and can be used anywhere.
 */

import { API_BASE } from './api';

/**
 * Check whether the JugaadGPT backend is reachable and healthy.
 * @returns {Promise<boolean>} true if the backend responded OK, false otherwise.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      // 5-second hard timeout — prevents the UI from waiting indefinitely
      // on a cold-starting Render instance or unresponsive server.
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    // Network error, CORS block, timeout, or AbortError — all mean "offline"
    return false;
  }
}

