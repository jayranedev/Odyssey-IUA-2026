import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';
const BAZAARI_KEY = 'jg_bazaari';
const BLUEPRINT_KEY = 'jg_blueprint';

const STATIC_PROJECTS = [
  {
    id: 'ARCH-2023-01',
    title: 'Low-cost Solar Dryer',
    status: 'SUCCESS',
    annotation: '"Dries chillies in 40% less time"',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwgUTUsEKc1sKf0MM956pGK5Zr5luq8cr1n9e1Mudg4xcHpcTzkVBq2aZW93HSg7Blmtpfy5uvDjMFzO2ykKgA1ACwkqyYwqAIq-C5g9frVawRg9u4czfBVcjAg8zn1rxPGgCR68VaA_7QYKO5vhgtMxLi1RqPY9wb042ITrqkpSFnD74KdvHDrIVZRSbFhLKcW5hFs8exSMlrVSgFMW3QTKOyHZ0cDMIBAcQe5kpEQyHTRSVS5WPDd65m4ONz_KZ7OrMz-rvgSOI',
    rotation: 'rotate-1', bg_color: 'bg-white', starred: false, isStatic: true,
  },
  {
    id: 'ARCH-2022-09',
    title: 'Manual Grain De-husker',
    status: 'V2 OPTIMIZED',
    annotation: '"Welded bicycle parts work best"',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9oi6hs7Pep86C9Q5FCAaewmqEVk_moEqg2KnMVtWKkkJn3OxCVpvutTcg1Q8koKst-uKXO8tH-4428j0RRL-UkRj2-IvcELR66ECn-7ng89HCU0THpg43mczVehSQp3tGBthkb0Ug0x5X1rRuzWwarFQYdsPVVf-JPfl0YL0_pL63B5smBnEM8p32F0KQ66_h1bAbfLvHBc03ZCWZPXDNVV37vcQEOae80MpZqJBI45vfC7s7a3ztehPczUY2jJMMyaKoQQrsRJM',
    rotation: '-rotate-2', bg_color: 'bg-[#fdfcf0]', starred: false, isStatic: true,
  },
];

// ── Solution detail modal ─────────────────────────────────────

const SolutionModal = ({ card, onClose }) => {
  const navigate = useNavigate();
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
    navigate('/blueprints');
  };

  const loadBazaari = () => {
    localStorage.setItem(BAZAARI_KEY, JSON.stringify({
      title: solution.title,
      materials: solution.materials,
      total_cost_inr: solution.total_cost_inr,
      savedAt: Date.now(),
    }));
    onClose();
    navigate('/bazaari');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#fff', border: '2px solid #0E1B2D',
        borderRadius: 4, boxShadow: '6px 6px 0 #0E1B2D',
        maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: '#F4C61E', padding: '12px 20px',
          borderBottom: '2px solid #0E1B2D',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
              Archive — {card.status}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2 }}>{card.title}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#0E1B2D', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Annotation */}
          {card.annotation && (
            <p style={{ fontFamily: 'cursive', fontSize: 16, color: '#4A5568', margin: 0 }}>{card.annotation}</p>
          )}

          {solution ? (
            <>
              {/* Summary */}
              {solution.summary && (
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#4A5568', margin: 0 }}>{solution.summary}</p>
              )}

              {/* Materials */}
              {solution.materials?.length > 0 && (
                <div style={{ background: '#EBDDC3', padding: '12px 14px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Materials
                  </div>
                  {solution.materials.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0',
                      borderBottom: i < solution.materials.length - 1 ? '1px solid #DFCCA9' : 'none',
                    }}>
                      <span>{m.item} <span style={{ color: '#828B99', fontSize: 11 }}>({m.quantity})</span></span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, paddingLeft: 12 }}>₹{m.cost_inr?.toFixed(0)}</span>
                    </div>
                  ))}
                  {solution.total_cost_inr != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, paddingTop: 8, borderTop: '1px solid #DFCCA9', marginTop: 4 }}>
                      <span>Total</span>
                      <span>₹{solution.total_cost_inr.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Build steps */}
              {solution.build_steps?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Build Steps
                  </div>
                  {solution.build_steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, lineHeight: 1.6 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#C24F2C', flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                      <span style={{ color: '#4A5568' }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Expected outcome */}
              {solution.expected_outcome && (
                <div style={{ background: '#FDE8E1', padding: '10px 14px', borderRadius: 6, fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Expected result:</strong> {solution.expected_outcome}
                </div>
              )}

              {/* Failure modes */}
              {solution.failure_modes?.length > 0 && (
                <div style={{ background: 'rgba(212,160,10,0.08)', padding: '10px 14px', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: '#705d00' }}>
                    ⚠ If this doesn't work
                  </div>
                  {solution.failure_modes.map((f, i) => (
                    <div key={i} style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 4, color: '#4A5568' }}>• {f}</div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px dashed #DFCCA9' }}>
                {solution.build_steps?.length > 0 && (
                  <button
                    onClick={loadBlueprint}
                    style={{
                      flex: 1, minWidth: 140, padding: '10px 14px',
                      background: '#fff', color: '#0E1B2D',
                      border: '2px solid #0E1B2D', cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                      fontSize: 11, textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '2px 2px 0 #0E1B2D',
                    }}
                  >
                    📐 Load Blueprint
                  </button>
                )}
                {solution.materials?.length > 0 && (
                  <button
                    onClick={loadBazaari}
                    style={{
                      flex: 1, minWidth: 140, padding: '10px 14px',
                      background: '#1A4B84', color: '#fff',
                      border: '2px solid #0E1B2D', cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                      fontSize: 11, textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '2px 2px 0 #0E1B2D',
                    }}
                  >
                    🛒 View in Bazaari
                  </button>
                )}
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#828B99', fontFamily: 'JetBrains Mono, monospace' }}>
              No solution data stored for this card.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Archive page ──────────────────────────────────────────────

const Archive = () => {
  usePageTitle('Archive');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/archive`)
      .then(r => { if (!r.ok) throw new Error(`Server ${r.status}`); return r.json(); })
      .then(data => { setCards(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const deleteCard = async (e, id) => {
    e.stopPropagation();
    await fetch(`${API_BASE}/api/archive/${id}`, { method: 'DELETE' }).catch(() => {});
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const toggleStar = async (e, id, starred) => {
    e.stopPropagation();
    setCards(prev => prev.map(c => c.id === id ? { ...c, starred: !starred } : c));
    await fetch(`${API_BASE}/api/archive/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: !starred }),
    }).catch(() => {
      setCards(prev => prev.map(c => c.id === id ? { ...c, starred } : c));
    });
  };

  const allCards = [...cards, ...STATIC_PROJECTS];

  return (
    <main className="mt-2 corkboard min-h-screen py-10 pb-32 px-margin">
      {selectedCard && <SolutionModal card={selectedCard} onClose={() => setSelectedCard(null)} />}

      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="font-display text-5xl inline-block bg-white px-6 py-2 border-4 border-primary shadow-jugaad-lg -rotate-1">
            THE ARCHIVE
          </h1>
          <p className="font-annotation text-lg mt-4 text-primary font-bold">
            // A trophy wall of resourcefulness and rural grit
          </p>
        </div>

        {loading && (
          <div className="text-center py-12 font-display text-primary text-xl uppercase animate-pulse">
            Loading Archive…
          </div>
        )}
        {error && (
          <div className="text-center py-3 font-mono text-xs text-secondary border border-dashed border-secondary/40 mb-8 bg-white/50 rounded">
            Backend offline — showing sample cards. ({error})
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {allCards.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className={`relative ${card.bg_color || 'bg-white'} p-4 shadow-xl border-b-[12px] border-stone-200 ${card.rotation || ''} hover:rotate-0 transition-transform cursor-pointer group`}
            >
              {/* Star / tape */}
              {card.starred ? (
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 border-4 border-black flex items-center justify-center rounded-full font-black text-xl z-10">★</div>
              ) : (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-24 h-8 bg-zinc-300 opacity-80 shadow-sm border border-zinc-400 rotate-2" />
              )}

              {/* Image */}
              <div className="aspect-square overflow-hidden border-2 border-stone-100 bg-stone-50">
                {card.image_base64 ? (
                  <img src={`data:image/png;base64,${card.image_base64}`} alt={card.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : card.image ? (
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container text-outline">
                    <span className="material-symbols-outlined text-6xl">inventory_2</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 space-y-2">
                <h3 className="font-display text-2xl uppercase text-primary border-b-2 border-dashed border-primary pb-1">{card.title}</h3>
                {card.id && <p className="font-data-tabular text-sm text-stone-600">ID: {card.id}</p>}
                <div className="flex justify-between items-center pt-2">
                  <span className="bg-primary text-white text-[10px] px-2 py-1 font-bold uppercase">{card.status}</span>
                  {card.annotation && <span className="font-annotation text-sm text-secondary">{card.annotation}</span>}
                </div>

                {/* Click hint */}
                <div className="text-[10px] font-mono text-stone-400 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view solution ↗
                </div>

                {/* Action buttons for real cards */}
                {!card.isStatic && (
                  <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => toggleStar(e, card.id, card.starred)}
                      className="text-xs font-bold uppercase px-2 py-1 border border-stone-300 hover:bg-yellow-50 transition-colors"
                    >
                      {card.starred ? '★ Unstar' : '☆ Star'}
                    </button>
                    <button
                      onClick={e => deleteCard(e, card.id)}
                      className="text-xs font-bold uppercase px-2 py-1 border border-stone-300 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Draft */}
          <div className="relative bg-white p-6 shadow-xl border-2 border-dashed border-stone-400 rotate-2 hover:rotate-0 transition-transform cursor-pointer flex flex-col justify-center items-center text-center">
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <span className="material-symbols-outlined text-stone-300 text-6xl mb-4">edit_note</span>
            <h3 className="font-display text-2xl uppercase text-stone-400">Draft: Bio-gas Stove</h3>
            <p className="font-annotation text-sm text-stone-400 mt-2">Incomplete documentation...</p>
            <div className="mt-4 px-4 py-1 border border-stone-300 text-stone-400 font-bold text-xs uppercase">Resume Blueprint</div>
          </div>

          {/* Add new */}
          <div className="relative flex flex-col items-center justify-center p-8 border-4 border-dashed border-primary/30 rounded-xl hover:bg-white/20 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">add</span>
            </div>
            <p className="mt-4 font-display text-2xl text-primary uppercase opacity-50">Upload New Legacy</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 flex justify-center">
          <div className="bg-white p-6 border-2 border-black shadow-jugaad-yellow-lg relative max-w-md w-full">
            <div className="absolute -top-3 -left-6 w-20 h-6 bg-zinc-300 -rotate-12 border border-zinc-400 opacity-80" />
            <div className="absolute -top-3 -right-6 w-20 h-6 bg-zinc-300 rotate-12 border border-zinc-400 opacity-80" />
            <h4 className="font-display text-2xl text-center uppercase border-b-2 border-black mb-4">Archive Ledger</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-primary">{allCards.length}</p>
                <p className="text-xs font-bold uppercase text-stone-500">Total Projects</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-secondary">{allCards.filter(c => c.starred).length}</p>
                <p className="text-xs font-bold uppercase text-stone-500">Starred</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Archive;
