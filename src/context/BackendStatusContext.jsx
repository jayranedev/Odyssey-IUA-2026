import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/health';

/**
 * Backend Status Context
 * ──────────────────────
 * Single source of truth for whether the JugaadGPT AI backend is reachable.
 *
 * How the polling works:
 *   1. On mount, runs an immediate health check.
 *   2. Sets up a 30-second polling interval to re-check.
 *   3. Any component can read { isOnline, isChecking } via useBackendStatus().
 *   4. When isOnline transitions (e.g. false → true), all consumers re-render
 *      automatically — no page refresh required.
 *
 * State values:
 *   - isOnline: null (unknown, first check pending) | true | false
 *   - isChecking: true only during the very first check before we have data
 *
 * To disable/remove this system later, simply remove <BackendStatusProvider>
 * from main.jsx — all consumer components will gracefully receive defaults.
 */

const POLL_INTERVAL_MS = 30_000; // 30 seconds between health checks

const BackendStatusContext = createContext({
  isOnline: null,    // null = unknown (initial), true = online, false = offline
  isChecking: true,  // true only until the first check completes
});

export function BackendStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      const online = await checkBackendHealth();
      if (!cancelled) {
        setIsOnline(online);
        setIsChecking(false);
      }
    };

    // Immediate first check on mount
    runCheck();

    // Periodic background polling
    const intervalId = setInterval(runCheck, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <BackendStatusContext.Provider value={{ isOnline, isChecking }}>
      {children}
    </BackendStatusContext.Provider>
  );
}

/**
 * Hook to read the current backend status.
 * @returns {{ isOnline: boolean | null, isChecking: boolean }}
 */
export function useBackendStatus() {
  return useContext(BackendStatusContext);
}

