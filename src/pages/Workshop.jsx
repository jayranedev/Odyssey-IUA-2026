import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WORKSHOP_KEY = 'jg_workshop_draft';

const Workshop = () => {
  const navigate = useNavigate();
  const [problem, setProblem] = useState('');
  const [scraps, setScraps] = useState(['Old cycle rim', 'PVC Pipe (2 meters)', '']);
  const [budget, setBudget] = useState(500);
  const [previewImage, setPreviewImage] = useState(null);

  const handleGenerate = () => {
    if (!problem.trim()) return;

    const ctx = {
      title: problem.substring(0, 60),
      scraps: scraps.filter(Boolean),
      budget,
      prompt: [
        `Problem: ${problem}`,
        scraps.filter(Boolean).length ? `Scraps available: ${scraps.filter(Boolean).join(', ')}` : '',
        `Budget: ₹${budget}`,
      ].filter(Boolean).join('\n'),
    };

    localStorage.setItem(WORKSHOP_KEY, JSON.stringify(ctx));
    navigate('/chat?from=workshop');
  };

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
        {/* The Problem */}
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
            />
            <div className="absolute bottom-2 right-2 font-annotation text-sm text-outline opacity-50">Line no. 001</div>
          </div>
        </section>

        {/* Scraps + Budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Available Scraps */}
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
                    placeholder={index === scraps.length - 1 ? 'Add more scrap...' : ''}
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

            {/* Drop Scrap Photo Area */}
            <div
              className="mt-6 border-2 border-dashed border-primary-container p-6 bg-surface-container-highest flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors relative min-h-[160px]"
              onClick={() => !previewImage && document.getElementById('scrap-upload').click()}
            >
              <input
                type="file"
                id="scrap-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPreviewImage(URL.createObjectURL(file));
                }}
              />
              {previewImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img
                    src={previewImage}
                    alt="Scrap Preview"
                    className="max-h-40 w-auto object-contain border-2 border-primary shadow-jugaad-black/20"
                  />
                  <button
                    className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <p className="mt-2 text-[10px] font-black text-primary uppercase">Image Captured • Scanning for materials...</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-primary/40">cloud_upload</span>
                  <div className="text-center">
                    <p className="font-display text-xl font-black text-primary leading-tight uppercase tracking-tighter">
                      Drop Scrap Photo Here
                    </p>
                    <p className="text-xs text-secondary font-annotation italic">or click to browse files</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Budget */}
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
              <div className="h-1 bg-primary w-full mt-2" />
            </div>
            <p className="mt-4 font-annotation text-xs text-secondary text-center italic">"Build it cheap, build it strong."</p>
          </section>
        </div>

        {/* Generate button */}
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
