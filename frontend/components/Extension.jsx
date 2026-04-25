// ExtensionPopup.jsx — JugaadGPT browser extension popup (380×520) and the
// injected pill that floats over a search results page.

const ExtensionPopup = ({ expanded, onExpand, onClose }) => {
  return (
    <div style={{
      width: 380, height: 520,
      background: 'var(--jg-bg)',
      border: '0.5px solid var(--jg-border-strong)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--jg-shadow-pop)',
      fontFamily: 'var(--jg-font-sans)',
    }}>
      {/* header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '0.5px solid var(--jg-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <JugaadMark size={22} />
        <span className="jg-serif" style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>
          Jugaad<span style={{ fontStyle: 'italic', color: 'var(--jg-terracotta)' }}>GPT</span>
        </span>
        <button onClick={onClose} className="jg-btn jg-btn-ghost"
          style={{ width: 28, height: 28, padding: 0, borderRadius: 999 }}>
          <IconClose size={16} />
        </button>
      </div>

      {!expanded ? (
        <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="jg-eyebrow" style={{ marginBottom: 8 }}>We noticed you're searching for</div>
          <div className="jg-card-cream" style={{
            padding: 12, borderRadius: 10, marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <IconSearch size={16} stroke="var(--jg-charcoal)" />
            <span style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--jg-text)' }}>
              "keep vegetables fresh without fridge"
            </span>
          </div>

          <h3 className="jg-serif" style={{ margin: '0 0 8px', fontSize: 22, lineHeight: 1.2, fontWeight: 400 }}>
            Want a jugaad solution instead?
          </h3>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--jg-charcoal)', lineHeight: 1.55 }}>
            We have a ₹287 build that works in hot dry climates. Documented, validated by 12 users.
          </p>

          <button className="jg-btn jg-btn-primary" onClick={onExpand}
            style={{ width: '100%', height: 44, fontSize: 14 }}>
            Show me the jugaad way <IconChevRight size={16} stroke="var(--jg-paper)" />
          </button>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--jg-charcoal)' }}>
            <input type="checkbox" id="autoshow" style={{ accentColor: 'var(--jg-terracotta)' }} />
            <label htmlFor="autoshow">Always show on similar searches</label>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ paddingTop: 12, borderTop: '0.5px solid var(--jg-border)',
                        fontSize: 11, color: 'var(--jg-charcoal-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconHand size={12} /> Built by Silent Minds · Honey Bee Network partner
          </div>
        </div>
      ) : (
        <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
          <div className="jg-eyebrow" style={{ marginBottom: 6 }}>Solution · Validated</div>
          <h3 className="jg-serif" style={{ margin: '0 0 4px', fontSize: 19, lineHeight: 1.2, fontWeight: 500 }}>
            Zeer pot — evaporative cooler
          </h3>
          <div className="jg-deva" style={{ fontSize: 12, color: 'var(--jg-charcoal)', marginBottom: 12 }}>
            ज़ीर मटका — मिट्टी का सब्ज़ी ठंडक
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            <Chip icon={<IconRupee size={11} />} label="₹287" tone="sage" />
            <Chip icon={<IconBoltSlash size={11} />} label="No power" tone="sage" />
            <Chip icon={<IconClock size={11} />} label="2 hr build" tone="sage" />
          </div>

          <div style={{ marginBottom: 14, fontSize: 13, lineHeight: 1.55 }}>
            <strong style={{ fontWeight: 500 }}>How it works</strong>
            <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--jg-terracotta-deep)', fontFamily: 'var(--jg-font-serif)' }}>1.</span> Nest a small clay pot inside a large one with wet sand between.</li>
              <li style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--jg-terracotta-deep)', fontFamily: 'var(--jg-font-serif)' }}>2.</span> Cover with damp jute cloth — vegetables go in the inner pot.</li>
              <li style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--jg-terracotta-deep)', fontFamily: 'var(--jg-font-serif)' }}>3.</span> Re-wet sand twice daily. Drops temperature by 8–14 °C in dry heat.</li>
            </ul>
          </div>

          <div className="jg-card-cream" style={{ padding: 10, marginBottom: 14, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--jg-charcoal)' }}>Total cost</span>
              <span className="jg-mono" style={{ fontWeight: 600 }}>₹287</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--jg-charcoal)' }}>Items</span>
              <span className="jg-mono">5 (2 free)</span>
            </div>
          </div>

          <button className="jg-btn jg-btn-primary" style={{ width: '100%', height: 40 }}>
            Open full solution <IconChevRight size={14} stroke="var(--jg-paper)" />
          </button>
          <button className="jg-btn jg-btn-ghost" style={{ width: '100%', marginTop: 6, height: 36, fontSize: 12.5 }}
            onClick={() => onExpand(false)}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};

// Floating notification pill that injects into the search page
const InjectedPill = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '8px 8px 8px 10px',
    background: 'var(--jg-surface)',
    border: '0.5px solid var(--jg-border-strong)',
    borderRadius: 999,
    boxShadow: '0 8px 22px rgba(60,40,20,0.14)',
    fontFamily: 'var(--jg-font-sans)',
    fontSize: 13,
    color: 'var(--jg-text)',
  }}>
    <JugaadMark size={22} />
    <span><strong style={{ color: 'var(--jg-terracotta-deep)', fontWeight: 600 }} className="jg-mono">JugaadGPT</strong> has a <span className="jg-mono">₹287</span> solution for this</span>
    <button className="jg-btn jg-btn-primary" style={{ height: 28, padding: '0 12px', fontSize: 12.5, borderRadius: 999 }}>
      View <IconChevRight size={12} stroke="var(--jg-paper)" />
    </button>
    <button className="jg-btn jg-btn-ghost" style={{ width: 26, height: 26, padding: 0, borderRadius: 999 }}>
      <IconClose size={14} />
    </button>
  </div>
);

window.ExtensionPopup = ExtensionPopup;
window.InjectedPill = InjectedPill;
