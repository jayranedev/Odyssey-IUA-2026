import React from 'react';

// Theme-styled crash card shown by the Sentry ErrorBoundary.
const ErrorFallback = ({ resetError }) => (
  <div style={{
    minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }}>
    <div className="bg-white border-2 border-black shadow-jugaad-lg" style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 34 }}>🔧</div>
      <h2 className="font-display font-black uppercase text-jugaad-blue" style={{ fontSize: 18, margin: '10px 0 6px' }}>
        Kuch toot gaya
      </h2>
      <p style={{ fontSize: 13, color: 'var(--jg2-graphite, #4A5568)', marginBottom: 16 }}>
        Something broke on our side. Your chats are safe — reload and carry on jugaading.
      </p>
      <button className="jg2-btn-yellow" onClick={() => (resetError ? resetError() : window.location.reload())}>
        Reload
      </button>
    </div>
  </div>
);

export default ErrorFallback;
