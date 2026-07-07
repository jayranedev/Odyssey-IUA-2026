'use client';
import React, { useState, useEffect } from 'react';
import { AppShell } from './AppShell';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';

export const ArchiveScreen = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('jg_session_id') : null;

  const fetchCards = async () => {
    setLoading(true);
    try {
      const url = sessionId
        ? `${API_BASE}/api/archive?session_id=${sessionId}`
        : `${API_BASE}/api/archive`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server ${res.status}`);
      setCards(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const toggleStar = async (id, currentStarred) => {
    try {
      const res = await fetch(`${API_BASE}/api/archive/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      });
      if (res.ok) setCards(prev => prev.map(c => c.id === id ? { ...c, starred: !currentStarred } : c));
    } catch { /* best-effort */ }
  };

  const deleteCard = async (id) => {
    try {
      await fetch(`${API_BASE}/api/archive/${id}`, { method: 'DELETE' });
      setCards(prev => prev.filter(c => c.id !== id));
    } catch { /* best-effort */ }
  };

  return (
    <AppShell active="archive" bgClass="jg2-bg-paper">
      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative' }}>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="jg2-section-title" style={{ fontSize: 30, padding: '0 0 4px', borderBottom: '2px solid var(--jg2-ink)', display: 'inline-block' }}>
              THE ARCHIVE
            </h1>
            <div className="jg2-hand" style={{ marginTop: 8, fontSize: 18, color: 'var(--jg2-graphite)' }}>
              Past builds, failed experiments, and saved blueprints.
            </div>
          </div>
          <button onClick={fetchCards} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', padding: '6px 12px', border: '1.5px solid var(--jg2-ink)', background: 'var(--jg2-paper)', cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--jg2-mute)' }}>
            Loading archive…
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--jg2-brick-soft)', border: '1px solid var(--jg2-brick)', fontSize: 13, color: 'var(--jg2-brick)', fontFamily: 'JetBrains Mono, monospace' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && cards.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--jg2-mute)' }}>
            <div style={{ fontSize: 36 }}>📂</div>
            <div className="jg2-hand" style={{ fontSize: 20, marginTop: 12 }}>No saved builds yet.</div>
            <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>
              Chat with JugaadGPT and click "Save to Archive" on any solution.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {cards.map(card => (
            <PolaroidCard
              key={card.id}
              card={card}
              onStar={() => toggleStar(card.id, card.starred)}
              onDelete={() => deleteCard(card.id)}
            />
          ))}
        </div>

      </div>
    </AppShell>
  );
};

const PolaroidCard = ({ card, onStar, onDelete }) => {
  const rotation = card.rotation || 'rotate-1';
  const bg = card.bg_color || 'bg-white';

  return (
    <div
      className={`${rotation}`}
      style={{
        background: bg.startsWith('bg-[') ? bg.replace('bg-[', '').replace(']', '') : bg === 'bg-white' ? '#fff' : bg === 'bg-yellow-50' ? '#fefce8' : '#fdfcf0',
        border: '1px solid #ddd',
        boxShadow: '4px 5px 14px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        transform: rotation === 'rotate-1' ? 'rotate(1deg)' : rotation === '-rotate-2' ? 'rotate(-2deg)' : rotation === 'rotate-2' ? 'rotate(2deg)' : rotation === '-rotate-1' ? 'rotate(-1deg)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Photo area */}
      <div style={{ height: 140, background: '#f0ede6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {card.image ? (
          <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ fontSize: 40, color: '#ccc' }}>⚙</div>
        )}
        {/* Tape strip at top */}
        <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 60, height: 18, background: 'rgba(255,255,180,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          padding: '3px 8px', fontSize: 10, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          background: card.starred ? '#F4C61E' : '#e5e5e5',
          border: '1px solid rgba(0,0,0,0.15)',
        }}>
          {card.starred ? '★ ' : ''}{card.status}
        </div>
      </div>

      {/* Polaroid body */}
      <div style={{ padding: '12px 14px 10px' }}>
        <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 14, color: '#0E1B2D', marginBottom: 6, lineHeight: 1.3 }}>
          {card.title}
        </div>
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 15, color: '#4A5568', lineHeight: 1.4, minHeight: 40 }}>
          {card.annotation}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#9CA3AF' }}>
          {card.created_at ? new Date(card.created_at).toLocaleDateString() : ''}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onStar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: card.starred ? '#F4C61E' : '#ccc' }}
            title={card.starred ? 'Unstar' : 'Star'}
          >
            ★
          </button>
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ccc' }}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
