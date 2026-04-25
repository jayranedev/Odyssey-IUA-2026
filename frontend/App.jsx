// App.jsx — design canvas with all JugaadGPT screens.

const { useState: uSt } = React;

const Frame = ({ width, height, children, theme = 'day' }) => (
  <div className="jg" data-theme={theme} style={{
    width, height, background: 'var(--jg-bg)',
    borderRadius: 0, overflow: 'hidden', position: 'relative',
    fontFamily: 'var(--jg-font-sans)', color: 'var(--jg-text)',
  }}>
    {children}
  </div>
);

// — Hero artboard: complete desktop chat with solution + trace panel
const HeroChat = ({ theme: t = 'day', initialScene = 'solution' }) => {
  const [theme, setTheme] = uSt(t);
  return (
    <Frame width={1280} height={820} theme={theme}>
      <ChatShell theme={theme} setTheme={setTheme} initialScene={initialScene} />
    </Frame>
  );
};

const EmptyChat = ({ theme: t = 'day' }) => {
  const [theme, setTheme] = uSt(t);
  return (
    <Frame width={1280} height={820} theme={theme}>
      <ChatShell theme={theme} setTheme={setTheme} initialScene="empty" panelOpen={false} hidePanel={true} />
    </Frame>
  );
};

// Constraint trace, presented standalone
const TraceDetail = ({ theme: t = 'day' }) => (
  <Frame width={420} height={760} theme={t}>
    <div className="jg" data-theme={t} style={{ height: '100%' }}>
      <ConstraintTrace
        constraints={[
          { label: 'Budget', value: '₹500', icon: <IconRupee size={13} /> },
          { label: 'Location', value: 'Rajasthan, Jodhpur dist.', icon: <IconLocation size={13} /> },
          { label: 'Season', value: 'Summer · hot arid', icon: <IconSun size={13} /> },
          { label: 'Power', value: 'None', icon: <IconBoltSlash size={13} /> },
          { label: 'Materials owned', value: 'Empty', icon: <IconBox size={13} /> },
          { label: 'Vegetables', value: 'Leafy greens, tomatoes', icon: <IconLeaf size={13} /> },
          { label: 'Volume', value: '20 kg / day', icon: <IconRuler size={13} /> },
          { label: 'Build time', value: '≤ 4 hours', icon: <IconClock size={13} /> },
        ]}
        completeness={{ have: 8, total: 8 }}
        rules={[
          { icon: <IconRupee size={12} />, label: 'Budget cap: ₹500', tone: 'enforced' },
          { icon: <IconSun size={12} />, label: 'Climate: hot arid', tone: 'matched' },
          { icon: <IconBoltSlash size={12} />, label: 'No electric tools', tone: 'enforced' },
          { icon: <IconLocation size={12} />, label: 'Local materials only (Rajasthan)', tone: 'enforced' },
          { icon: <IconDrop size={12} />, label: 'Monsoon-safe variant', tone: 'matched' },
          { icon: <IconClock size={12} />, label: 'Build time ≤ 4h', tone: 'enforced' },
          { icon: <IconLeaf size={12} />, label: 'Source-attributed', tone: 'enforced' },
        ]}
      />
    </div>
  </Frame>
);

// Extension popup mounted on a search-results page (so it has context)
const ExtScene = ({ theme: t = 'day', expanded = false }) => {
  const [exp, setExp] = uSt(expanded);
  return (
    <div className="jg" data-theme={t} style={{
      width: 980, height: 700,
      background: '#f6f4ef', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, gap: 24,
    }}>
      {/* search results behind */}
      <SearchResultsMock />
      {/* popup, anchored top-right of the search window */}
      <div style={{ position: 'absolute', right: 30, top: 70 }}>
        <ExtensionPopup expanded={exp} onExpand={() => setExp(!exp)} onClose={() => {}} />
      </div>
    </div>
  );
};

// Mobile presented in a phone bezel
const MobileScene = ({ theme: t = 'day' }) => (
  <div className="jg" data-theme={t} style={{
    width: 460, height: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent',
  }}>
    <MobileView />
  </div>
);

// Onboarding card on a warm-paper page
const OnboardingScene = ({ theme: t = 'day' }) => (
  <div className="jg" data-theme={t} style={{
    width: 880, height: 660,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--jg-bg)', position: 'relative',
  }}>
    <div className="jg-grain" />
    <Onboarding />
  </div>
);

// Logo / brand artboard
const BrandSheet = ({ theme: t = 'day' }) => (
  <div className="jg" data-theme={t} style={{
    width: 880, height: 540, padding: 32,
    background: 'var(--jg-bg)',
    fontFamily: 'var(--jg-font-sans)', color: 'var(--jg-text)',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, position: 'relative',
  }}>
    <div className="jg-grain" />
    <div style={{ position: 'relative' }}>
      <div className="jg-eyebrow" style={{ marginBottom: 10 }}>The mark</div>
      <div className="jg-card" style={{ padding: 28, marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <JugaadMark size={140} />
        <JugaadWordmark size={32} />
        <div style={{ fontSize: 12, color: 'var(--jg-charcoal)', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
          A clay matka with circuit traces extending outward — old craft, new wiring.
          The two node dots, sage and mustard, mirror the validated / failure-mode color split.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        {[16, 24, 32, 48, 64].map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <JugaadMark size={s} />
            <span className="jg-mono" style={{ fontSize: 10, color: 'var(--jg-charcoal-2)' }}>{s}px</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ position: 'relative' }}>
      <div className="jg-eyebrow" style={{ marginBottom: 10 }}>Single-color stamp · embroidery / print</div>
      <div className="jg-card" style={{ padding: 22, display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
        <div style={{ color: 'var(--jg-ink)' }}><JugaadMark size={64} stamp /></div>
        <div style={{ color: 'var(--jg-terracotta-deep)' }}><JugaadMark size={64} stamp /></div>
        <div style={{ background: 'var(--jg-ink)', padding: 12, borderRadius: 8, color: 'var(--jg-paper)' }}>
          <JugaadMark size={48} stamp />
        </div>
      </div>

      <div className="jg-eyebrow" style={{ marginBottom: 10 }}>Browser extension states</div>
      <div className="jg-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 }}>
          {[
            { v: 'idle', l: 'Idle' },
            { v: 'alert', l: 'Notification' },
            { v: 'active', l: 'Active tab' },
            { v: 'alert', l: 'Count', label: '3' },
          ].map((x, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ExtIcon size={36} variant={x.v} label={x.label} />
              <span style={{ fontSize: 11, color: 'var(--jg-charcoal)' }}>{x.l}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--jg-charcoal)', borderTop: '0.5px solid var(--jg-border)', paddingTop: 10, lineHeight: 1.55 }}>
          Idle on neutral pages. Red dot when JugaadGPT detects a query it can solve.
          Terracotta ring when actively scanning the current tab.
          Numbered badge when multiple solutions queued.
        </div>
      </div>
    </div>
  </div>
);

// Color & type sheet
const TokenSheet = ({ theme: t = 'day' }) => (
  <div className="jg" data-theme={t} style={{
    width: 880, height: 540, padding: 32,
    background: 'var(--jg-bg)',
    fontFamily: 'var(--jg-font-sans)', color: 'var(--jg-text)',
    display: 'flex', flexDirection: 'column', gap: 20, position: 'relative',
  }}>
    <div className="jg-grain" />
    <div style={{ position: 'relative' }}>
      <div className="jg-eyebrow" style={{ marginBottom: 8 }}>Palette · earthy and grounded</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
        {[
          ['Terracotta', '#C9613A', '#FFF8EE'],
          ['Deep ink', '#1A1A1A', '#FAF6EF'],
          ['Warm paper', '#FAF6EF', '#1A1A1A'],
          ['Soft cream', '#F4EDE0', '#1A1A1A'],
          ['Sage', '#5C8A6E', '#FFF'],
          ['Mustard', '#D4A017', '#1A1A1A'],
          ['Charcoal', '#6B6B6B', '#fff'],
          ['Tan', '#E0D8C8', '#1A1A1A'],
        ].map(([n, c, fg]) => (
          <div key={n} style={{
            background: c, color: fg,
            border: '0.5px solid var(--jg-border)',
            borderRadius: 10, padding: 12, height: 92,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{n}</span>
            <span className="jg-mono" style={{ fontSize: 11, opacity: 0.85 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, position: 'relative' }}>
      <div className="jg-card" style={{ padding: 18 }}>
        <div className="jg-eyebrow" style={{ marginBottom: 6 }}>Headings · Fraunces</div>
        <div className="jg-serif" style={{ fontSize: 32, lineHeight: 1.1 }}>What can we build today?</div>
        <div className="jg-deva jg-serif" style={{ fontSize: 18, marginTop: 8, color: 'var(--jg-terracotta-deep)' }}>
          आज क्या बनाना है?
        </div>
      </div>
      <div className="jg-card" style={{ padding: 18 }}>
        <div className="jg-eyebrow" style={{ marginBottom: 6 }}>Body · Inter + Devanagari</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          Solutions that fit your reality.<br />
          <span className="jg-deva">आपकी हकीकत के हिसाब से जुगाड़।</span>
        </div>
      </div>
      <div className="jg-card" style={{ padding: 18 }}>
        <div className="jg-eyebrow" style={{ marginBottom: 6 }}>Numbers · JetBrains Mono</div>
        <div className="jg-mono" style={{ fontSize: 22, fontWeight: 600 }}>₹287 / ₹500</div>
        <div className="jg-mono" style={{ fontSize: 12, color: 'var(--jg-charcoal)' }}>2.4s · 12 validated</div>
      </div>
    </div>
  </div>
);

// — App: design canvas with all artboards
const App = () => (
  <DesignCanvas>
    <DCSection id="hero" title="Web UI · Conversational chat"
      subtitle="Empty state, mid-conversation, full solution display, and the dark companion theme.">
      <DCArtboard id="empty" label="A · Empty state — what are you trying to build?" width={1280} height={820}>
        <EmptyChat theme="day" />
      </DCArtboard>
      <DCArtboard id="solution-day" label="B · Solution · Zeer pot · Day theme" width={1280} height={820}>
        <HeroChat theme="day" initialScene="solution" />
      </DCArtboard>
      <DCArtboard id="solution-night" label="C · Solution · Charcoal night theme" width={1280} height={820}>
        <HeroChat theme="night" initialScene="solution" />
      </DCArtboard>
      <DCArtboard id="empty-night" label="D · Empty state · Night" width={1280} height={820}>
        <EmptyChat theme="night" />
      </DCArtboard>
    </DCSection>

    <DCSection id="trace" title="Constraint trace · Show your work"
      subtitle="The defining feature — visible reasoning, editable values, validation rules.">
      <DCArtboard id="trace-day" label="Constraint trace panel · Day" width={420} height={760}>
        <TraceDetail theme="day" />
      </DCArtboard>
      <DCArtboard id="trace-night" label="Constraint trace panel · Night" width={420} height={760}>
        <TraceDetail theme="night" />
      </DCArtboard>
    </DCSection>

    <DCSection id="ext" title="Browser extension"
      subtitle="Popup over a search results page, plus the injected floating pill.">
      <DCArtboard id="ext-collapsed" label="A · Popup collapsed — detection prompt" width={980} height={700}>
        <ExtScene theme="day" expanded={false} />
      </DCArtboard>
      <DCArtboard id="ext-expanded" label="B · Popup expanded — compact solution" width={980} height={700}>
        <ExtScene theme="day" expanded={true} />
      </DCArtboard>
      <DCArtboard id="ext-night" label="C · Popup · Night theme" width={980} height={700}>
        <ExtScene theme="night" expanded={false} />
      </DCArtboard>
    </DCSection>

    <DCSection id="mobile" title="Mobile web view"
      subtitle="Voice-first input. Sliding constraint sheet. Bottom navigation.">
      <DCArtboard id="mobile-day" label="A · Mobile · Day" width={460} height={900}>
        <MobileScene theme="day" />
      </DCArtboard>
      <DCArtboard id="mobile-night" label="B · Mobile · Night" width={460} height={900}>
        <MobileScene theme="night" />
      </DCArtboard>
    </DCSection>

    <DCSection id="onboard" title="Onboarding · First-run"
      subtitle="Three slides — tagline, constraints, grassroots provenance.">
      <DCArtboard id="onboarding-day" label="Onboarding · Day" width={880} height={660}>
        <OnboardingScene theme="day" />
      </DCArtboard>
      <DCArtboard id="onboarding-night" label="Onboarding · Night" width={880} height={660}>
        <OnboardingScene theme="night" />
      </DCArtboard>
    </DCSection>

    <DCSection id="brand" title="Brand · The matka mark"
      subtitle="Logo construction, sizes, single-color stamp variant, extension toolbar states.">
      <DCArtboard id="brand-day" label="Brand sheet · Day" width={880} height={540}>
        <BrandSheet theme="day" />
      </DCArtboard>
      <DCArtboard id="brand-night" label="Brand sheet · Night" width={880} height={540}>
        <BrandSheet theme="night" />
      </DCArtboard>
    </DCSection>

    <DCSection id="tokens" title="Foundation · Color & type"
      subtitle="The earthy palette, two scripts, monospace numbers.">
      <DCArtboard id="tokens-day" label="Tokens · Day" width={880} height={540}>
        <TokenSheet theme="day" />
      </DCArtboard>
      <DCArtboard id="tokens-night" label="Tokens · Night" width={880} height={540}>
        <TokenSheet theme="night" />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
