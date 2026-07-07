import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import LoginModal from './components/LoginModal';
import Workshop from './pages/Workshop';
import Blueprints from './pages/Blueprints';
import Bazaari from './pages/Bazaari';
import Archive from './pages/Archive';
import Chat from './pages/Chat';

function App() {
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-jugaad-yellow selection:text-black">
      {!isChat && <Header />}
      <LoginModal />

      <Routes>
        <Route path="/" element={<Workshop />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/blueprints" element={<Blueprints />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/bazaari" element={<Bazaari />} />
      </Routes>

      <BottomNav />
    </div>
  );
}

export default App;
