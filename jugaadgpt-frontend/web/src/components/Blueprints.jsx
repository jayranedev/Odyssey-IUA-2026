'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from './AppShell';
import { IconSpeaker, IconTools } from './Icons2';
import { authHeaders } from '../services/api';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';
const BLUEPRINT_KEY = 'jg_blueprint';

export const BlueprintsScreen = () => {
  const [bpData, setBpData] = useState(null);
  const [blueprintImage, setBlueprintImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BLUEPRINT_KEY);
      if (raw) setBpData(JSON.parse(raw));
    } catch {}
  }, []);

  const title = bpData?.title || 'Pedal-Powered Irrigation Pump';
  
  // Parse solution string into steps
  const steps = bpData?.solution 
    ? bpData.solution.split('\n').filter(s => s.trim().length > 10)
    : [
        "Secure the bicycle frame to the heavy wooden base using iron clamps.",
        "Connect the rear sprocket to the pump impeller using a standard cycle chain.",
        "Attach the 2-inch PVC pipe to the suction end of the pump. Ensure no air leaks.",
        "Pedal at 60 RPM to start water suction from the source."
      ];

  const materials = bpData?.bazaari_context?.materials || bpData?.materials || [
    { item: 'Old Cycle Frame', quantity: '1 Unit' },
    { item: 'Hand Pump Head', quantity: '1 Unit' },
    { item: 'PVC Pipe (2")', quantity: '10 Feet' }
  ];

  // Load cached blueprint image, or generate one
  useEffect(() => {
    if (!title) return;
    
    const loadOrGenerate = async () => {
      // Try loading cached image first
      try {
        const res = await fetch(`${API_BASE}/api/blueprint-image?title=${encodeURIComponent(title)}`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.image_base64) {
            setBlueprintImage(`data:image/png;base64,${data.image_base64}`);
            return;
          }
        }
      } catch {}

      // No cached image — generate one
      setImageLoading(true);
      try {
        const buildStepsStr = (bpData?.build_steps || steps).slice(0, 3).join(', ');
        const materialsStr = materials.slice(0, 3).map(m => m.item).join(', ');
        const prompt = (
          `Technical blueprint schematic for: ${title}. ` +
          `Materials: ${materialsStr}. Steps: ${buildStepsStr}. ` +
          `Engineering drawing style, blue blueprint paper background, ` +
          `white line drawings, isometric view, labeled parts, Indian jugaad DIY, no text`
        );
        
        const genRes = await fetch(`${API_BASE}/api/generate-image`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ prompt }),
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          if (genData.base64) {
            setBlueprintImage(`data:image/png;base64,${genData.base64}`);
            // Cache for future visits
            fetch(`${API_BASE}/api/blueprint-image`, {
              method: 'POST',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ title, image_base64: genData.base64 }),
            }).catch(() => {});
          }
        }
      } catch {}
      setImageLoading(false);
    };

    loadOrGenerate();
  }, [title]);

  return (
    <AppShell active="blueprints" bgClass="jg2-bg-paper">
      <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>

        <div style={{ marginBottom: 12 }}>
          <Link href="/chat" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
            color: 'var(--jg2-mute)', textDecoration: 'none',
            letterSpacing: '0.05em', fontWeight: 600
          }}>
            ← Back to Chat
          </Link>
        </div>

        {/* Title row */}
        <div style={{ marginBottom: 20 }}>
          <div className="jg2-eyebrow" style={{ marginBottom: 10 }}>{title}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="jg2-chip">Schematic ID: BP-772-IND</span>
            <span className="jg2-chip jg2-chip-rust">Status: Verified Tool</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>

          {/* Blueprint frame */}
          <div style={{ position: 'relative', paddingTop: 14, paddingLeft: 14 }}>
            {/* corner diamonds */}
            <div className="jg2-corner-diamond" style={{ left: -2, top: -2, background: '#9C9DA0' }}/>
            <div className="jg2-corner-diamond" style={{ right: -2, top: -2, background: 'var(--jg2-kraft)' }}/>
            <div className="jg2-corner-diamond" style={{ left: -2, bottom: -2, background: '#9C9DA0' }}/>
            <div className="jg2-corner-diamond" style={{ right: -2, bottom: -2, background: 'var(--jg2-kraft)' }}/>

            <div style={{
              border: '4px solid var(--jg2-ink)',
              background: '#0A1830',
              aspectRatio: '1/1',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* blueprint grid background */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(120,170,230,0.12) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(120,170,230,0.12) 1px, transparent 1px),
                  linear-gradient(rgba(120,170,230,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(120,170,230,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px, 40px 40px, 8px 8px, 8px 8px',
              }}/>

              {/* AI-generated blueprint image or fallback schematic */}
              {blueprintImage ? (
                <img
                  src={blueprintImage}
                  alt={`Blueprint: ${title}`}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    opacity: 0.9,
                    mixBlendMode: 'screen',
                  }}
                />
              ) : imageLoading ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, border: '3px solid #A9C4E5',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    color: '#A9C4E5', textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>
                    Generating blueprint...
                  </div>
                </div>
              ) : (
                /* Fallback: Dynamic Schematic Graphic */
                <div style={{ position: 'absolute', inset: 0, padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
                  {steps.slice(0, 4).map((step, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      transform: `translateX(${idx % 2 === 0 ? 0 : 30}px)`,
                      opacity: 0.9
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'transparent', border: '2px solid #A9C4E5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: '#A9C4E5',
                        flexShrink: 0
                      }}>
                        0{idx + 1}
                      </div>
                      <div style={{
                        flex: 1, height: '1px',
                        background: 'repeating-linear-gradient(90deg, #A9C4E5 0, #A9C4E5 4px, transparent 4px, transparent 8px)'
                      }} />
                      <div style={{
                        background: 'rgba(169, 196, 229, 0.1)', border: '1px solid rgba(169, 196, 229, 0.4)',
                        padding: '8px 12px', borderRadius: 6,
                        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#A9C4E5',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {materials[idx % materials.length]?.item || 'ASSEMBLY PART'}
                      </div>
                    </div>
                  ))}

                  {materials.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: '50%', top: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'var(--jg2-yellow)',
                      border: '2px solid var(--jg2-ink)',
                      padding: '8px 16px',
                      fontSize: 12, fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: 'var(--jg2-ink)',
                      textTransform: 'uppercase',
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
                    }}>
                      CORE: {materials[0].item}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Voice help */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
              <button style={{
                background: 'var(--jg2-yellow)',
                border: '1.5px solid var(--jg2-ink)',
                padding: '10px 18px',
                display: 'inline-flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                boxShadow: '3px 3px 0 var(--jg2-ink)',
              }}>
                <IconSpeaker size={20} stroke={1.7}/>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Hindi/English Help
                  </div>
                  <div style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, fontWeight: 600 }}>
                    आवाज़ सहायता
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Right column — Assembly steps + Materials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Assembly steps */}
            <div style={{
              background: '#E0DCCE',
              border: '1.5px solid var(--jg2-ink)',
              padding: '18px 20px 22px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: 8,
                borderBottom: '1.5px solid var(--jg2-ink)',
                marginBottom: 18,
              }}>
                <span style={{
                  fontFamily: "'Archivo Black', sans-serif", fontWeight: 900,
                  fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>Assembly Steps</span>
                <IconTools size={18} stroke={1.7}/>
              </div>

              {steps.map((s, i) => {
                // If the string starts with something like "1. **Title**:", try to parse it
                let titleMatch = s.match(/^(?:\d+\.)?\s*(?:\*\*)?([^\*:]+)(?:\*\*)?[:\-]?\s*(.*)$/);
                let stitle = `Step ${i + 1}`;
                let sbody = s;
                if (titleMatch && titleMatch[1].length < 40) {
                  stitle = titleMatch[1].trim();
                  sbody = titleMatch[2].trim() || sbody;
                }
                return (
                  <Step key={i} n={i + 1} title={stitle} body={sbody.replace(/\*/g, '')}/>
                );
              })}
            </div>

            {/* Materials needed */}
            <div style={{
              background: 'var(--jg2-ink)',
              color: '#FBF7EC',
              border: '1.5px solid var(--jg2-ink)',
            }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '0.5px solid rgba(255,255,255,0.2)',
                fontFamily: "'Archivo Black', sans-serif", fontWeight: 900,
                fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>
                Materials Needed
              </div>
              {materials.map((m, i) => (
                <MatRow key={i} label={m.item} qty={m.quantity}/>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  );
};

const Step = ({ n, title, body, muted }) => (
  <div style={{
    display: 'flex', gap: 14,
    paddingBottom: 14,
    opacity: muted ? 0.55 : 1,
  }}>
    <div style={{
      width: 26, height: 26, borderRadius: 999,
      background: muted ? 'transparent' : 'var(--jg2-ink)',
      color: muted ? 'var(--jg2-mute)' : '#FBF7EC',
      border: muted ? '1.5px solid var(--jg2-mute)' : 'none',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 13, flexShrink: 0,
    }}>{n}</div>
    <div>
      <div style={{
        fontWeight: 800, fontSize: 12.5, letterSpacing: '0.14em', textTransform: 'uppercase',
        marginTop: 4, marginBottom: 4,
      }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--jg2-graphite)', lineHeight: 1.5 }}>{body}</div>
    </div>
  </div>
);

const MatRow = ({ label, qty }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '11px 16px',
    borderBottom: '0.5px solid rgba(255,255,255,0.12)',
    fontSize: 13.5,
  }}>
    <span>{label}</span>
    <span className="jg2-mono" style={{ fontWeight: 600 }}>{qty}</span>
  </div>
);
