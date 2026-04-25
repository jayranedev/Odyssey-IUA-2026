import React from 'react';

export default function ExtensionPopup() {
  return (
    <div style={{
      width: 320,
      fontFamily: 'system-ui, sans-serif',
      background: '#F8F5EE',
      color: '#0E1B2D',
      padding: 0,
      margin: 0,
      border: '1px solid #0E1B2D'
    }}>
      <div style={{
        background: '#0E1B2D',
        color: '#F8F5EE',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>JUGAAD GPT</div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>WORKSPACE</div>
      </div>
      
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Extracting context from current page...
        </p>
        
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #0E1B2D',
          padding: '12px',
          boxShadow: '2px 2px 0 #0E1B2D',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 4 }}>FOUND ENTITIES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ border: '1px solid #0E1B2D', padding: '2px 8px', fontSize: 11, borderRadius: 2 }}>MS Pipe</span>
            <span style={{ border: '1px solid #0E1B2D', padding: '2px 8px', fontSize: 11, borderRadius: 2 }}>Cycle Wheel</span>
          </div>
        </div>

        <button style={{
          width: '100%',
          background: '#F4C61E',
          color: '#0E1B2D',
          border: '1.5px solid #0E1B2D',
          padding: '10px',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          boxShadow: '2px 2px 0 #0E1B2D',
          textTransform: 'uppercase'
        }}>
          Send to Workshop
        </button>
      </div>
    </div>
  );
};
