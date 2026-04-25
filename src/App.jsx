import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Workshop from './pages/Workshop';
import Blueprints from './pages/Blueprints';
import Archive from './pages/Archive';

function App() {
  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-jugaad-yellow selection:text-black">
      <Header />
      
      <Routes>
        <Route path="/" element={<Workshop />} />
        <Route path="/blueprints" element={<Blueprints />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/bazaari" element={<div className="flex items-center justify-center min-h-[50vh] font-display text-4xl text-outline-variant uppercase">Coming Soon</div>} />
      </Routes>

      <BottomNav />
    </div>
  );
}

export default App;
