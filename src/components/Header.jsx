import React from 'react';
import QuotaPill from './QuotaPill';

const Header = () => {
  return (
    <header className="flex justify-between items-center w-full px-6 py-4 bg-[#f4f1ea] dark:bg-[#1a1a1a] sticky top-0 z-50 border-b-4 border-double border-[#1A4B84] shadow-jugaad bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')]">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black text-[#1A4B84] dark:text-[#4A90E2] tracking-widest uppercase font-display">
          JUGAAD GPT
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <QuotaPill />
        <button className="bg-[#FFD700] border-2 border-black px-4 py-2 font-display font-black text-sm tracking-tighter uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shadow-jugaad-black hover:bg-[#1A4B84] hover:text-white">
          NEW PROJECT
        </button>
        <button className="p-2 text-[#1A4B84] hover:bg-[#1A4B84] hover:text-white transition-colors active:translate-x-[2px] active:translate-y-[2px]">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
