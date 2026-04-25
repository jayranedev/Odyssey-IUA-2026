import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import { getGemmaResponse } from '../services/ai';

const Workshop = () => {
  const [isChatting, setIsChatting] = useState(false);
  const [problem, setProblem] = useState('');
  const [scraps, setScraps] = useState(['Old cycle rim', 'PVC Pipe (2 meters)', '']);
  const [budget, setBudget] = useState(500);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!problem.trim()) return;
    
    setIsChatting(true);
    setIsLoading(true);
    
    const initialMessage = {
      role: 'user',
      text: `Problem: ${problem}\nScraps: ${scraps.filter(s => s).join(', ')}\nBudget: ₹${budget}`
    };
    
    setMessages([initialMessage]);
    
    const aiResponse = await getGemmaResponse(initialMessage.text);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: aiResponse,
      type: 'solution'
    }]);
    
    setIsLoading(false);
  };

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    
    const aiResponse = await getGemmaResponse(text, messages);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: aiResponse,
      type: 'advisory'
    }]);
    
    setIsLoading(false);
  };

  if (isChatting) {
    return (
      <main className="max-w-4xl mx-auto px-margin mt-8 graph-paper min-h-screen border-x-2 border-outline-variant shadow-inner py-10">
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          projectContext={{ title: problem.substring(0, 30) + '...', scraps }}
        />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-margin mt-8 graph-paper min-h-screen border-x-2 border-outline-variant shadow-inner py-10 mb-24">
      <div className="mb-10 px-4">
        <h2 className="font-display text-4xl text-primary uppercase border-b-4 border-primary inline-block mb-2">
          The Workshop
        </h2>
        <p className="font-annotation text-secondary text-lg">
          Log your problem. Use what you have. Build what you need.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section: The Problem */}
        <section className="bg-white p-6 border-2 border-on-background relative duct-tape-corner shadow-jugaad-black/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            <label className="font-display text-2xl uppercase tracking-tight">The Problem</label>
          </div>
          <div className="relative">
            <textarea 
              className="w-full bg-surface-container-low border-b-2 border-on-background border-t-0 border-x-0 focus:ring-0 focus:border-primary p-4 font-body-lg min-h-[150px] placeholder:text-outline-variant" 
              placeholder="What needs fixing or building? (e.g. My water pump handle broke, need a manual grain thresher...)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            ></textarea>
            <div className="absolute bottom-2 right-2 font-annotation text-sm text-outline opacity-50">Line no. 001</div>
          </div>
        </section>

        {/* Grid Layout for Scraps and Budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Section: Available Scraps */}
          <section className="md:col-span-2 bg-white p-6 border-2 border-on-background shadow-jugaad-black/10 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">inventory</span>
                <label className="font-display text-2xl uppercase tracking-tight">Available Scraps</label>
              </div>
              <button className="flex items-center gap-1 bg-[#1A4B84] text-white px-3 py-1 font-display text-xs font-bold uppercase active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                Scan Item
              </button>
            </div>
            <div className="space-y-2">
              {scraps.map((scrap, index) => (
                <div key={index} className="flex items-center border-b border-dashed border-outline-variant py-2">
                  <span className="font-data-tabular mr-4 text-outline">{String(index + 1).padStart(2, '0')}.</span>
                  <input 
                    className="bg-transparent border-none focus:ring-0 w-full font-body-md uppercase" 
                    type="text" 
                    value={scrap}
                    onChange={(e) => {
                      const newScraps = [...scraps];
                      newScraps[index] = e.target.value;
                      setScraps(newScraps);
                    }}
                    placeholder={index === scraps.length - 1 ? "Add more scrap..." : ""}
                  />
                  {scrap && (
                    <button 
                      className="text-error px-2"
                      onClick={() => setScraps(scraps.filter((_, i) => i !== index))}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button 
                className="text-primary mt-2 flex items-center gap-1 text-xs font-bold uppercase"
                onClick={() => setScraps([...scraps, ''])}
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Entry
              </button>
            </div>
            {/* Scan Visual Placeholder */}
            <div className="mt-4 border-2 border-dashed border-primary-container p-4 bg-surface-container-highest flex items-center gap-4">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI_EaLKLMZrpdTZrCIFyqVELja7EeG8ChKuxHFzFvf1vVT_3Ghq6pL76qKGg23gTYCua5HlmW5vf8cplRiPOBjEdHHES6PJk3D_DE16d7pH4ZZ7daasCJYYWvkHPvf0cngButFW1lAjfQoOwIES4iXNxMKxsNHDbKuocqKXTxeyP0T-wQ7V8bm1ffW-U3nKiu_ECncZDAyqokzUXtjdmpz0aeoB-0PPBX_2NrLhhTcAny7KJISaKr6hWReSOuXtH50H8ErNo5q0aM" alt="Scrap" className="w-16 h-16 object-cover border-2 border-on-background" />
              <div>
                <p className="font-display text-sm font-bold text-primary">SCANNER ACTIVE</p>
                <p className="text-xs text-on-surface-variant font-body-md">Vintage Camera detection running...</p>
              </div>
            </div>
          </section>

          {/* Section: Budget */}
          <section className="bg-white p-6 border-2 border-on-background shadow-jugaad-black/10 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">payments</span>
              <label className="font-display text-2xl uppercase tracking-tight">Budget</label>
            </div>
            <div className="flex-grow flex flex-col justify-center text-center p-4 bg-primary-fixed border-2 border-primary">
              <span className="text-xs font-display font-black text-on-primary-fixed-variant uppercase">Indian Rupees (₹)</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-center text-4xl font-black text-primary p-0" 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
              <div className="h-1 bg-primary w-full mt-2"></div>
            </div>
            <p className="mt-4 font-annotation text-xs text-secondary text-center italic">"Build it cheap, build it strong."</p>
          </section>
        </div>

        {/* Submit Action */}
        <div className="flex justify-center py-10">
          <button 
            onClick={handleGenerate}
            className="group relative px-12 py-6 bg-[#FFD700] border-4 border-on-background shadow-jugaad-blue-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
            disabled={!problem.trim()}
          >
            <div className="flex items-center gap-4">
              <span className="font-display text-3xl font-black uppercase tracking-widest">Generate Solution</span>
              <span className="material-symbols-outlined text-4xl">settings_suggest</span>
            </div>
            {/* Hand-drawn Arrow Decoration */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 hidden lg:block">
              <svg className="text-secondary rotate-12" width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor">
                <path d="M5 20C20 20 40 5 55 15M55 15L45 10M55 15L50 25" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-annotation text-sm text-secondary block -rotate-12 mt-2">Click to build!</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Workshop;
