'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from './AppShell';
import { authHeaders } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';
const BLUEPRINT_KEY = 'jg_blueprint';
const BAZAARI_KEY = 'jg_bazaari';

const SolutionModal = ({ card, onClose }) => {
  const router = useRouter();
  let solution = null;
  if (card.solution_json) {
    try {
      const parsed = JSON.parse(card.solution_json);
      solution = parsed.solution || parsed;
    } catch { /* ignore */ }
  }

  const loadBlueprint = () => {
    localStorage.setItem(BLUEPRINT_KEY, JSON.stringify(solution));
    onClose();
    router.push('/blueprints');
  };

  const loadBazaari = () => {
    localStorage.setItem(BAZAARI_KEY, JSON.stringify({
      title: solution.title,
      materials: solution.materials,
      total_cost_inr: solution.total_cost_inr,
      savedAt: Date.now(),
    }));
    onClose();
    router.push('/bazaari');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--jg2-paper)', border: '2px solid var(--jg2-ink)',
        borderRadius: 4, boxShadow: '6px 6px 0 var(--jg2-ink)',
        maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--jg2-yellow)', padding: '12px 20px',
          borderBottom: '2px solid var(--jg2-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
              Archive — {card.status}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2, color: 'var(--jg2-ink)' }}>{card.title}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--jg2-ink)', color: 'var(--jg2-paper)', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Annotation */}
          {card.annotation && (
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: 'var(--jg2-graphite)', margin: 0 }}>{card.annotation}</p>
          )}

          {solution ? (
            <>
              {solution.summary && (
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--jg2-graphite)', margin: 0 }}>{solution.summary}</p>
              )}

              {solution.materials?.length > 0 && (
                <div style={{ background: 'var(--jg2-kraft-light)', padding: '12px 14px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em', color: 'var(--jg2-ink)' }}>Materials Required</div>
                  {solution.materials.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', borderBottom: i < solution.materials.length - 1 ? '1px solid var(--jg2-kraft)' : 'none', color: 'var(--jg2-graphite)' }}>
                      <span>{m.item} <span style={{ color: 'var(--jg2-mute)', fontSize: 12 }}>({m.quantity})</span></span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--jg2-ink)' }}>₹{m.cost_inr?.toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--jg2-kraft)', fontWeight: 700, fontSize: 15, color: 'var(--jg2-ink)' }}>
                    <span>Estimated Total</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>₹{solution.total_cost_inr?.toFixed(0)}</span>
                  </div>
                </div>
              )}

              {solution.build_steps?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em', color: 'var(--jg2-ink)' }}>How to Build</div>
                  {solution.build_steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 14, lineHeight: 1.6, color: 'var(--jg2-graphite)' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--jg2-brick)', flexShrink: 0, minWidth: 24, paddingTop: 2 }}>{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px dashed var(--jg2-kraft)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { onClose(); router.push(`/chat?session_id=${card.session_id}`); }}
                  style={{ flex: '1 1 100%', padding: '12px', background: 'var(--jg2-yellow)', color: 'var(--jg2-ink)', border: '1.5px solid var(--jg2-ink)', borderRadius: 6, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '3px 3px 0 var(--jg2-ink)' }}
                >
                  Resume Chat
                </button>
                <button
                  onClick={loadBlueprint}
                  style={{ flex: 1, padding: '12px', background: 'var(--jg2-ink)', color: 'var(--jg2-paper)', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
                >
                  Load in Blueprints
                </button>
                <button
                  onClick={loadBazaari}
                  style={{ flex: 1, padding: '12px', background: 'var(--jg2-brick)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
                >
                  Find in Bazaari
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--jg2-mute)', fontStyle: 'italic', fontSize: 14 }}>No detailed solution data found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ArchiveScreen = () => {
  const { user, sessionVersion } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('jg_session_id') : null;

  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      // When logged in, don't pass session_id — backend returns all user's cards
      // When anonymous, pass session_id for device-scoped results
      const url = user
        ? `${API_BASE}/api/archive`
        : sessionId
          ? `${API_BASE}/api/archive?session_id=${sessionId}`
          : `${API_BASE}/api/archive`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      setCards(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when auth state changes (login/logout) or on mount
  useEffect(() => { fetchCards(); }, [sessionVersion, user?.id]);

  const toggleStar = async (e, id, currentStarred) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/archive/${id}`, {
        method: 'PATCH', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ starred: !currentStarred }),
      });
      if (res.ok) setCards(prev => prev.map(c => c.id === id ? { ...c, starred: !currentStarred } : c));
    } catch { /* best-effort */ }
  };

  const deleteCard = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/archive/${id}`, { method: 'DELETE', headers: authHeaders() });
      setCards(prev => prev.filter(c => c.id !== id));
      if (activeCard?.id === id) setActiveCard(null);
    } catch { /* best-effort */ }
  };

  const regenerateImage = async (e, cardId, title) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/archive/generate-images`, { headers: authHeaders() });
      // Refetch after a longer delay (15s) to give pollinations.ai enough time to generate the image
      setTimeout(fetchCards, 15000);
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
              onClick={() => setActiveCard(card)}
              onStar={(e) => toggleStar(e, card.id, card.starred)}
              onDelete={(e) => deleteCard(e, card.id)}
              onRegenImage={(e) => regenerateImage(e, card.id, card.title)}
            />
          ))}
        </div>

        {activeCard && <SolutionModal card={activeCard} onClose={() => setActiveCard(null)} />}

      </div>
    </AppShell>
  );
};

const PolaroidCard = ({ card, onClick, onStar, onDelete, onRegenImage }) => {
  const rotation = card.rotation || 'rotate-1';
  const bg = card.bg_color || 'bg-white';
  
  // Display image: prefer image_base64 (AI-generated), then image_id, then image URL
  const imageDataUri = card.image_base64
    ? `data:image/png;base64,${card.image_base64}`
    : null;
  const imageUrl = imageDataUri
    || (card.image_id ? `${API_BASE}/api/vision/${card.image_id}` : null)
    || card.image
    || null;

  return (
    <div
      className={`${rotation}`}
      onClick={onClick}
      style={{
        background: bg.startsWith('bg-[') ? bg.replace('bg-[', '').replace(']', '') : bg === 'bg-white' ? '#fff' : bg === 'bg-yellow-50' ? '#fefce8' : '#fdfcf0',
        border: '1px solid #ddd',
        boxShadow: '4px 5px 14px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        transform: rotation === 'rotate-1' ? 'rotate(1deg)' : rotation === '-rotate-2' ? 'rotate(-2deg)' : rotation === 'rotate-2' ? 'rotate(2deg)' : rotation === '-rotate-1' ? 'rotate(-1deg)' : 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
    >
      {/* Photo area */}
      <div style={{ height: 140, background: '#f0ede6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 40, color: '#ccc' }}>⚙</div>
            <button
              onClick={onRegenImage}
              style={{
                fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                textTransform: 'uppercase', padding: '3px 8px',
                background: 'var(--jg2-yellow)', border: '1px solid var(--jg2-ink)',
                cursor: 'pointer', color: 'var(--jg2-ink)', letterSpacing: '0.05em',
              }}
            >
              Generate Image
            </button>
          </div>
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
