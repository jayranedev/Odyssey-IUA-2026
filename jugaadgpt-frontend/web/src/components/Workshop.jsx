'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from './AppShell';
import { IconPencil, IconListCheck, IconCamera, IconWallet, IconSparkle, IconTools, IconPlus, IconX } from './Icons2';
import { authHeaders } from '../services/api';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';
const WORKSHOP_KEY = 'jg_workshop_draft';

function compressToBase64(file, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.split(',')[1]); 
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const WorkshopScreen = () => {
  const router = useRouter();
  const [problem, setProblem] = useState('');
  const [scraps, setScraps] = useState(['Old cycle rim', 'PVC pipe (2 meters)', '']);
  const [budget, setBudget] = useState(500);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const scanInputRef = useRef(null);

  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleScanItem = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanError('');
    try {
      const base64 = await compressToBase64(file, 1024, 0.82);
      const res = await fetch(`${API_BASE}/api/ocr`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ image_base64: base64, image_type: file.type || 'image/jpeg' }),
      });
      if (!res.ok) throw new Error('OCR failed');
      const { items } = await res.json();
      if (!items?.length) { setScanError('No items detected — try a clearer photo'); return; }
      setScraps(prev => {
        const existing = prev.filter(Boolean);
        const deduped = items.filter(i => !existing.some(e => e.toLowerCase() === i.toLowerCase()));
        return [...existing, ...deduped, ''];
      });
    } catch {
      setScanError('Could not scan — check your connection');
    } finally {
      setScanning(false);
    }
  };

  const handleGenerate = async () => {
    if (!problem.trim() || generating) return;
    setGenerating(true);

    let imageBase64 = null;
    if (imageFile) {
      try { imageBase64 = await compressToBase64(imageFile); } catch {}
    }

    const ctx = {
      title: problem.substring(0, 60),
      scraps: scraps.filter(Boolean),
      budget,
      imageBase64,
      imageType: imageFile?.type || null,
      prompt: [
        `Problem: ${problem}`,
        scraps.filter(Boolean).length ? `Scraps available: ${scraps.filter(Boolean).join(', ')}` : '',
        `Budget: ₹${budget}`,
        imageBase64 ? '(photo of scraps/materials attached)' : '',
      ].filter(Boolean).join('\n'),
    };

    localStorage.setItem(WORKSHOP_KEY, JSON.stringify(ctx));
    router.push('/chat?from=workshop');
  };

  return (
    <AppShell active="workshop" bgClass="jg2-bg-grid">
      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative', paddingTop: 8 }}>
        <div style={{ marginBottom: 22 }}>
          <h1 className="jg2-section-title" style={{ marginBottom: 10 }}>The Workshop</h1>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <IconPencil size={18} stroke={1.6} style={{ color: 'var(--jg2-brick)', marginTop: 1, transform: 'rotate(-12deg)' }}/>
            <div className="jg2-hand" style={{ fontSize: 22, color: 'var(--jg2-graphite)', lineHeight: 1.1 }}>
              Log your problem. Use what you have. Build what you need.
            </div>
          </div>
        </div>

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
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What needs fixing or building? (e.g. My water pump handle broke, need a manual grain thresher…)"
              style={{
                width: '100%', minHeight: 96, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: 14.5, lineHeight: 1.6, color: 'var(--jg2-graphite)', resize: 'none',
              }}
            />
          </div>
        </div>

        <div className="jg2-workshop-grid">
          <div className="jg2-card">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1.5px solid var(--jg2-ink)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconListCheck size={18} stroke={1.7}/>
                <span className="jg2-eyebrow">Available Scraps</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {scanError && <span style={{ fontSize: 11, color: 'var(--jg2-brick)' }}>{scanError}</span>}
                <button 
                  onClick={() => scanInputRef.current?.click()} 
                  disabled={scanning}
                  className="jg2-btn-navy" 
                  style={{ height: 30, padding: '0 12px', fontSize: 11, opacity: scanning ? 0.6 : 1 }}
                >
                  <IconCamera size={14} stroke={1.7}/> {scanning ? 'SCANNING...' : 'SCAN ITEM'}
                </button>
                <input
                  ref={scanInputRef} type="file" accept="image/*" className="hidden"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanItem(f); e.target.value = ''; }}
                />
              </div>
            </div>
            <div style={{ padding: 4 }}>
              {scraps.map((scrap, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', gap: 18, padding: '14px 16px', borderBottom: '0.5px dashed rgba(14,44,90,0.3)',
                }}>
                  <span className="jg2-mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--jg2-ink)', width: 26 }}>
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <input
                    type="text"
                    value={scrap}
                    onChange={(e) => {
                      const newScraps = [...scraps];
                      newScraps[index] = e.target.value;
                      setScraps(newScraps);
                    }}
                    placeholder={index === scraps.length - 1 ? 'Add more scrap…' : ''}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--jg2-ink)',
                    }}
                  />
                  {scrap ? (
                    <button onClick={() => setScraps(scraps.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <IconX size={15} stroke={1.8} style={{ color: 'var(--jg2-brick)' }}/>
                    </button>
                  ) : (
                    <button onClick={() => setScraps([...scraps, ''])} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <IconPlus size={16} stroke={1.8} style={{ color: 'var(--jg2-mute)' }}/>
                    </button>
                  )}
                </div>
              ))}

              {scanning && (
                <div className="jg2-dashed" style={{ margin: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 44, background: '#1A1A1A', position: 'relative', border: '1px solid rgba(14,44,90,0.4)', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(244,198,30,0.6)' }}/>
                    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, marginLeft: -4, marginTop: -4, background: 'rgba(244,198,30,0.9)', animation: 'jg-pulse 1s infinite' }}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--jg2-ink)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Scanner Active <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--jg2-brick)', boxShadow: '0 0 0 2px rgba(194,79,44,0.25)' }}/>
                    </div>
                    <div className="jg2-mono" style={{ fontSize: 12, color: 'var(--jg2-mute)', marginTop: 4 }}>
                      Analyzing image…
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                  onChange={(e) => setBudget(Number(e.target.value))}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none', width: '100%', textAlign: 'center',
                    fontSize: 36, fontWeight: 700, color: 'var(--jg2-ink)', marginTop: 6, letterSpacing: '0.02em', fontFamily: 'JetBrains Mono, monospace'
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(2px)' }}>
            <span className="jg2-hand" style={{ color: 'var(--jg2-brick)', fontSize: 18 }}>Click to build</span>
            <svg width="44" height="28" viewBox="0 0 60 30" fill="none" style={{ color: 'var(--jg2-brick)' }}>
              <path d="M2 8 C 18 4, 32 16, 50 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
              <path d="M44 13 L51 19 L43 22" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={!problem.trim() || generating}
            style={{
              background: 'var(--jg2-yellow)', border: '2px solid var(--jg2-ink)', color: 'var(--jg2-ink)', padding: '18px 32px',
              fontFamily: "'Archivo Black', 'Arial Black', Impact, sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase',
              boxShadow: '5px 5px 0 var(--jg2-ink)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12, opacity: (!problem.trim() || generating) ? 0.6 : 1
            }}
          >
            {generating ? 'PREPARING...' : 'GENERATE SOLUTION'} <IconSparkle size={18} stroke={2}/>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12 }}>
          <div className="jg2-mono" style={{ fontSize: 11, color: 'var(--jg2-mute)', lineHeight: 1.6 }}>
            FORM ID: JUGAAD-2024-WKS<br/>LOCALITY: RURAL FABRICATION UNIT 7
          </div>
          <IconTools size={20} stroke={1.6} style={{ color: 'var(--jg2-mute)' }}/>
        </div>
      </div>
    </AppShell>
  );
};
