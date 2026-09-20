'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/health';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

const BackendStatusContext = createContext({
  isOnline: null,
  isChecking: true,
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

    runCheck();
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

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
