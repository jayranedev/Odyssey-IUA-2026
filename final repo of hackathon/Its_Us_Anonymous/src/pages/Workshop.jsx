import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WORKSHOP_KEY = 'jg_workshop_draft';
const SESSIONS_KEY = 'jg_sessions_v2';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Conversations drawer ──────────────────────────────────────
const ConversationsDrawer = ({ open, onClose, onResume }) => {
  let sessions = [];
  try { sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
        background: '#F8F5EE', borderLeft: '3px solid #0E1B2D',
        boxShadow: '-4px 0 0 #0E1B2D',
        zIndex: 101, transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/graph-paper.png")',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 12px',
          borderBottom: '2px solid #0E1B2D',
          background: '#1A4B84',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFD700' }}>
            Past Conversations
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#fff', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: '#828B99', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', marginTop: 32 }}>
              No conversations yet.<br />Start one from Workshop!
            </div>
          ) : sessions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onResume(s.id)}
              style={{
                width: '100%', padding: '14px 18px', textAlign: 'left',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'transparent',
                border: 'none', borderBottom: '1px dashed rgba(14,27,45,0.15)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0E1B2D', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title || 'Untitled conversation'}
              </div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#828B99', textTransform: 'uppercase' }}>
                {new Date(s.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 10, color: '#1A4B84', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginTop: 2 }}>
                Resume →
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px dashed #C1A87D', fontSize: 10, color: '#828B99', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''} stored locally
        </div>
      </div>
    </>
  );
};

// Resize + encode image to base64 so it fits in localStorage and the API
async function compressToBase64(file, maxWidth = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.split(',')[1]); // base64 only, no prefix
    };
    img.onerror = reject;
    img.src = url;
  });
}

const Workshop = () => {
  const navigate = useNavigate();
  const [problem, setProblem] = useState('');
  const [scraps, setScraps] = useState(['Old cycle rim', 'PVC Pipe (2 meters)', '']);
  const [budget, setBudget] = useState(500);
  const [imageFile, setImageFile] = useState(null);       // raw File object
  const [previewUrl, setPreviewUrl] = useState(null);     // blob URL for <img> preview
  const [generating, setGenerating] = useState(false);
  const [scanning, setScanning] = useState(false);        // OCR in progress
  const [scanError, setScanError] = useState('');
  const [showConversations, setShowConversations] = useState(false);
  const scanInputRef = useRef(null);

  const handleResume = (sessionId) => {
    localStorage.setItem('jg_session_id', sessionId);
    setShowConversations(false);
    navigate('/chat');
  };

  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // OCR: compress the scan photo, send to /api/ocr, add returned items to scraps list
  const handleScanItem = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanError('');
    try {
      const base64 = await compressToBase64(file, 1024, 0.82);
      const res = await fetch(`${API_BASE}/api/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, image_type: file.type || 'image/jpeg' }),
      });
      if (!res.ok) throw new Error('OCR failed');
      const { items } = await res.json();
      if (!items?.length) { setScanError('No items detected — try a clearer photo'); return; }
      // Merge into scraps: drop trailing empty slot, append items, re-add empty slot
      setScraps(prev => {
        const existing = prev.filter(Boolean);
        const deduped = items.filter(i => !existing.some(e => e.toLowerCase() === i.toLowerCase()));
        return [...existing, ...deduped, ''];
      });
    } catch {
      setScanError('Could not scan — check your connection');
    } finally {
      setScanning(false);
    }
  };

  const handleGenerate = async () => {
    if (!problem.trim() || generating) return;
    setGenerating(true);

    let imageBase64 = null;
    if (imageFile) {
      try { imageBase64 = await compressToBase64(imageFile); } catch { /* skip image on error */ }
    }

    const ctx = {
      title: problem.substring(0, 60),
      scraps: scraps.filter(Boolean),
      budget,
      imageBase64,                       // null if no image, base64 string if attached
      imageType: imageFile?.type || null,
      prompt: [
        `Problem: ${problem}`,
        scraps.filter(Boolean).length ? `Scraps available: ${scraps.filter(Boolean).join(', ')}` : '',
        `Budget: ₹${budget}`,
        imageBase64 ? '(photo of scraps/materials attached)' : '',
      ].filter(Boolean).join('\n'),
    };

    localStorage.setItem(WORKSHOP_KEY, JSON.stringify(ctx));
    navigate('/chat?from=workshop');
  };

  return (
    <main className="max-w-4xl mx-auto px-margin mt-8 graph-paper min-h-screen border-x-2 border-outline-variant shadow-inner py-10 mb-24">
      <ConversationsDrawer
        open={showConversations}
        onClose={() => setShowConversations(false)}
        onResume={handleResume}
      />

      <div className="mb-10 px-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-primary uppercase border-b-4 border-primary inline-block mb-2">
            The Workshop
          </h2>
          <p className="font-annotation text-secondary text-lg">
            Log your problem. Use what you have. Build what you need.
          </p>
        </div>
        <button
          onClick={() => setShowConversations(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-on-background font-display text-xs uppercase tracking-wider shadow-jugaad-black/20 active:translate-x-0.5 active:translate-y-0.5 transition-transform shrink-0 mt-1"
        >
          <span className="material-symbols-outlined text-base text-primary">forum</span>
          Conversations
        </button>
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
              <div className="flex items-center gap-2">
                {scanning && (
                  <span className="font-annotation text-xs text-secondary italic animate-pulse">Scanning…</span>
                )}
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() => scanInputRef.current?.click()}
                  className="flex items-center gap-1 bg-[#1A4B84] text-white px-3 py-1 font-display text-xs font-bold uppercase active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  {scanning ? '…' : 'Scan Item'}
                </button>
                <input
                  ref={scanInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanItem(f); e.target.value = ''; }}
                />
              </div>
            </div>
            {scanError && (
              <p className="text-error text-xs font-annotation mb-2">{scanError}</p>
            )}

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
                    <button className="text-error px-2" onClick={() => setScraps(scraps.filter((_, i) => i !== index))}>
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

            {/* Drop / upload image area */}
            <div
              className="mt-6 border-2 border-dashed border-primary-container p-6 bg-surface-container-highest flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors relative min-h-[160px]"
              onClick={() => !previewUrl && document.getElementById('scrap-upload').click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) handleImageChange(f); }}
            >
              <input
                type="file"
                id="scrap-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageChange(f); e.target.value = ''; }}
              />

              {previewUrl ? (
                <div className="relative w-full flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Scrap Preview"
                    className="max-h-48 w-auto object-contain border-2 border-primary shadow-jugaad-black/20"
                  />
                  <button
                    className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreviewUrl(null); }}
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <p className="mt-2 text-[10px] font-black text-primary uppercase">
                    📎 Photo attached — will be sent with your query
                  </p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-primary/40">cloud_upload</span>
                  <div className="text-center">
                    <p className="font-display text-xl font-black text-primary leading-tight uppercase tracking-tighter">
                      Drop Scrap Photo Here
                    </p>
                    <p className="text-xs text-secondary font-annotation italic">
                      or click to browse — sent to AI with your query
                    </p>
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
            disabled={!problem.trim() || generating}
            className="group relative px-12 py-6 bg-[#FFD700] border-4 border-on-background shadow-jugaad-blue-lg active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <span className="font-display text-3xl font-black uppercase tracking-widest">
                {generating ? 'Preparing…' : 'Generate Solution'}
              </span>
              <span className="material-symbols-outlined text-4xl" style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }}>
                {generating ? 'progress_activity' : 'settings_suggest'}
              </span>
            </div>
            {imageFile && !generating && (
              <div className="absolute -top-3 right-4 bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 border border-white">
                📷 + photo
              </div>
            )}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 hidden lg:block">
              <svg className="text-secondary rotate-12" width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor">
                <path d="M5 20C20 20 40 5 55 15M55 15L45 10M55 15L50 25" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-annotation text-sm text-secondary block -rotate-12 mt-2">Click to build!</span>
            </div>
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
};

export default Workshop;
