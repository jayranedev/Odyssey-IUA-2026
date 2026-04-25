// ChatScreen.jsx — JugaadGPT desktop chat
// Renders the full conversational interface with three states:
//  - empty (centered matka, three example prompts)
//  - conversation (assistant + user bubbles, typing dots)
//  - solution (full solution card embedded as an assistant message)
// Pulls the live-extracted constraints out so the parent page can render
// them in the constraint-trace side panel.

const { useState, useRef, useEffect } = React;

// ─── shared sub-components ────────────────────────────────────

const TopBar = ({ theme, onToggleTheme, onReset, lang, onLang, panelOpen, onTogglePanel }) => (
  <div style={{
    height: 60, padding: '0 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--jg-bg)',
    borderBottom: '0.5px solid var(--jg-border)',
    position: 'sticky', top: 0, zIndex: 5,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <JugaadWordmark size={26} />
      <span style={{
        fontSize: 11, padding: '2px 7px', borderRadius: 999,
        border: '0.5px solid var(--jg-border)',
        color: 'var(--jg-charcoal)',
        fontFamily: 'var(--jg-font-mono)',
      }}>v0.4 — beta</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="jg-btn jg-btn-ghost" onClick={onReset}
        style={{ height: 34, padding: '0 12px', fontSize: 13 }}>
        <IconPlus size={16} /> New
      </button>
      <div style={{
        display: 'flex', height: 34, padding: 2,
        border: '0.5px solid var(--jg-border)',
        borderRadius: 999, background: 'var(--jg-surface)',
      }}>
        {['हिं', 'EN'].map(l => (
          <button key={l} onClick={() => onLang(l)}
            className={l === 'हिं' ? 'jg-deva' : ''}
            style={{
              border: 0, height: 30, padding: '0 12px', borderRadius: 999, cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              background: lang === l ? 'var(--jg-ink)' : 'transparent',
              color: lang === l ? 'var(--jg-paper)' : 'var(--jg-charcoal)',
              transition: 'background .14s, color .14s',
            }}>
            {l}
          </button>
        ))}
      </div>
      <button className="jg-btn jg-btn-ghost" onClick={onToggleTheme}
        title={theme === 'day' ? 'Switch to night' : 'Switch to day'}
        style={{ width: 36, height: 36, padding: 0, borderRadius: 999 }}>
        {theme === 'day' ? <IconMoon size={18} /> : <IconSun size={18} />}
      </button>
      <button className="jg-btn jg-btn-ghost" onClick={onTogglePanel}
        title="Toggle constraint trace"
        style={{ width: 36, height: 36, padding: 0, borderRadius: 999,
                 background: panelOpen ? 'color-mix(in oklab, var(--jg-terracotta) 12%, transparent)' : 'transparent',
                 color: panelOpen ? 'var(--jg-terracotta-deep)' : undefined }}>
        <IconRuler size={18} />
      </button>
      <div style={{ width: 1, height: 22, background: 'var(--jg-border)', margin: '0 4px' }} />
      <div className="jg-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>R</div>
    </div>
  </div>
);

// constraint pill used in chat bubbles ("extracted: ₹500")
const Chip = ({ icon, label, tone = 'default' }) => (
  <span className={`jg-pill ${tone === 'sage' ? 'jg-pill-sage' : tone === 'mustard' ? 'jg-pill-mustard' : tone === 'terra' ? 'jg-pill-terra' : ''}`}
        style={{ height: 26, fontSize: 12, padding: '0 10px' }}>
    {icon}{label}
  </span>
);

// assistant + user messages
const AssistantMsg = ({ children, time = "Just now" }) => (
  <div className="jg-anim-up" style={{ display: 'flex', gap: 12, maxWidth: 720, margin: '0 auto 18px', width: '100%' }}>
    <div style={{ flexShrink: 0 }}>
      <JugaadMark size={32} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span className="jg-serif" style={{ fontSize: 14, fontWeight: 500 }}>JugaadGPT</span>
        <span style={{ fontSize: 11, color: 'var(--jg-charcoal-2)' }}>{time}</span>
      </div>
      <div className="jg-card" style={{ padding: 16, background: 'var(--jg-surface)' }}>
        {children}
      </div>
    </div>
  </div>
);

const UserMsg = ({ children, time = "Just now" }) => (
  <div className="jg-anim-up" style={{ display: 'flex', gap: 12, maxWidth: 720, margin: '0 auto 18px', width: '100%', flexDirection: 'row-reverse' }}>
    <div className="jg-avatar" style={{ flexShrink: 0 }}>R</div>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexDirection: 'row-reverse' }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>You</span>
        <span style={{ fontSize: 11, color: 'var(--jg-charcoal-2)' }}>{time}</span>
      </div>
      <div style={{
        padding: '12px 16px',
        background: 'var(--jg-ink)',
        color: 'var(--jg-paper)',
        borderRadius: 12,
        maxWidth: '90%',
        lineHeight: 1.55,
      }}>
        {children}
      </div>
    </div>
  </div>
);

// ─── empty state ─────────────────────────────────────────────

const EXAMPLES = [
  { hi: '₹500 mein vegetable cooler banao, no electricity', en: 'Build a vegetable cooler for ₹500 with no electricity', icon: <IconMatka size={18} /> },
  { hi: 'Workshop ki photo se tool stand suggest karo', en: 'Photograph my workshop, suggest a tool stand', icon: <IconCamera size={18} /> },
  { hi: 'Pump water from a 20ft well without a motor', en: 'Pump water from a 20ft well without a motor', icon: <IconDrop size={18} /> },
];

const EmptyState = ({ lang, onPick }) => (
  <div className="jg-anim-up" style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 24px',
    maxWidth: 760, margin: '0 auto',
  }}>
    <div style={{ position: 'relative', marginBottom: 28 }}>
      <JugaadMark size={88} />
      {/* tiny notebook coffee-ring stain for character */}
      <div aria-hidden style={{
        position: 'absolute', left: -28, top: 18, width: 38, height: 38,
        border: '1.5px solid color-mix(in oklab, var(--jg-mustard) 60%, transparent)',
        borderRadius: 999,
        opacity: 0.5,
        transform: 'rotate(-12deg) scaleX(1.1)',
      }} />
    </div>
    <h1 className="jg-serif" style={{
      fontSize: 38, lineHeight: 1.15, margin: 0, textAlign: 'center', maxWidth: 560,
      textWrap: 'pretty', fontWeight: 400,
    }}>
      What are you trying to build?
    </h1>
    <p style={{
      marginTop: 14, marginBottom: 36, maxWidth: 520,
      color: 'var(--jg-charcoal)', fontSize: 16, lineHeight: 1.5,
      textAlign: 'center', textWrap: 'pretty',
    }}>
      Tell me your constraints. Budget, materials, where you are.
      I'll find a solution that actually works.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%', marginBottom: 32 }}>
      {EXAMPLES.map((e, i) => (
        <button key={i} onClick={() => onPick(lang === 'हिं' ? e.hi : e.en)}
          className="jg-card-cream"
          style={{
            background: 'var(--jg-surface-2)',
            border: '0.5px solid var(--jg-border)',
            borderRadius: 12,
            padding: '14px 14px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'background .14s, border-color .14s, transform .14s',
            display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 110,
            font: 'inherit',
            color: 'var(--jg-text)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--jg-border-strong)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--jg-border)'}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--jg-surface)', border: '0.5px solid var(--jg-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--jg-terracotta-deep)',
          }}>{e.icon}</div>
          <span className={lang === 'हिं' ? 'jg-deva' : ''} style={{
            fontSize: 14, lineHeight: 1.4, color: 'var(--jg-text)',
          }}>{lang === 'हिं' ? e.hi : e.en}</span>
        </button>
      ))}
    </div>

    {/* voice CTA */}
    <button className="jg-btn"
      style={{
        height: 48, padding: '0 22px', borderRadius: 999,
        background: 'var(--jg-surface)',
        border: '0.5px solid var(--jg-border-strong)',
        fontSize: 14,
      }}>
      <span style={{
        width: 28, height: 28, borderRadius: 999,
        background: 'var(--jg-brass)', color: '#15100A',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginLeft: -8,
      }}>
        <IconMic size={14} stroke="#15100A" />
      </span>
      Tap to speak — Hindi or English
    </button>

    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32, color: 'var(--jg-charcoal-2)', fontSize: 12 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconShield size={14} /> No password, no signup
      </span>
      <span aria-hidden>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconLeaf size={14} /> Built on grassroots knowledge
      </span>
    </div>
  </div>
);

// ─── solution card (the killer screen) ───────────────────────

const SolutionCard = ({ liked, onLike, onDislike, lang }) => {
  const bom = [
    { item: 'Bada matka (large clay pot)',  src: 'local kumhar',   cost: 180, deva: 'बड़ा मटका' },
    { item: 'Chhota matka (small clay pot)', src: 'local kumhar',   cost: 80,  deva: 'छोटा मटका' },
    { item: 'River sand, ~5 kg',             src: 'free, riverside', cost: 0 },
    { item: 'Wet jute cloth',                src: 'kabadiwala',     cost: 27,  deva: 'जूट कपड़ा' },
    { item: 'Water — 2 L, twice daily',      src: 'household',      cost: 0 },
  ];

  const steps = [
    { n: 1, t: 'Place the small matka inside the large one. Leave ~3 cm gap on all sides.' },
    { n: 2, t: 'Fill the gap with river sand. Pack it loose — air gaps help cooling.' },
    { n: 3, t: 'Soak the sand thoroughly with water. Keep soaking until water seeps through clay.' },
    { n: 4, t: 'Put vegetables in the inner pot. Cover with the wet jute cloth.' },
    { n: 5, t: 'Re-wet the sand and cloth twice daily — morning and evening.' },
  ];

  const failures = [
    { t: 'Vegetables turn soggy in 2 days', f: 'Air flow is blocked. Don\'t seal the top — only cover with damp cloth.' },
    { t: 'Doesn\'t feel cool to touch', f: 'Humidity is too high (monsoon). Move to a shaded, well-ventilated spot.' },
    { t: 'Clay cracks after a week', f: 'Pot was over-fired. Soak the new pot in water for 12 hours before first use.' },
  ];

  return (
    <div className="jg-anim-up" style={{ display: 'flex', gap: 12, maxWidth: 720, margin: '0 auto 24px', width: '100%' }}>
      <div style={{ flexShrink: 0 }}><JugaadMark size={32} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span className="jg-serif" style={{ fontSize: 14, fontWeight: 500 }}>JugaadGPT</span>
          <span style={{ fontSize: 11, color: 'var(--jg-charcoal-2)' }}>solution drafted · 2.4s</span>
        </div>

        <div className="jg-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* header */}
          <div style={{ padding: '20px 22px 16px', borderBottom: '0.5px solid var(--jg-border)' }}>
            <div className="jg-eyebrow" style={{ marginBottom: 8 }}>Solution</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <h2 className="jg-serif" style={{ margin: 0, fontSize: 26, lineHeight: 1.15, fontWeight: 400, flex: 1, minWidth: 240 }}>
                Zeer pot — evaporative vegetable cooler
              </h2>
              <span className="jg-pill jg-pill-sage" style={{ height: 26 }}>
                <IconCheck size={13} /> Validated by 12 users in similar conditions
              </span>
            </div>
            <div className="jg-deva" style={{ marginTop: 6, color: 'var(--jg-charcoal)', fontSize: 14 }}>
              ज़ीर मटका — मिट्टी का सब्ज़ी ठंडक
            </div>
          </div>

          {/* constraint match */}
          <div style={{ padding: '14px 22px', borderBottom: '0.5px solid var(--jg-border)',
                        display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip icon={<IconRupee size={13} />} label="₹287 of ₹500 budget" tone="sage" />
            <Chip icon={<IconBoltSlash size={13} />} label="No electricity needed" tone="sage" />
            <Chip icon={<IconSun size={13} />} label="Summer-ready, hot arid" tone="sage" />
            <Chip icon={<IconClock size={13} />} label="2 hour build" tone="sage" />
            <Chip icon={<IconLocation size={13} />} label="Rajasthan, local materials" tone="sage" />
          </div>

          {/* BOM */}
          <div style={{ padding: '18px 22px', borderBottom: '0.5px solid var(--jg-border)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 className="jg-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>Bill of materials</h3>
              <span className="jg-mono" style={{ fontSize: 11, color: 'var(--jg-charcoal)' }}>5 items</span>
            </div>
            <div className="jg-mono" style={{ fontSize: 13, lineHeight: 1.9 }}>
              {bom.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '2px 0',
                                       borderBottom: i < bom.length - 1 ? '0.5px dotted color-mix(in oklab, var(--jg-tan) 70%, transparent)' : 'none' }}>
                  <span style={{ flex: '0 0 auto', color: 'var(--jg-text)' }}>{row.item}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: 'var(--jg-charcoal-2)', fontSize: 11.5, marginRight: 12 }}>{row.src}</span>
                  <span style={{ flex: '0 0 64px', textAlign: 'right', fontWeight: 500,
                                 color: row.cost === 0 ? 'var(--jg-sage-deep)' : 'var(--jg-text)' }}>
                    {row.cost === 0 ? 'free' : `₹${row.cost}`}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingTop: 8, marginTop: 4,
                            borderTop: '0.5px solid var(--jg-border)', fontWeight: 600, fontSize: 14 }}>
                <span>Total</span>
                <span style={{ flex: 1 }} />
                <span>₹287</span>
              </div>
            </div>
          </div>

          {/* steps */}
          <div style={{ padding: '18px 22px', borderBottom: '0.5px solid var(--jg-border)' }}>
            <h3 className="jg-serif" style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 500 }}>Build steps</h3>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map(s => (
                <li key={s.n} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ flexShrink: 0,
                    width: 56, height: 56, borderRadius: 8,
                    background: 'var(--jg-surface-2)', border: '0.5px solid var(--jg-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--jg-font-serif)', fontSize: 22, color: 'var(--jg-terracotta-deep)',
                    fontWeight: 500,
                  }}>{s.n}</div>
                  <div style={{ flex: 1, paddingTop: 6, fontSize: 14, lineHeight: 1.55, color: 'var(--jg-text)' }}>
                    {s.t}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* failure modes — mustard accent */}
          <div style={{
            padding: '18px 22px',
            background: 'color-mix(in oklab, var(--jg-mustard) 7%, var(--jg-surface))',
            borderBottom: '0.5px solid var(--jg-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 8,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'color-mix(in oklab, var(--jg-mustard) 22%, transparent)',
                color: 'var(--jg-mustard-deep)',
              }}><IconWarn size={16} /></span>
              <h3 className="jg-serif" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>If this doesn't work</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {failures.map((fa, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0, marginTop: 5,
                    width: 6, height: 6, borderRadius: 999,
                    background: 'var(--jg-mustard)',
                  }} />
                  <div style={{ fontSize: 14, lineHeight: 1.55 }}>
                    <strong style={{ fontWeight: 500 }}>{fa.t}</strong>
                    <span style={{ color: 'var(--jg-charcoal)' }}> — {fa.f}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* attribution + actions */}
          <div style={{ padding: '14px 22px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: 'var(--jg-charcoal)', flex: '1 1 200px', minWidth: 200, lineHeight: 1.5 }}>
              Based on traditional Rajasthani method ·{' '}
              <span className="jg-link">Honey Bee Network entry #847</span> ·{' '}
              also documented by NIF India, 2008
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onLike} className={`jg-btn ${liked === 'yes' ? 'jg-btn-sage' : ''}`}
                style={{ background: liked === 'yes' ? 'color-mix(in oklab, var(--jg-sage) 14%, var(--jg-surface))' : 'transparent',
                         borderColor: 'color-mix(in oklab, var(--jg-sage) 60%, transparent)',
                         color: 'var(--jg-sage-deep)' }}>
                <IconCheck size={14} /> This worked
              </button>
              <button onClick={onDislike} className="jg-btn jg-btn-mustard">
                <IconClose size={14} /> Didn't work
              </button>
              <button className="jg-btn jg-btn-ghost" title="Save"><IconBookmark size={16} /></button>
              <button className="jg-btn jg-btn-ghost" title="Share"><IconShare size={16} /></button>
            </div>
          </div>
        </div>

        {/* small followup line */}
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--jg-charcoal)' }}>
          Want me to adapt this for monsoon, or scale it to 50 kg/day?
        </div>
      </div>
    </div>
  );
};

// ─── input bar ───────────────────────────────────────────────

const InputBar = ({ value, onChange, onSend, recording, onMic, lang }) => {
  const taRef = useRef(null);
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = 'auto';
    taRef.current.style.height = Math.min(140, taRef.current.scrollHeight) + 'px';
  }, [value]);

  const placeholder = lang === 'हिं'
    ? 'अपनी problem बताइए — budget, materials, location...'
    : 'Apni problem batayein — budget, materials, location...';

  return (
    <div style={{
      padding: '14px 24px 20px',
      background: 'var(--jg-bg)',
      borderTop: '0.5px solid var(--jg-border)',
      position: 'sticky', bottom: 0,
    }}>
      <div style={{
        maxWidth: 720, margin: '0 auto',
        background: 'var(--jg-surface)',
        border: '0.5px solid var(--jg-border-strong)',
        borderRadius: 14,
        padding: '10px 10px 10px 14px',
        display: 'flex', alignItems: 'flex-end', gap: 8,
        transition: 'border-color .14s',
      }}>
        <button className="jg-btn jg-btn-ghost" onClick={onMic}
          title={recording ? 'Stop recording' : 'Record voice'}
          style={{ width: 36, height: 36, padding: 0, borderRadius: 999,
                   color: recording ? 'var(--jg-terracotta-deep)' : undefined,
                   background: recording ? 'color-mix(in oklab, var(--jg-terracotta) 14%, transparent)' : undefined }}>
          {recording ? <IconStop size={16} /> : <IconMic size={18} />}
        </button>
        <button className="jg-btn jg-btn-ghost"
          style={{ width: 36, height: 36, padding: 0, borderRadius: 999 }} title="Photograph materials">
          <IconCamera size={18} />
        </button>
        <button className="jg-btn jg-btn-ghost"
          style={{ width: 36, height: 36, padding: 0, borderRadius: 999 }} title="Attach file">
          <IconAttach size={18} />
        </button>

        <textarea
          ref={taRef}
          className={`jg-input ${lang === 'हिं' ? 'jg-deva' : ''}`}
          rows={1}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          style={{
            flex: 1, padding: '8px 4px',
            fontSize: 15, lineHeight: 1.45,
          }}
        />

        <button onClick={onSend}
          disabled={!value.trim() && !recording}
          className="jg-btn"
          style={{
            width: 40, height: 40, padding: 0, borderRadius: 999,
            background: 'var(--jg-brass)',
            color: '#15100A',
            border: '1px solid var(--jg-brass-deep)',
            opacity: (!value.trim() && !recording) ? 0.45 : 1,
          }}>
          <IconArrowUp size={18} stroke="#15100A" />
        </button>
      </div>
      <div style={{ maxWidth: 720, margin: '8px auto 0', textAlign: 'center',
                    fontSize: 11, color: 'var(--jg-charcoal-2)' }}>
        Solutions are drafted from grassroots knowledge.
        Always verify materials and steps before building.
      </div>
    </div>
  );
};

// ─── recording overlay ───────────────────────────────────────

const RecordingHint = ({ visible }) => visible && (
  <div className="jg-anim-up" style={{
    maxWidth: 720, margin: '0 auto 12px', width: '100%',
    padding: '10px 14px', borderRadius: 10,
    background: 'color-mix(in oklab, var(--jg-terracotta) 8%, var(--jg-surface))',
    border: '0.5px dashed color-mix(in oklab, var(--jg-terracotta) 50%, transparent)',
    color: 'var(--jg-terracotta-deep)',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13,
  }}>
    <span className="jg-pulse" style={{
      width: 10, height: 10, borderRadius: 999, background: 'var(--jg-terracotta)',
    }} />
    Listening… speak in Hindi or English. Tap stop when done.
    <span style={{ flex: 1 }} />
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
      {[3, 8, 5, 12, 9, 4, 10].map((h, i) =>
        <span key={i} style={{ width: 2, height: h, background: 'var(--jg-terracotta)', borderRadius: 1, opacity: 0.7 }} />)}
    </div>
  </div>
);

Object.assign(window, {
  TopBar, AssistantMsg, UserMsg, Chip, EmptyState, SolutionCard, InputBar, RecordingHint,
});
