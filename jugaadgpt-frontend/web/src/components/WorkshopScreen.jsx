'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from './AppShell';
import { IconPencil, IconListCheck, IconCamera, IconWallet, IconSparkle, IconTools, IconPlus, IconX } from './Icons2';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';
const WORKSHOP_KEY = 'jg_workshop_draft';

export const WorkshopScreen = () => {
  const router = useRouter();
  const [problem, setProblem] = useState('');
  const [scraps, setScraps] = useState(['Old cycle rim', 'PVC pipe (2 meters)', '']);
  const [budget, setBudget] = useState(500);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  const addScrap = (name) =>
    setScraps(prev => {
      const filled = prev.filter(s => s);
      return [...filled, name, ''];
    });

  const handleImageFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImagePreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/api/vision`, { method: 'POST', body: form });
      if (res.ok) {
        const { materials } = await res.json();
        materials.forEach(m => addScrap(m));
      }
    } catch { /* vision best-effort */ }
    setScanning(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const handleGenerate = () => {
    if (!problem.trim()) return;
    const filledScraps = scraps.filter(s => s.trim());
    const parts = [problem.trim()];
    if (filledScraps.length) parts.push(`Available scraps: ${filledScraps.join(', ')}`);
    if (budget) parts.push(`Budget: ₹${budget}`);
    const ctx = {
      prompt: parts.join('\n'),
      title: problem.trim().slice(0, 80),
      scraps: filledScraps,
      budget: budget || null,
    };
    localStorage.setItem(WORKSHOP_KEY, JSON.stringify(ctx));
    router.push('/chat?from=workshop');
  };

  return (
    <AppShell active="workshop" bgClass="jg2-bg-grid">
      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative', paddingTop: 8 }}>

        {/* Title block */}
        <div style={{ marginBottom: 22 }}>
          <h1 className="jg2-section-title" style={{ marginBottom: 10 }}>The Workshop</h1>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <IconPencil size={18} stroke={1.6} style={{ color: 'var(--jg2-brick)', marginTop: 1, transform: 'rotate(-12deg)' }}/>
            <div className="jg2-hand" style={{ fontSize: 22, color: 'var(--jg2-graphite)', lineHeight: 1.1 }}>
              Log your problem. Use what you have. Build what you need.
            </div>
          </div>
        </div>

        {/* The Problem card */}
        <div className="jg2-card" style={{ marginBottom: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1.5px solid var(--jg2-ink)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconListCheck size={18} stroke={1.7} />
              <span className="jg2-eyebrow">The Problem</span>
            </div>
            <span className="jg2-mono" style={{ fontSize: 11, color: 'var(--jg2-mute)' }}>Line no. 001</span>
          </div>
          <div style={{ padding: '22px 22px 28px', minHeight: 132 }}>
            <textarea
              className="jg2-mono"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              placeholder="What needs fixing or building? (e.g. My water pump handle broke, need a manual grain thresher…)"
              style={{
                width: '100%', minHeight: 96,
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: 14.5, lineHeight: 1.6,
                color: 'var(--jg2-graphite)', resize: 'none',
              }}
            />
          </div>
        </div>

        {/* Two columns: Scraps + Budget */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18, marginBottom: 28 }}>

          {/* Available scraps */}
          <div className="jg2-card">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1.5px solid var(--jg2-ink)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconListCheck size={18} stroke={1.7}/>
                <span className="jg2-eyebrow">Available Scraps</span>
              </div>
              <button
                className="jg2-btn-navy"
                style={{ height: 30, padding: '0 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => fileRef.current?.click()}
              >
                <IconCamera size={14} stroke={1.7}/> Scan Item
              </button>
            </div>

            {/* Scrap rows */}
            <div style={{ padding: '4px 4px 0' }}>
              {scraps.map((scrap, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '10px 16px', borderBottom: '0.5px dashed rgba(14,44,90,0.3)',
                }}>
                  <span className="jg2-mono" style={{ fontWeight: 700, fontSize: 13, color: scrap ? 'var(--jg2-ink)' : 'var(--jg2-mute)', width: 26 }}>
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <input
                    value={scrap}
                    onChange={e => {
                      const next = [...scraps];
                      next[idx] = e.target.value;
                      if (idx === scraps.length - 1 && e.target.value) next.push('');
                      setScraps(next);
                    }}
                    placeholder={idx === scraps.length - 1 ? 'Add more scrap…' : ''}
                    style={{
                      flex: 1, border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 13.5, fontWeight: 600, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: scrap ? 'var(--jg2-ink)' : 'var(--jg2-mute)',
                    }}
                  />
                  {scrap
                    ? <button onClick={() => setScraps(scraps.filter((_, i) => i !== idx))}>
                        <IconX size={15} stroke={1.8} style={{ color: 'var(--jg2-brick)' }}/>
                      </button>
                    : <IconPlus size={16} stroke={1.8} style={{ color: 'var(--jg2-mute)' }}/>
                  }
                </div>
              ))}
            </div>

            {/* Image drop zone */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageFile(e.target.files?.[0])} />
            <div
              ref={dropRef}
              className="jg2-dashed"
              style={{
                margin: 12, padding: '18px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', minHeight: 130, gap: 8, position: 'relative',
                background: imagePreview ? 'transparent' : undefined,
              }}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => !imagePreview && fileRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Scrap" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain', border: '1.5px solid var(--jg2-ink)' }} />
                  <button
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'var(--jg2-brick)', color: '#fff',
                      border: 'none', borderRadius: '50%', width: 20, height: 20,
                      cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={e => { e.stopPropagation(); setImagePreview(null); }}
                  >✕</button>
                  <div className="jg2-mono" style={{ fontSize: 11, color: scanning ? 'var(--jg2-brick)' : 'var(--jg2-mute)' }}>
                    {scanning ? '⟳ Scanning for materials…' : '✓ Scan complete — scraps auto-added'}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, color: 'var(--jg2-mute)' }}>📷</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--jg2-ink)' }}>
                      Drop Scrap Photo Here
                    </div>
                    <div className="jg2-hand" style={{ fontSize: 13, color: 'var(--jg2-graphite)' }}>
                      AI auto-detects materials
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="jg2-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1.5px solid var(--jg2-ink)' }}>
              <IconWallet size={18} stroke={1.7}/>
              <span className="jg2-eyebrow">Budget</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ background: '#E5EAF6', border: '1.5px solid var(--jg2-ink)', padding: '28px 16px 22px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--jg2-ink)' }}>
                  Indian Rupees (₹)
                </div>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="jg2-mono"
                  style={{
                    fontSize: 36, fontWeight: 700, color: 'var(--jg2-ink)',
                    marginTop: 6, letterSpacing: '0.02em', width: '100%',
                    border: 'none', outline: 'none', background: 'transparent', textAlign: 'center',
                  }}
                />
                <div style={{ height: 2, background: 'var(--jg2-ink)', width: '60%', margin: '8px auto 0' }}/>
              </div>
              <div className="jg2-hand" style={{ textAlign: 'center', marginTop: 14, fontSize: 17, color: 'var(--jg2-graphite)' }}>
                "Build it cheap, build it strong."
              </div>
            </div>
          </div>
        </div>

        {/* Generate solution */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(2px)' }}>
            <span className="jg2-hand" style={{ color: 'var(--jg2-brick)', fontSize: 18 }}>Click to build</span>
            <svg width="44" height="28" viewBox="0 0 60 30" fill="none" style={{ color: 'var(--jg2-brick)' }}>
              <path d="M2 8 C 18 4, 32 16, 50 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
              <path d="M44 13 L51 19 L43 22" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!problem.trim()}
            style={{
              background: problem.trim() ? 'var(--jg2-yellow)' : '#ddd',
              border: '2px solid var(--jg2-ink)', color: 'var(--jg2-ink)',
              padding: '18px 32px',
              fontFamily: "'Archivo Black', 'Arial Black', Impact, sans-serif",
              fontWeight: 900, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase',
              boxShadow: problem.trim() ? '5px 5px 0 var(--jg2-ink)' : 'none',
              cursor: problem.trim() ? 'pointer' : 'default',
              display: 'inline-flex', alignItems: 'center', gap: 12,
              transition: 'all 0.15s',
            }}
          >
            Generate Solution <IconSparkle size={18} stroke={2}/>
          </button>
        </div>

        {/* Footer meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12 }}>
          <div className="jg2-mono" style={{ fontSize: 11, color: 'var(--jg2-mute)', lineHeight: 1.6 }}>
            FORM ID: JUGAAD-2024-WKS<br/>
            LOCALITY: RURAL FABRICATION UNIT 7
          </div>
          <IconTools size={20} stroke={1.6} style={{ color: 'var(--jg2-mute)' }}/>
        </div>
      </div>
    </AppShell>
  );
};
