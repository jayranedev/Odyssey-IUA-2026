import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';
import QuotaPill from './QuotaPill';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, openLogin, signOut, authEnabled } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const email = user?.email || '';
  const initials = useMemo(() => {
    if (!email) return 'JG';
    return email
      .split('@')[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'JG';
  }, [email]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleProfileAction = () => {
    if (!user) {
      openLogin();
      return;
    }
    setMenuOpen((current) => !current);
  };

  const handleSettingsAction = () => {
    if (!user) {
      openLogin();
      return;
    }
    setMenuOpen((current) => !current);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-[#f4f1ea] dark:bg-[#1a1a1a] sticky top-0 z-50 border-b-4 border-double border-[#1A4B84] shadow-jugaad bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')]">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black text-[#1A4B84] dark:text-[#4A90E2] tracking-widest uppercase font-display">
          JUGAAD GPT
        </h1>
      </div>
      <div className="relative flex items-center gap-3" ref={menuRef}>
        <QuotaPill />

        {!user ? (
          <button
            onClick={openLogin}
            className="bg-[#FFD700] border-2 border-black px-4 py-2 font-display font-black text-sm tracking-tighter uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shadow-jugaad-black hover:bg-[#1A4B84] hover:text-white"
          >
            Login
          </button>
        ) : (
          <button
            onClick={handleProfileAction}
            className="flex items-center gap-2 bg-[#FFD700] border-2 border-black px-3 py-2 font-display font-black text-sm tracking-tighter uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shadow-jugaad-black hover:bg-[#1A4B84] hover:text-white"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0E1B2D] text-[10px] text-[#F8F5EE]">
              {initials}
            </span>
            <span className="max-w-[120px] truncate">Profile</span>
            <ChevronDown size={14} />
          </button>
        )}

        <button
          onClick={handleSettingsAction}
          aria-label="Settings"
          className="p-2 text-[#1A4B84] hover:bg-[#1A4B84] hover:text-white transition-colors active:translate-x-[2px] active:translate-y-[2px] border-2 border-transparent hover:border-black"
        >
          <Settings size={18} />
        </button>

        {menuOpen && user && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] w-72 rounded-sm border-2 border-black bg-[#F8F5EE] shadow-jugaad-lg overflow-hidden">
            <div className="border-b-2 border-black bg-[#1A4B84] px-4 py-3 text-[#FFD700]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Signed in as</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                <UserCircle2 size={16} />
                <span className="truncate">{email}</span>
              </div>
            </div>
            <div className="p-2">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-[#0E1B2D] hover:bg-[#FFD700]"
                onClick={() => setMenuOpen(false)}
              >
                <UserCircle2 size={16} />
                Profile
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-[#0E1B2D] hover:bg-[#FFD700]"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={16} />
                Settings
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-[#C24F2C] hover:bg-[#FDE8E1]"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
            {!authEnabled && (
              <div className="border-t border-dashed border-[#C1A87D] px-4 py-2 text-[11px] text-[#4A5568]">
                Auth is not configured on this deployment yet.
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
