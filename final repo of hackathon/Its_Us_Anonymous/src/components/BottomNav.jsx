import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = () => {
  const navItems = [
    { name: 'Workshop', icon: 'handyman', path: '/' },
    { name: 'Blueprints', icon: 'architecture', path: '/blueprints' },
    { name: 'Bazaari', icon: 'storefront', path: '/bazaari' },
    { name: 'Archive', icon: 'inventory_2', path: '/archive' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end pb-4 pt-2 px-2 bg-[#f4f1ea] dark:bg-[#1a1a1a] border-t-4 border-[#1A4B84] bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')]">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all duration-200 ${
              isActive
                ? 'bg-[#FFD700] text-black border-2 border-black -translate-y-2 px-4 py-1 shadow-jugaad-black'
                : 'text-[#1A4B84] opacity-70 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`
          }
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="font-['Inter'] text-[10px] font-bold uppercase">
            {item.name}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
