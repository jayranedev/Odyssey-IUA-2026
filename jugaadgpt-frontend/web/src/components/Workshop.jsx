import React from 'react';
import { AppShell } from './AppShell';
import { IconPencil, IconListCheck, IconCamera, IconWallet, IconSparkle, IconTools, IconPlus, IconX } from './Icons2';

export const WorkshopScreen = () => {
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
            padding: '14px 18px',
            borderBottom: '1.5px solid var(--jg2-ink)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconListCheck size={18} stroke={1.7} />
              <span className="jg2-eyebrow">The Problem</span>
            </div>
            <span className="jg2-mono" style={{ fontSize: 11, color: 'var(--jg2-mute)' }}>
              Line no. 001
            </span>
          </div>
          <div style={{ padding: '22px 22px 28px', minHeight: 132 }}>
            <textarea
              className="jg2-mono"
              defaultValue=""
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

        {/* Two columns: Available Scraps + Budget */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18, marginBottom: 28 }}>

          {/* Available scraps */}
          <div className="jg2-card">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1.5px solid var(--jg2-ink)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconListCheck size={18} stroke={1.7}/>
                <span className="jg2-eyebrow">Available Scraps</span>
              </div>
              <button className="jg2-btn-navy" style={{ height: 30, padding: '0 12px', fontSize: 11 }}>
                <IconCamera size={14} stroke={1.7}/> Scan Item
              </button>
            </div>

            <div style={{ padding: 4 }}>
              <ScrapRow num="01" label="Old cycle rim" />
              <ScrapRow num="02" label="PVC pipe (2 meters)" />
              <ScrapRow num="03" label="Add more scrap…" muted />

              {/* Scanner active panel */}
              <div className="jg2-dashed" style={{
                margin: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 56, height: 44,
                  background: '#1A1A1A',
                  position: 'relative',
                  border: '1px solid rgba(14,44,90,0.4)',
                  flexShrink: 0,
                }}>
                  {/* mock viewfinder */}
                  <div style={{
                    position: 'absolute', inset: 4,
                    border: '1px solid rgba(244,198,30,0.6)',
                  }}/>
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    width: 8, height: 8, marginLeft: -4, marginTop: -4,
                    background: 'rgba(244,198,30,0.9)',
                  }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: 'var(--jg2-ink)', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    Scanner Active
                    <span style={{
                      width: 6, height: 6, borderRadius: 999,
                      background: 'var(--jg2-brick)',
                      boxShadow: '0 0 0 2px rgba(194,79,44,0.25)',
                    }}/>
                  </div>
                  <div className="jg2-mono" style={{ fontSize: 12, color: 'var(--jg2-mute)', marginTop: 4 }}>
                    Vintage camera detection running…
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="jg2-card">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              borderBottom: '1.5px solid var(--jg2-ink)',
            }}>
              <IconWallet size={18} stroke={1.7}/>
              <span className="jg2-eyebrow">Budget</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{
                background: '#E5EAF6',
                border: '1.5px solid var(--jg2-ink)',
                padding: '28px 16px 22px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  fontWeight: 700, color: 'var(--jg2-ink)',
                }}>
                  Indian Rupees (₹)
                </div>
                <div className="jg2-mono" style={{
                  fontSize: 36, fontWeight: 700, color: 'var(--jg2-ink)',
                  marginTop: 6, letterSpacing: '0.02em',
                }}>
                  500
                </div>
                <div style={{
                  height: 2, background: 'var(--jg2-ink)',
                  width: '60%', margin: '8px auto 0',
                }}/>
              </div>
              <div className="jg2-hand" style={{
                textAlign: 'center', marginTop: 14,
                fontSize: 17, color: 'var(--jg2-graphite)',
              }}>
                "Build it cheap, build it strong."
              </div>
            </div>
          </div>
        </div>

        {/* Generate solution row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, marginBottom: 14, position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(2px)' }}>
            <span className="jg2-hand" style={{ color: 'var(--jg2-brick)', fontSize: 18 }}>
              Click to build
            </span>
            <svg width="44" height="28" viewBox="0 0 60 30" fill="none"
              style={{ color: 'var(--jg2-brick)' }}>
              <path d="M2 8 C 18 4, 32 16, 50 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
              <path d="M44 13 L51 19 L43 22" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <a href="/chat" style={{
            background: 'var(--jg2-yellow)',
            border: '2px solid var(--jg2-ink)',
            color: 'var(--jg2-ink)',
            padding: '18px 32px',
            fontFamily: "'Archivo Black', 'Arial Black', Impact, sans-serif",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '5px 5px 0 var(--jg2-ink)',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            textDecoration: 'none'
          }}>
            Generate Solution <IconSparkle size={18} stroke={2}/>
          </a>
        </div>

        {/* Footer meta */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          paddingTop: 12,
        }}>
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

const ScrapRow = ({ num, label, muted }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 18,
    padding: '14px 16px',
    borderBottom: '0.5px dashed rgba(14,44,90,0.3)',
  }}>
    <span className="jg2-mono" style={{
      fontWeight: 700, fontSize: 13,
      color: muted ? 'var(--jg2-mute)' : 'var(--jg2-ink)',
      width: 26,
    }}>{num}.</span>
    <span style={{
      flex: 1,
      fontSize: 13.5, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: muted ? 'var(--jg2-mute)' : 'var(--jg2-ink)',
    }}>{label}</span>
    {muted
      ? <IconPlus size={16} stroke={1.8} style={{ color: 'var(--jg2-mute)' }}/>
      : <IconX size={15} stroke={1.8} style={{ color: 'var(--jg2-brick)' }}/>}
  </div>
);
