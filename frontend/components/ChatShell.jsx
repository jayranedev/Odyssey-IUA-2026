// ChatShell.jsx — orchestrates the desktop chat experience.
// Three internal scenes: empty / mid-conversation / solution.
// Includes: clarifier modal, recording state, constraint-trace toggle.

const { useState: uS, useEffect: uE } = React;

const SAMPLE_RULES = [
  { icon: <IconRupee size={12} />, label: 'Budget cap: ₹500', tone: 'enforced' },
  { icon: <IconSun size={12} />,   label: 'Climate: hot arid (Rajasthan)', tone: 'matched' },
  { icon: <IconBoltSlash size={12} />, label: 'No electric tools', tone: 'enforced' },
  { icon: <IconLocation size={12} />, label: 'Local materials only', tone: 'enforced' },
  { icon: <IconDrop size={12} />, label: 'Monsoon-safe option available', tone: 'matched' },
  { icon: <IconClock size={12} />, label: 'Build time ≤ 4 hours', tone: 'enforced' },
  { icon: <IconLeaf size={12} />, label: 'Source-attributed solution', tone: 'enforced' },
];

const STARTING_CONSTRAINTS = [
  { label: 'Budget', value: '₹500', icon: <IconRupee size={13} /> },
  { label: 'Location', value: 'Rajasthan', icon: <IconLocation size={13} /> },
  { label: 'Season', value: 'Summer · hot arid', icon: <IconSun size={13} /> },
  { label: 'Power', value: 'None', icon: <IconBoltSlash size={13} /> },
  { label: 'Materials owned', value: 'Empty', icon: <IconBox size={13} /> },
  { label: 'Vegetables', value: 'Leafy greens, tomatoes', icon: <IconLeaf size={13} /> },
  { label: 'Volume', value: '20 kg/day', icon: <IconRuler size={13} /> },
  { label: 'Build time', value: '≤ 4 hours', icon: <IconClock size={13} /> },
];

const ClarifierModal = ({ visible, onAnswer, onSkip }) => visible && (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 9,
    background: 'rgba(20,15,10,0.35)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  }}>
    <div className="jg-card jg-anim-up" style={{
      width: 'min(520px, 100%)', padding: 24,
      boxShadow: 'var(--jg-shadow-pop)',
    }}>
      <div className="jg-eyebrow" style={{ marginBottom: 8 }}>Quick clarification</div>
      <h3 className="jg-serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, lineHeight: 1.25 }}>
        What state are you in?
      </h3>
      <p style={{ margin: '8px 0 18px', fontSize: 13.5, color: 'var(--jg-charcoal)', lineHeight: 1.55 }}>
        This affects what materials are locally available, your climate band,
        and which kumhar networks I can route through.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {['Rajasthan', 'Gujarat', 'Maharashtra', 'Punjab', 'Tamil Nadu', 'West Bengal', 'Karnataka', 'Other'].map(s => (
          <button key={s} onClick={() => onAnswer(s)} className="jg-btn"
            style={{ height: 32, fontSize: 12.5, padding: '0 12px' }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '0.5px solid var(--jg-border)', paddingTop: 14 }}>
        <input className="jg-input" placeholder="Or type — district, village, anything"
          style={{ border: '0.5px solid var(--jg-border)', borderRadius: 8, padding: '8px 12px', flex: 1, fontSize: 13.5 }} />
        <button onClick={onSkip} className="jg-btn jg-btn-ghost" style={{ fontSize: 12.5 }}>
          Skip — assume for me
        </button>
      </div>
    </div>
  </div>
);

const ChatShell = ({ initialScene = 'solution', theme, setTheme, panelOpen: forcePanel, hidePanel = false }) => {
  const [scene, setScene] = uS(initialScene); // empty | typing | solution
  const [input, setInput] = uS('');
  const [recording, setRecording] = uS(false);
  const [lang, setLang] = uS('EN');
  const [liked, setLiked] = uS(null);
  const [panelOpen, setPanelOpen] = uS(forcePanel ?? true);
  const [clarifier, setClarifier] = uS(false);
  const [constraints, setConstraints] = uS(STARTING_CONSTRAINTS);

  uE(() => { if (forcePanel !== undefined) setPanelOpen(forcePanel); }, [forcePanel]);

  const reset = () => { setScene('empty'); setInput(''); setLiked(null); };

  const send = () => {
    if (!input.trim()) return;
    setScene('typing');
    setTimeout(() => setScene('solution'), 1600);
    setInput('');
  };

  const pickExample = (txt) => {
    setInput(txt);
    setTimeout(() => {
      setScene('typing');
      setTimeout(() => setScene('solution'), 1500);
      setInput('');
    }, 200);
  };

  return (
    <div className="jg" data-theme={theme} style={{
      width: '100%', height: '100%', display: 'flex',
      background: 'var(--jg-bg)', position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="jg-grain" style={{ zIndex: 0 }} />

      {/* main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <TopBar
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'day' ? 'night' : 'day')}
          onReset={reset}
          lang={lang}
          onLang={setLang}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(!panelOpen)}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: scene === 'empty' ? '0' : '24px 24px 8px',
                      display: 'flex', flexDirection: 'column' }}>
          {scene === 'empty' && <EmptyState lang={lang} onPick={pickExample} />}

          {scene !== 'empty' && (
            <>
              <UserMsg time="2 min ago">
                {lang === 'हिं'
                  ? <span className="jg-deva">₹500 mein vegetable cooler banao, no electricity. Rajasthan mein hoon — 20 kg leafy greens roz aate hain.</span>
                  : "₹500 mein vegetable cooler banao, no electricity. I'm in Rajasthan — 20 kg leafy greens come daily."}
              </UserMsg>

              <AssistantMsg time="2 min ago">
                <div style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 14 }}>
                  Got it — let me lock the constraints I picked up:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  <Chip icon={<IconRupee size={12} />} label="₹500" />
                  <Chip icon={<IconLocation size={12} />} label="Rajasthan" />
                  <Chip icon={<IconBoltSlash size={12} />} label="No electricity" />
                  <Chip icon={<IconBox size={12} />} label="20 kg/day" />
                  <Chip icon={<IconLeaf size={12} />} label="Leafy greens" />
                  <Chip icon={<IconSun size={12} />} label="Summer · hot arid" />
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--jg-charcoal)' }}>
                  One question — do you have access to a riverside or sand source nearby?
                  It changes which build I recommend.{' '}
                  <span className="jg-link" onClick={() => setClarifier(true)}>Answer</span>
                </div>
              </AssistantMsg>

              <UserMsg time="Just now">Yes, the river is 2 km away. Sand is free.</UserMsg>

              {scene === 'typing' && (
                <AssistantMsg time="Now">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--jg-charcoal)' }}>
                    <span className="jg-typing"><span /><span /><span /></span>
                    Searching grassroots solutions database… checking 7 constraints…
                  </div>
                </AssistantMsg>
              )}

              {scene === 'solution' && (
                <SolutionCard
                  liked={liked}
                  onLike={() => setLiked('yes')}
                  onDislike={() => setLiked('no')}
                  lang={lang}
                />
              )}
            </>
          )}
        </div>

        <RecordingHint visible={recording} />
        <InputBar
          value={input}
          onChange={setInput}
          onSend={send}
          recording={recording}
          onMic={() => setRecording(!recording)}
          lang={lang}
        />

        <ClarifierModal
          visible={clarifier}
          onAnswer={() => setClarifier(false)}
          onSkip={() => setClarifier(false)}
        />
      </div>

      {/* side panel */}
      {!hidePanel && panelOpen && (
        <ConstraintTrace
          constraints={constraints}
          completeness={{ have: 8, total: 8 }}
          rules={SAMPLE_RULES}
        />
      )}
    </div>
  );
};

window.ChatShell = ChatShell;
