'use client';
import { API_BASE } from './api';

/**
 * Check whether the JugaadGPT backend is reachable and healthy.
 * @returns {Promise<boolean>} true if the backend responded OK, false otherwise.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
