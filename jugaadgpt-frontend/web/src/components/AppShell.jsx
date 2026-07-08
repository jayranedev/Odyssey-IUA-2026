'use client';
import {
  IconTools, IconCompass, IconStorefront, IconArchive, IconGear,
  IconCamera, IconX, IconPlus, IconArrowRight, IconSparkle, IconListCheck,
  IconWallet, IconEdit, IconSpeaker, IconStar, IconMap, IconPin, IconArrowSm, IconPencil
} from './Icons2';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import QuotaPill from './QuotaPill';

export const AppShell = ({ active = 'workshop', children, bgClass = 'jg2-bg-paper' }) => {
  const { user, loginOpen, closeLogin } = useAuth();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--jg2-paper)' }}>
      {/* Header */}
      <header className="jg2-header">
        <div className="jg2-logo">JUGAAD GPT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <QuotaPill />
          <button aria-label="settings" style={{
            width: 38, height: 38,
            background: 'transparent', border: 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--jg2-ink)', cursor: 'pointer',
          }}>
            <IconGear size={22} stroke={1.8} />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className={`jg2-main ${bgClass}`}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="jg2-bottomnav" style={{ flexWrap: 'wrap' }}>
        <NavItem id="workshop" active={active === 'workshop'} label="Workshop" icon={<IconTools size={26} stroke={1.7}/>} />
        <NavItem id="chat" active={active === 'chat'} label="AI Hub" icon={<IconSparkle size={26} stroke={1.7}/>} />
        <NavItem id="chat?history=true" active={false} label="History" icon={<IconListCheck size={26} stroke={1.7}/>} />
        <NavItem id="blueprints" active={active === 'blueprints'} label="Blueprints" icon={<IconCompass size={26} stroke={1.7}/>} />
        <NavItem id="bazaari" active={active === 'bazaari'} label="Bazaari" icon={<IconStorefront size={24} stroke={1.7}/>} />
        <NavItem id="archive" active={active === 'archive'} label="Archive" icon={<IconArchive size={24} stroke={1.7}/>} />
      </nav>

      {loginOpen && <LoginModal onClose={closeLogin} />}
    </div>
  );
};

const NavItem = ({ id, active, label, icon }) => (
  <a href={id === 'workshop' ? '/' : `/${id}`} className={`jg2-navitem ${active ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
    <div className="jg2-navitem-tile">{icon}</div>
    <span>{label}</span>
  </a>
);
