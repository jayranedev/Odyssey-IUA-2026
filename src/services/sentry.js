// Sentry for the web app — active only when VITE_SENTRY_DSN is set.
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export { Sentry };
export const sentryEnabled = Boolean(dsn);
