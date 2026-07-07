// Bazaari.jsx — Bill of Materials with brass receipt + dealer panel.

const BazaariScreen = () => {
  return (
    <AppShell active="bazaari" bgClass="jg2-bg-paper">
      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative' }}>

        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <h1 className="jg2-section-title" style={{
            fontSize: 30, padding: '0 0 4px', borderBottom: '2px solid var(--jg2-ink)',
            display: 'inline-block',
          }}>
            THE BAZAARI
          </h1>
          <div style={{
            display: 'inline-block', borderTop: '0.5px solid var(--jg2-ink)',
            paddingTop: 4, marginTop: 4, marginLeft: 6,
            fontSize: 12, color: 'var(--jg2-graphite)',
          }}>
            Bill of Materials for: <span style={{ fontWeight: 600 }}>Solar-Cycle Frame</span>
          </div>
        </div>

        {/* Brass bill */}
        <div style={{
          border: '3px solid var(--jg2-ink)',
          background: 'linear-gradient(180deg, var(--jg2-kraft-light) 0%, var(--jg2-kraft) 60%, var(--jg2-kraft-deep) 100%)',
          padding: 22,
          position: 'relative',
          marginBottom: 24,
        }}>
          {/* corner cut decoration */}
          <div style={{
            position: 'absolute', left: -2, top: -2,
            width: 24, height: 24,
            background: 'transparent',
            borderTop: '3px solid var(--jg2-ink)',
            borderLeft: '3px solid var(--jg2-ink)',
          }}/>
          <div style={{
            position: 'absolute', right: -2, top: -2,
            width: 0, height: 0,
            borderTop: '20px solid var(--jg2-ink)',
            borderLeft: '20px solid transparent',
          }}/>
          <div style={{
            position: 'absolute', left: -2, bottom: -2,
            width: 0, height: 0,
            borderBottom: '20px solid var(--jg2-ink)',
            borderRight: '20px solid transparent',
          }}/>

          {/* Bill header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 14,
          }}>
            <div style={{
              fontFamily: "'Archivo Black', sans-serif", fontWeight: 900,
              fontSize: 16, letterSpacing: '0.06em',
              color: 'var(--jg2-ink)',
            }}>
              BILL NO: <span style={{ color: 'var(--jg2-ink)' }}>#JG-2023-089</span>
            </div>
            <div className="jg2-mono" style={{
              fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
              color: 'var(--jg2-ink)',
            }}>
              DATE: 24 OCT 2023
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: 'rgba(20, 30, 60, 0.06)',
            border: '1px solid rgba(14,44,90,0.4)',
          }}>
            {/* head */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr',
              padding: '10px 16px',
              background: 'var(--jg2-ink)',
              color: '#FBF7EC',
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              <span>Material</span>
              <span>Quantity</span>
              <span style={{ textAlign: 'right' }}>Est. Price (₹)</span>
            </div>

            {[
              ['Mild Steel Square Pipe (1" x 1")', '12 Feet', '1,440.00'],
              ['L-Angle Iron (25mm)', '6 Feet', '480.00'],
              ['Welding Rods (6013)', '1 Box', '350.00'],
              ['Cycle Hub & Spokes (Rear)', '2 Units', '800.00'],
              ['Threaded Bolts & Nuts (M12)', '12 Pcs', '120.00'],
            ].map(([m, q, p], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr',
                padding: '11px 16px', alignItems: 'center',
                borderBottom: '0.5px dashed rgba(14,44,90,0.35)',
                fontSize: 13.5, color: 'var(--jg2-ink)',
              }}>
                <span>{m}</span>
                <span className="jg2-mono">{q}</span>
                <span className="jg2-mono" style={{ textAlign: 'right', fontWeight: 600 }}>{p}</span>
              </div>
            ))}

            {/* total */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.5)',
              borderTop: '1.5px solid var(--jg2-ink)',
            }}>
              <span/>
              <span style={{
                fontFamily: "'Archivo Black', sans-serif", fontSize: 12,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--jg2-ink)', textAlign: 'right',
              }}>Total Estimated Cost</span>
              <span className="jg2-mono" style={{
                textAlign: 'right', fontWeight: 800, fontSize: 15,
                color: 'var(--jg2-ink)',
              }}>₹ 3,190.00</span>
            </div>
          </div>

          {/* Checked-by stamp */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', marginTop: 14,
          }}>
            <div style={{
              border: '1px dashed rgba(14,44,90,0.4)',
              padding: '8px 14px',
              fontFamily: "'Caveat', cursive",
              color: 'rgba(14,44,90,0.5)',
              fontSize: 14,
              textAlign: 'center',
              minWidth: 130,
            }}>
              Checked By:
              <div className="jg2-mono" style={{
                fontSize: 11, fontWeight: 700, color: 'var(--jg2-ink)',
                letterSpacing: '0.14em', marginTop: 2,
              }}>AUTO-SYSTEM</div>
            </div>
          </div>
        </div>

        {/* Map + dealers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
          {/* Map */}
          <div style={{
            border: '2px solid var(--jg2-ink)',
            background: '#0E2546',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 240,
          }}>
            <div style={{
              padding: '8px 12px',
              background: 'var(--jg2-card)',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
              textTransform: 'uppercase',
              borderBottom: '2px solid var(--jg2-ink)',
            }}>
              Find at Nearest Kabadi-wala
            </div>
            <div style={{ position: 'relative', height: 180 }}>
              {/* mock map */}
              <svg viewBox="0 0 400 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="mapdots" width="14" height="14" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="rgba(120,170,230,0.25)"/>
                  </pattern>
                </defs>
                <rect width="400" height="200" fill="url(#mapdots)"/>
                <path d="M40 70 Q 130 30, 220 90 T 380 80" stroke="rgba(150,200,240,0.4)" strokeWidth="14" fill="none"/>
                <path d="M40 70 Q 130 30, 220 90 T 380 80" stroke="rgba(180,220,250,0.6)" strokeWidth="2" fill="none"/>
                <path d="M50 160 Q 140 130, 240 170" stroke="rgba(150,200,240,0.4)" strokeWidth="10" fill="none"/>
              </svg>
              {/* pins */}
              <Pin x={28} y={42} color="var(--jg2-yellow)"/>
              <Pin x={48} y={56} color="var(--jg2-brick)"/>
              <Pin x={66} y={38} color="var(--jg2-yellow)"/>
              <Pin x={82} y={62} color="var(--jg2-yellow)"/>
            </div>
            <div style={{
              padding: '10px 14px',
              background: 'var(--jg2-card)',
              borderTop: '2px solid var(--jg2-ink)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>3 dealers found within 5km</span>
              <button style={{
                background: 'var(--jg2-yellow)',
                border: '1.5px solid var(--jg2-ink)',
                padding: '5px 12px',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}>Expand Map</button>
            </div>
          </div>

          {/* Dealers */}
          <div style={{
            border: '2px solid var(--jg2-ink)',
            background: 'var(--jg2-card)',
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '2px solid var(--jg2-ink)',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}>
              Verified Dealers
            </div>
            <Dealer name="Sharma Steel Scrap" meta="2.4km · Open now" tone="yellow"/>
            <Dealer name="New Industrial Waste Co." meta="3.8km · Closes 7PM" tone="navy"/>
            <Dealer name="Old Town Recyclers" meta="4.1km · Open now" tone="yellow"/>

            <div style={{
              borderTop: '2px solid var(--jg2-ink)',
              padding: '10px 14px',
              background: 'var(--jg2-brick-soft)',
              fontSize: 11.5,
              color: 'var(--jg2-ink)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--jg2-brick)' }}/>
              <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 10.5 }}>
                Scrap prices fluctuate daily. Call dealer to confirm ₹ per kg.
              </span>
            </div>
          </div>
        </div>

        {/* Pro tip */}
        <div className="jg2-dashed" style={{ position: 'relative', padding: '18px 20px 16px' }}>
          <div style={{
            position: 'absolute', right: -6, top: -14,
            background: 'var(--jg2-yellow-deep)',
            color: '#1A1A1A',
            padding: '4px 10px',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
            border: '1.5px solid var(--jg2-ink)',
          }}>Pro Tip</div>

          <div style={{
            fontFamily: "'Caveat', cursive", fontStyle: 'italic',
            fontSize: 17, color: 'var(--jg2-graphite)', lineHeight: 1.4,
            marginBottom: 14,
          }}>
            "You can save up to <strong style={{ color: 'var(--jg2-brick)' }}>40%</strong> of the total cost by sourcing the MS Square Pipes from the Mandi scrap heap.
            Look for straight pieces without deep rust pitting."
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <button className="jg2-btn-navy" style={{ height: 42 }}>Share Bill PDF</button>
            <button className="jg2-btn-yellow" style={{ height: 42 }}>Order Materials</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const Pin = ({ x, y, color }) => (
  <div style={{
    position: 'absolute',
    left: `${x}%`, top: `${y}%`,
    transform: 'translate(-50%, -100%)',
    color,
  }}>
    <svg width="22" height="28" viewBox="0 0 22 28">
      <path d="M11 27 C 11 27, 2 16, 2 10 A 9 9 0 0 1 20 10 C 20 16, 11 27, 11 27 Z"
        fill="currentColor" stroke="#0E2C5A" strokeWidth="1.2"/>
      <circle cx="11" cy="10" r="3.5" fill="#0E2C5A"/>
    </svg>
  </div>
);

const Dealer = ({ name, meta, tone = 'yellow' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px',
    borderBottom: '0.5px solid rgba(14,44,90,0.18)',
  }}>
    <div style={{
      width: 36, height: 36,
      background: tone === 'yellow' ? 'var(--jg2-yellow)' : 'var(--jg2-ink)',
      color: tone === 'yellow' ? 'var(--jg2-ink)' : 'var(--jg2-yellow)',
      border: '1.5px solid var(--jg2-ink)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IcoStorefront size={20} stroke={1.7}/>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--jg2-mute)' }}>{meta}</div>
    </div>
    <IcoArrowSm size={16} stroke={1.8}/>
  </div>
);

Object.assign(window, { BazaariScreen });
