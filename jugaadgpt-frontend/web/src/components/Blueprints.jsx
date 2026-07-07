'use client';
import React, { useEffect, useState } from 'react';
import { AppShell } from './AppShell';
import { IconSpeaker, IconTools } from './Icons2';

const BLUEPRINT_KEY = 'jg_blueprint';

export const BlueprintsScreen = () => {
  const [bpData, setBpData] = useState(null);

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

  const materials = bpData?.bazaari_context?.materials || [
    { item: 'Old Cycle Frame', quantity: '1 Unit' },
    { item: 'Hand Pump Head', quantity: '1 Unit' },
    { item: 'PVC Pipe (2")', quantity: '10 Feet' }
  ];

  return (
    <AppShell active="blueprints" bgClass="jg2-bg-paper">
      <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>

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
              {/* blueprint grid */}
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

              {/* schematic SVG (placeholder pump diagram) */}
              <svg viewBox="0 0 400 400" width="100%" height="100%"
                style={{ position: 'absolute', inset: 0, color: '#A9C4E5' }}>
                <g stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.85">
                  {/* frame outline */}
                  <rect x="40" y="80" width="320" height="240"/>
                  <rect x="56" y="96" width="288" height="208" strokeDasharray="2 3" opacity="0.4"/>
                  {/* cycle frame triangle */}
                  <path d="M90 280 L160 140 L240 280 Z"/>
                  <path d="M160 140 L260 200 L240 280" />
                  {/* wheel */}
                  <circle cx="90" cy="280" r="38"/>
                  <circle cx="90" cy="280" r="8"/>
                  <circle cx="240" cy="280" r="22"/>
                  <circle cx="240" cy="280" r="6"/>
                  {/* spokes */}
                  {Array.from({length:8}).map((_,i)=>(
                    <line key={i} x1="90" y1="280"
                      x2={90+38*Math.cos(i*Math.PI/4)} y2={280+38*Math.sin(i*Math.PI/4)}/>
                  ))}
                  {/* pump body */}
                  <rect x="280" y="180" width="60" height="100"/>
                  <rect x="290" y="160" width="40" height="20"/>
                  <line x1="310" y1="160" x2="310" y2="100"/>
                  <circle cx="310" cy="100" r="14"/>
                  {/* pipe */}
                  <path d="M280 240 L200 240 L200 340"/>
                  <path d="M340 240 L370 240 L370 320"/>
                  {/* dimension lines */}
                  <line x1="40" y1="60" x2="360" y2="60" strokeDasharray="3 3"/>
                  <line x1="40" y1="55" x2="40" y2="65"/>
                  <line x1="360" y1="55" x2="360" y2="65"/>
                  <text x="190" y="55" fill="currentColor" fontSize="9" fontFamily="JetBrains Mono">320 mm</text>
                  {/* labels */}
                  <text x="60" y="350" fill="currentColor" fontSize="8" fontFamily="JetBrains Mono" opacity="0.7">FIG.1 — DRIVE ASSEMBLY</text>
                  <text x="280" y="350" fill="currentColor" fontSize="8" fontFamily="JetBrains Mono" opacity="0.7">FIG.2 — PUMP</text>
                </g>
                {/* callout line to bolt */}
                <g stroke="#F4C61E" strokeWidth="1" opacity="0.9">
                  <path d="M180 200 L220 220" />
                  <circle cx="220" cy="220" r="3" fill="#F4C61E"/>
                </g>
              </svg>

              {/* Yellow callout */}
              <div style={{
                position: 'absolute',
                left: '38%', top: '36%',
                background: 'var(--jg2-yellow)',
                border: '1.5px solid var(--jg2-ink)',
                padding: '5px 10px',
                fontSize: 11, fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--jg2-ink)',
                textTransform: 'uppercase',
                boxShadow: '2px 2px 0 var(--jg2-ink)',
              }}>
                Use 12mm Bolts
              </div>
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
