// MobileView.jsx — JugaadGPT mobile web view (390×844)
// Constraint panel becomes a slide-up sheet; voice is primary input;
// solution BOM is a clean list rather than a table.

const { useState: useS } = React;

const MobileView = () => {
  const [sheetOpen, setSheetOpen] = useS(false);
  const [tab, setTab] = useS('chat');

  return (
    <div style={{
      width: 390, height: 844, position: 'relative',
      background: 'var(--jg-bg)',
      borderRadius: 36,
      border: '8px solid #1A1A1A',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--jg-font-sans)',
    }}>
      {/* status bar */}
      <div style={{
        height: 44, padding: '0 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 13, fontWeight: 600,
        flexShrink: 0,
      }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <span>•••</span><span>◑</span><span>▮</span>
        </span>
      </div>

      {/* top bar */}
      <div style={{
        padding: '8px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--jg-border)',
      }}>
        <JugaadWordmark size={22} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--jg-charcoal)' }} className="jg-deva">हिं</span>
          <div className="jg-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>R</div>
        </div>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* user msg */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '85%',
                      background: 'var(--jg-ink)', color: 'var(--jg-paper)',
                      padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.5 }}>
          ₹500 mein vegetable cooler banao, no electricity. Rajasthan mein hoon.
        </div>

        {/* assistant solution — compact mobile version */}
        <div className="jg-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: '0.5px solid var(--jg-border)' }}>
            <div className="jg-eyebrow" style={{ marginBottom: 6, fontSize: 10 }}>Solution</div>
            <h3 className="jg-serif" style={{ margin: 0, fontSize: 18, lineHeight: 1.2, fontWeight: 500 }}>
              Zeer pot — vegetable cooler
            </h3>
            <span className="jg-pill jg-pill-sage" style={{ height: 22, fontSize: 11, marginTop: 8 }}>
              <IconCheck size={11} /> Validated · 12 users
            </span>
          </div>

          <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6,
                        borderBottom: '0.5px solid var(--jg-border)' }}>
            <Chip icon={<IconRupee size={11} />} label="₹287 / ₹500" tone="sage" />
            <Chip icon={<IconBoltSlash size={11} />} label="No power" tone="sage" />
            <Chip icon={<IconClock size={11} />} label="2 hr" tone="sage" />
          </div>

          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--jg-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Bill of materials</div>
            <div className="jg-mono" style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Bada matka', '₹180', 'kumhar'],
                ['Chhota matka', '₹80', 'kumhar'],
                ['River sand', 'free', 'riverside'],
                ['Wet jute cloth', '₹27', 'kabadiwala'],
                ['Water 2L × 2', 'free', 'household'],
              ].map(([n, c, src], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ flex: 1 }}>{n}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--jg-charcoal-2)' }}>{src}</span>
                  <span style={{ minWidth: 40, textAlign: 'right',
                                 color: c === 'free' ? 'var(--jg-sage-deep)' : 'var(--jg-text)',
                                 fontWeight: 500 }}>{c}</span>
                </div>
              ))}
              <div style={{ borderTop: '0.5px solid var(--jg-border)', paddingTop: 6, marginTop: 2,
                            display: 'flex', fontWeight: 600, fontSize: 13 }}>
                <span style={{ flex: 1 }}>Total</span><span>₹287</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 14px',
                        background: 'color-mix(in oklab, var(--jg-mustard) 7%, var(--jg-surface))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--jg-mustard-deep)' }}>
              <IconWarn size={13} /> If this doesn't work — 3 fixes
            </div>
          </div>

          <div style={{ padding: 10, display: 'flex', gap: 6 }}>
            <button className="jg-btn jg-btn-sage" style={{ flex: 1, height: 36, fontSize: 12.5 }}>
              <IconCheck size={13} /> Worked
            </button>
            <button className="jg-btn jg-btn-mustard" style={{ flex: 1, height: 36, fontSize: 12.5 }}>
              Didn't work
            </button>
          </div>
        </div>

        {/* constraint chip — opens sheet */}
        <button onClick={() => setSheetOpen(true)}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--jg-surface)', border: '0.5px solid var(--jg-border)',
            padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            fontSize: 12, color: 'var(--jg-charcoal)', fontFamily: 'inherit',
          }}>
          <IconRuler size={13} stroke="var(--jg-terracotta-deep)" />
          7 constraints set <IconChevUp size={13} />
        </button>
      </div>

      {/* input */}
      <div style={{ padding: '8px 12px 10px', borderTop: '0.5px solid var(--jg-border)',
                    background: 'var(--jg-bg)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--jg-surface)', border: '0.5px solid var(--jg-border-strong)',
          borderRadius: 999, padding: '6px 6px 6px 14px',
        }}>
          <input className="jg-input jg-deva" placeholder="अपनी problem batayein…"
                 style={{ flex: 1, fontSize: 13.5, padding: '6px 0' }} />
          <button className="jg-btn jg-btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: 999 }}>
            <IconCamera size={16} />
          </button>
        </div>
        <button className="jg-btn jg-btn-primary" style={{
          width: '100%', height: 48, marginTop: 8, borderRadius: 999, fontSize: 14,
        }}>
          <span className="jg-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--jg-paper)' }} />
          <IconMic size={18} stroke="var(--jg-paper)" />
          Tap to speak
        </button>
      </div>

      {/* bottom nav */}
      <div style={{
        padding: '6px 12px 10px', borderTop: '0.5px solid var(--jg-border)',
        display: 'flex', justifyContent: 'space-around',
        background: 'var(--jg-bg)',
      }}>
        {[
          { id: 'chat', label: 'Chat', icon: IconChat },
          { id: 'saved', label: 'Saved', icon: IconSaved },
          { id: 'community', label: 'Community', icon: IconCommunity },
        ].map(t => {
          const I = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '6px 4px', border: 0, background: 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                color: tab === t.id ? 'var(--jg-terracotta-deep)' : 'var(--jg-charcoal)',
                fontSize: 10, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              }}>
              <I size={20} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* slide-up sheet */}
      {sheetOpen && (
        <>
          <div onClick={() => setSheetOpen(false)} style={{
            position: 'absolute', inset: 0,
            background: 'rgba(20,15,10,0.4)',
            zIndex: 6,
            animation: 'jg-fade-up .2s both',
          }} />
          <div className="jg-anim-up" style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: 'var(--jg-surface)',
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            border: '0.5px solid var(--jg-border)',
            zIndex: 7,
            maxHeight: '80%',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--jg-border-strong)' }} />
            </div>
            <div style={{ padding: '4px 18px 14px', borderBottom: '0.5px solid var(--jg-border)' }}>
              <div className="jg-eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>Constraint trace</div>
              <h3 className="jg-serif" style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>What I understood</h3>
            </div>
            <div style={{ padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { l: 'Budget', v: '₹500', i: <IconRupee size={13} /> },
                { l: 'Location', v: 'Rajasthan', i: <IconLocation size={13} /> },
                { l: 'Power', v: 'None', i: <IconBoltSlash size={13} /> },
                { l: 'Season', v: 'Summer · hot arid', i: <IconSun size={13} /> },
                { l: 'Volume', v: '20 kg/day · leafy greens', i: <IconBox size={13} /> },
              ].map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: 'var(--jg-surface-2)',
                  border: '0.5px solid var(--jg-border)',
                  borderRadius: 10,
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6,
                    background: 'color-mix(in oklab, var(--jg-terracotta) 10%, transparent)',
                    color: 'var(--jg-terracotta-deep)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{c.i}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--jg-charcoal)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{c.l}</div>
                    <div className="jg-mono" style={{ fontSize: 12.5 }}>{c.v}</div>
                  </div>
                  <IconEdit size={13} stroke="var(--jg-charcoal)" />
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderTop: '0.5px solid var(--jg-border)' }}>
              <button onClick={() => setSheetOpen(false)} className="jg-btn" style={{ width: '100%' }}>
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

window.MobileView = MobileView;
