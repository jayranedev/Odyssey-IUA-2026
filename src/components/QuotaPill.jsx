import React, { useEffect, useState } from 'react';
import { getLastQuota, onQuotaUpdate } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Quota pill: "3/5 free today" (anon) or "12/25" (logged in).
// Driven by the `quota` SSE event that starts every /api/query stream.

const QuotaPill = () => {
  const [quota, setQuota] = useState(getLastQuota());
  const { user, openLogin, signOut, authEnabled } = useAuth();

  useEffect(() => onQuotaUpdate(setQuota), []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {quota && (
        <span
          title={quota.authenticated ? 'Daily jugaads used on your account' : 'Free jugaads used today'}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            border: '1.5px solid var(--jg2-ink, #0E1B2D)',
            background: quota.used >= quota.limit ? 'var(--jg2-brick-soft, #FDE8E1)' : 'var(--jg2-yellow, #F4C61E)',
            color: 'var(--jg2-ink, #0E1B2D)',
            padding: '4px 10px',
            boxShadow: '2px 2px 0 var(--jg2-ink, #0E1B2D)',
            whiteSpace: 'nowrap',
          }}
        >
          {quota.used}/{quota.limit}{quota.authenticated ? '' : ' FREE'} TODAY
        </span>
      )}
      {authEnabled && (
        user ? (
          <button
            onClick={signOut}
            title={user.email || 'Logged in'}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
              background: 'none', border: '1.5px solid var(--jg2-ink, #0E1B2D)',
              padding: '4px 10px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            Logout
          </button>
        ) : (
          <button
            onClick={openLogin}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
              background: 'var(--jg2-ink, #0E1B2D)', color: 'var(--jg2-paper, #F8F5EE)',
              border: '1.5px solid var(--jg2-ink, #0E1B2D)',
              padding: '4px 10px', cursor: 'pointer', textTransform: 'uppercase',
              boxShadow: '2px 2px 0 var(--jg2-yellow, #F4C61E)',
            }}
          >
            Login
          </button>
        )
      )}
    </div>
  );
};

export default QuotaPill;
