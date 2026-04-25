// AppShell.jsx — header + bottom nav, shared by all 4 screens.

const AppShell = ({ active = 'workshop', children, bgClass = 'jg2-bg-paper' }) => {
  return (
    <div className="jg2" style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--jg2-paper)',
    }}>
      {/* Header */}
      <header className="jg2-header">
        <div className="jg2-logo">JUGAAD GPT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="jg2-btn-yellow">New Project</button>
          <button aria-label="settings" style={{
            width: 38, height: 38,
            background: 'transparent', border: 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--jg2-ink)', cursor: 'pointer',
          }}>
            <IcoGear size={22} stroke={1.8} />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className={bgClass} style={{
        flex: 1, overflow: 'auto', position: 'relative',
        padding: '32px 60px',
      }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="jg2-bottomnav">
        <NavItem id="workshop" active={active === 'workshop'} label="Workshop" icon={<IcoTools size={26} stroke={1.7}/>} />
        <NavItem id="blueprints" active={active === 'blueprints'} label="Blueprints" icon={<IcoCompass size={26} stroke={1.7}/>} />
        <NavItem id="bazaari" active={active === 'bazaari'} label="Bazaari" icon={<IcoStorefront size={24} stroke={1.7}/>} />
        <NavItem id="archive" active={active === 'archive'} label="Archive" icon={<IcoArchive size={24} stroke={1.7}/>} />
      </nav>
    </div>
  );
};

const NavItem = ({ id, active, label, icon }) => (
  <div className={`jg2-navitem ${active ? 'active' : ''}`}>
    <div className="jg2-navitem-tile">{icon}</div>
    <span>{label}</span>
  </div>
);

Object.assign(window, { AppShell });
