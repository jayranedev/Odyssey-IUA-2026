// Onboarding.jsx — three-slide first-run experience.

const Onboarding = () => {
  const [slide, setSlide] = React.useState(0);

  const slides = [
    {
      eyebrow: 'JugaadGPT',
      hero: <JugaadMark size={120} />,
      h: 'Solutions that fit your reality.',
      hDeva: 'आपकी हकीकत के हिसाब से जुगाड़।',
      body: "Most AI gives you the answer for someone with resources. We give you the answer for you — with your budget, your power, your materials.",
    },
    {
      eyebrow: 'Step 1',
      hero: (
        <div style={{ display: 'flex', gap: 18 }}>
          {[
            { I: IconRupee, c: 'var(--jg-terracotta)', label: 'Budget' },
            { I: IconBoltSlash, c: 'var(--jg-mustard-deep)', label: 'Power' },
            { I: IconCamera, c: 'var(--jg-sage)', label: 'Materials' },
          ].map(({ I, c, label }, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 84, height: 84, borderRadius: 16,
                background: 'var(--jg-surface)',
                border: '0.5px solid var(--jg-border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c,
              }}>
                <I size={40} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--jg-charcoal)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      ),
      h: 'Tell us your constraints.',
      hDeva: 'अपनी सीमाएँ बताइए।',
      body: 'Budget. Power. Materials. We use what you actually have — not what a Bangalore startup assumes you have.',
    },
    {
      eyebrow: 'Step 2',
      hero: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 360 }}>
            {[
              'Honey Bee Network', 'NIF India', 'Barefoot College',
              '500+ documented solutions', 'SRISTI', 'Gyan Vigyan Samiti',
            ].map((b, i) => (
              <span key={i} className="jg-pill" style={{ height: 30, fontSize: 12 }}>
                <IconLeaf size={13} stroke="var(--jg-sage-deep)" /> {b}
              </span>
            ))}
          </div>
        </div>
      ),
      h: 'Built on real grassroots knowledge.',
      hDeva: 'असली जुगाड़, असली लोगों से।',
      body: 'Every solution traces back to documented sources — village fabricators, traditional crafts, the Honey Bee Network. No hallucinated nonsense.',
    },
  ];

  const s = slides[slide];

  return (
    <div style={{
      width: 760, height: 540,
      background: 'var(--jg-bg)',
      borderRadius: 16,
      border: '0.5px solid var(--jg-border)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="jg-grain" />
      {/* tiny notebook ruling lines, very faint */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4 }} className="jg-ruling" />

      {/* top */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <JugaadWordmark size={24} />
        <button className="jg-btn jg-btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}>
          Skip
        </button>
      </div>

      {/* hero area */}
      <div className="jg-anim-up" key={slide} style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 26,
        padding: '0 48px',
        position: 'relative',
      }}>
        {s.hero}
        <div style={{ textAlign: 'center', maxWidth: 540 }}>
          <div className="jg-eyebrow" style={{ marginBottom: 10 }}>{s.eyebrow}</div>
          <h1 className="jg-serif" style={{ margin: 0, fontSize: 34, lineHeight: 1.15, fontWeight: 400, textWrap: 'pretty' }}>
            {s.h}
          </h1>
          <div className="jg-deva jg-serif" style={{ marginTop: 6, fontSize: 18, color: 'var(--jg-terracotta-deep)' }}>
            {s.hDeva}
          </div>
          <p style={{ marginTop: 14, fontSize: 15, color: 'var(--jg-charcoal)', lineHeight: 1.55, textWrap: 'pretty' }}>
            {s.body}
          </p>
        </div>
      </div>

      {/* footer with dots + cta */}
      <div style={{ padding: '18px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '0.5px solid var(--jg-border)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((_, i) => (
            <span key={i} onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 22 : 8, height: 8,
                borderRadius: 999,
                background: i === slide ? 'var(--jg-terracotta)' : 'var(--jg-border-strong)',
                transition: 'width .2s, background .2s',
                cursor: 'pointer',
              }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {slide > 0 && (
            <button onClick={() => setSlide(slide - 1)} className="jg-btn">
              <IconChevLeft size={14} /> Back
            </button>
          )}
          <button onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))}
            className="jg-btn jg-btn-primary" style={{ padding: '0 18px' }}>
            {slide === slides.length - 1 ? 'Start now' : 'Next'} <IconChevRight size={14} stroke="var(--jg-paper)" />
          </button>
        </div>
      </div>
    </div>
  );
};

window.Onboarding = Onboarding;
