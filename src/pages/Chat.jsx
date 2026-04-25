import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WORKSHOP_KEY = 'jg_workshop_draft';
const SESSIONS_KEY = 'jg_sessions_v2';
const ROTATIONS = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];
const BG_COLORS = ['bg-white', 'bg-[#fdfcf0]', 'bg-yellow-50'];

// ── Session helpers ───────────────────────────────────────────

function getSessionId() {
  let id = localStorage.getItem('jg_session_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('jg_session_id', id); }
  return id;
}

function newSessionId() {
  const id = crypto.randomUUID();
  localStorage.setItem('jg_session_id', id);
  return id;
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { return []; }
}

function persistSession(id, messages) {
  const sessions = loadSessions().filter(s => s.id !== id);
  const firstUser = messages.find(m => m.type === 'user');
  const title = firstUser?.text?.slice(0, 60) || 'New chat';
  sessions.unshift({ id, title, updatedAt: Date.now() });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 30)));
  localStorage.setItem(`jg_msgs_${id}`, JSON.stringify(messages.slice(-50)));
}

function loadSessionMessages(id) {
  try { return JSON.parse(localStorage.getItem(`jg_msgs_${id}`) || '[]'); } catch { return []; }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Text-to-speech (backend Groq TTS) ────────────────────────

const SpeakButton = ({ text, voiceLang }) => {
  const [state, setState] = useState('idle'); // idle | loading | playing
  const audioRef = useRef(null);

  const stop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setState('idle');
  };

  const toggle = async () => {
    if (state !== 'idle') { stop(); return; }

    setState('loading');
    try {
      const lang = voiceLang === 'hi-IN' ? 'hi' : 'en';
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 1000), lang }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setState('idle'); };
      audio.onerror = () => { URL.revokeObjectURL(url); setState('idle'); };
      setState('playing');
      audio.play();
    } catch {
      setState('idle');
    }
  };

  const icon = state === 'loading' ? '⏳' : state === 'playing' ? '⏹' : '🔊';
  const label = state === 'loading' ? 'Loading…' : state === 'playing' ? 'Stop' : 'Read aloud';

  return (
    <button
      onClick={toggle}
      title={label}
      style={{
        background: 'none', border: 'none', cursor: state === 'loading' ? 'wait' : 'pointer',
        fontSize: 15, opacity: state !== 'idle' ? 1 : 0.55, padding: '2px 4px',
        color: state === 'playing' ? 'var(--jg2-brick)' : 'var(--jg2-graphite)',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = 1}
      onMouseLeave={e => { if (state === 'idle') e.currentTarget.style.opacity = 0.55; }}
    >
      {icon}
    </button>
  );
};

// ── Voice input hook ──────────────────────────────────────────

function useVoice(onFinal, onInterim) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  // All mutable state lives in refs so closures always see current values
  const stateRef = useRef({ active: false, lang: 'hi-IN' });
  const recRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);

  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);

  useEffect(() => {
    setSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  // Creates a fresh SR instance and starts it. Called on first start and on every auto-restart.
  const startInstance = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !stateRef.current.active) return;

    const rec = new SR();
    rec.lang = stateRef.current.lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = true;

    rec.onresult = (e) => {
      const results = Array.from(e.results);
      const transcript = results.map(r => r[0].transcript).join('');
      const isFinal = results[results.length - 1].isFinal;
      if (isFinal) onFinalRef.current(transcript);
      else onInterimRef.current?.(transcript);
    };

    rec.onerror = (e) => {
      // Only kill listening on hard permission errors; no-speech is handled by onend restart
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stateRef.current.active = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      // Chrome ends the session after ~60s or on no-speech — always restart with a NEW instance
      if (stateRef.current.active) {
        setTimeout(startInstance, 150);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      stateRef.current.active = false;
      setListening(false);
    }
  }, []); // stable — reads via refs, no deps needed

  const start = useCallback((lang = 'hi-IN') => {
    // Abort any existing session first (won't trigger restart because active stays true briefly)
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
    stateRef.current = { active: true, lang };
    setListening(true);
    startInstance();
  }, [startInstance]);

  const stop = useCallback(() => {
    stateRef.current.active = false; // set BEFORE abort so onend doesn't restart
    setListening(false);
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
  }, []);

  return { listening, start, stop, supported };
}

// ── Bubble components ─────────────────────────────────────────

const UserBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'jg-fade-up 0.2s ease' }}>
    <div style={{
      background: 'var(--jg2-ink)', color: 'var(--jg2-paper)',
      padding: '12px 16px', borderRadius: '12px 12px 2px 12px',
      maxWidth: '70%', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
    }}>
      {text}
    </div>
  </div>
);

const ThinkingBubble = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <div style={{
      background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)',
      padding: '12px 18px', borderRadius: '12px 12px 12px 2px',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--jg2-ink)', opacity: 0.4,
          animation: `jg-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  </div>
);

const StatusBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'jg-fade-up 0.2s ease' }}>
    <div style={{
      padding: '4px 0', fontSize: 12, color: 'var(--jg2-mute)',
      fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jg2-yellow)', flexShrink: 0 }} />
      {text}
    </div>
  </div>
);

const StreamingBubble = ({ text, voiceLang }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', gap: 4, animation: 'jg-fade-up 0.2s ease' }}>
    <div style={{
      background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)',
      padding: '14px 18px', borderRadius: '12px 12px 12px 2px',
      maxWidth: '82%', fontSize: 13.5, lineHeight: 1.7,
      fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', color: 'var(--jg2-graphite)',
    }}>
      {text}
      <span style={{
        display: 'inline-block', width: 2, height: '1em',
        background: 'var(--jg2-ink)', marginLeft: 2, verticalAlign: 'text-bottom',
        animation: 'jg-blink 0.8s step-end infinite',
      }} />
    </div>
    {text.length > 20 && <SpeakButton text={text} voiceLang={voiceLang} />}
  </div>
);

const SolutionBubble = ({ solution, warnings, onSave, saved, voiceLang }) => {
  const speakText = [
    solution.title,
    solution.summary,
    solution.build_steps?.join('. '),
    solution.expected_outcome,
  ].filter(Boolean).join('. ');

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', gap: 4, animation: 'jg-fade-up 0.3s ease' }}>
      <div style={{
        background: 'var(--jg2-card)', border: '2px solid var(--jg2-ink)',
        borderRadius: '12px 12px 12px 2px', maxWidth: '85%', overflow: 'hidden',
        boxShadow: '3px 3px 0 var(--jg2-ink)',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--jg2-yellow)', padding: '10px 18px',
          borderBottom: '2px solid var(--jg2-ink)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            JUGAAD SOLUTION
          </span>
          {solution.total_cost_inr != null && (
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--jg2-graphite)', marginLeft: 'auto' }}>
              ₹{solution.total_cost_inr.toFixed(0)}
            </span>
          )}
          <SpeakButton text={speakText} voiceLang={voiceLang} />
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title + summary */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{solution.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--jg2-graphite)' }}>{solution.summary}</div>
          </div>

          {/* Materials */}
          {solution.materials?.length > 0 && (
            <div style={{ background: 'var(--jg2-kraft-light)', padding: '10px 14px', borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Materials</div>
              {solution.materials.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0',
                  borderBottom: i < solution.materials.length - 1 ? '1px solid var(--jg2-kraft)' : 'none',
                }}>
                  <span>{m.item} <span style={{ color: 'var(--jg2-mute)', fontSize: 11 }}>({m.quantity})</span></span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, flexShrink: 0, paddingLeft: 12 }}>
                    ₹{m.cost_inr?.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Build steps */}
          {solution.build_steps?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>How to Build</div>
              {solution.build_steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, lineHeight: 1.6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--jg2-brick)', flexShrink: 0, minWidth: 20 }}>
                    {i + 1}.
                  </span>
                  <span style={{ color: 'var(--jg2-graphite)' }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Expected outcome */}
          {solution.expected_outcome && (
            <div style={{ background: 'var(--jg2-brick-soft)', padding: '10px 14px', borderRadius: 6, fontSize: 13, lineHeight: 1.6 }}>
              <strong>Expected result:</strong> {solution.expected_outcome}
            </div>
          )}

          {/* Warnings */}
          {warnings?.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--jg2-brick)', fontFamily: 'JetBrains Mono, monospace' }}>
              ⚠ {warnings.join(' · ')}
            </div>
          )}

          {/* Save button */}
          <div style={{ borderTop: '1px dashed var(--jg2-kraft)', paddingTop: 12 }}>
            <button
              onClick={onSave}
              disabled={saved}
              className="jg2-btn-yellow"
              style={{ cursor: saved ? 'default' : 'pointer', opacity: saved ? 0.7 : 1 }}
            >
              {saved ? '✓ Saved to Archive' : '⊞ Save to Archive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClarificationBubble = ({ question, onReply, voiceLang }) => {
  const [ans, setAns] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!ans.trim() || sent) return;
    setSent(true);
    onReply(ans.trim());
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'jg-fade-up 0.2s ease' }}>
      <div style={{
        background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)',
        padding: '14px 18px', borderRadius: '12px 12px 12px 2px', maxWidth: '80%',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--jg2-graphite)', flex: 1 }}>{question}</div>
          <SpeakButton text={question} voiceLang={voiceLang} />
        </div>
        {!sent ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={ans}
              onChange={e => setAns(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Your answer…"
              style={{
                flex: 1, padding: '8px 12px', border: '1.5px solid var(--jg2-ink)',
                borderRadius: 6, fontFamily: 'inherit', fontSize: 13, outline: 'none',
                background: 'var(--jg2-paper)',
              }}
            />
            <button onClick={send} className="jg2-btn-navy" style={{ padding: '8px 14px', fontSize: 13 }}>
              Send
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--jg2-mute)', fontFamily: 'JetBrains Mono, monospace' }}>Sent ✓</div>
        )}
      </div>
    </div>
  );
};

const ErrorBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <div style={{
      background: 'var(--jg2-brick-soft)', border: '1.5px solid var(--jg2-brick)',
      padding: '10px 16px', borderRadius: '12px 12px 12px 2px',
      fontSize: 13, color: 'var(--jg2-brick)', maxWidth: '75%', lineHeight: 1.5,
    }}>
      ⚠ {text}
    </div>
  </div>
);

// ── Sessions drawer ───────────────────────────────────────────

const SessionsDrawer = ({ open, onClose, currentId, onSwitch }) => {
  const sessions = loadSessions();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: open ? 'flex' : 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: 290, background: 'var(--jg2-paper)',
        borderRight: '2px solid var(--jg2-ink)', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 16px 12px', borderBottom: '1.5px solid var(--jg2-ink)',
          fontFamily: "'Archivo Black', sans-serif", fontSize: 14,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Conversations</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: 20, fontSize: 13, color: 'var(--jg2-mute)', fontFamily: 'JetBrains Mono, monospace' }}>
            No past conversations yet.
          </div>
        ) : sessions.map(s => (
          <button
            key={s.id}
            onClick={() => { onSwitch(s.id); onClose(); }}
            style={{
              padding: '12px 16px', textAlign: 'left',
              background: s.id === currentId ? 'var(--jg2-kraft-light)' : 'transparent',
              border: 'none', borderBottom: '0.5px solid rgba(14,44,90,0.12)',
              cursor: 'pointer', color: 'var(--jg2-ink)', fontSize: 13, lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {s.title}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--jg2-mute)' }}>
              {new Date(s.updatedAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Image preview in input ────────────────────────────────────

const ImagePreview = ({ file, onRemove }) => (
  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6 }}>
    <img
      src={URL.createObjectURL(file)}
      alt="attachment"
      style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 6, border: '1.5px solid var(--jg2-ink)' }}
    />
    <button
      onClick={onRemove}
      style={{
        position: 'absolute', top: -6, right: -6,
        width: 18, height: 18, borderRadius: '50%',
        background: 'var(--jg2-brick)', color: '#fff',
        border: 'none', cursor: 'pointer', fontSize: 10, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      ✕
    </button>
  </div>
);

// ── Main chat page ────────────────────────────────────────────

const Chat = () => {
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState(() => getSessionId());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [respLang, setRespLang] = useState('english'); // for backend: hinglish | english | hindi
  const [showSessions, setShowSessions] = useState(false);
  const [savedIdx, setSavedIdx] = useState(new Set());
  const [toast, setToast] = useState('');
  const [workshopCtx, setWorkshopCtx] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const pendingContext = useRef([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamingIdxRef = useRef(null);
  const workshopImageRef = useRef(null); // base64 from workshop, used once on first send
  const [workshopImagePreview, setWorkshopImagePreview] = useState(null);

  // Load workshop context or existing session
  useEffect(() => {
    if (searchParams.get('from') === 'workshop') {
      const raw = localStorage.getItem(WORKSHOP_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setWorkshopCtx(parsed);
            setInput(parsed.prompt || '');
            if (parsed.imageBase64) {
              workshopImageRef.current = parsed.imageBase64;
              setWorkshopImagePreview(`data:${parsed.imageType || 'image/jpeg'};base64,${parsed.imageBase64}`);
            }
          } else {
            setInput(raw);
          }
        } catch {
          setInput(raw);
        }
        localStorage.removeItem(WORKSHOP_KEY);
      }
    } else {
      const stored = loadSessionMessages(sessionId);
      if (stored.length) setMessages(stored);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length) persistSession(sessionId, messages);
  }, [messages, sessionId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const pushMsg = (msg) => setMessages(prev => [...prev, msg]);

  // Voice
  const handleFinal = useCallback((t) => { setInput(t); setInterimText(''); }, []);
  const handleInterim = useCallback((t) => setInterimText(t), []);
  const { listening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useVoice(handleFinal, handleInterim);

  const toggleVoice = () => { if (listening) stopVoice(); else startVoice(voiceLang); };

  // Language toggle: keeps voiceLang and respLang in sync
  const handleLangChange = (e) => {
    const val = e.target.value; // 'en-IN' or 'hi-IN'
    setVoiceLang(val);
    setRespLang(val === 'hi-IN' ? 'hindi' : 'english');
    if (listening) { stopVoice(); setTimeout(() => startVoice(val), 100); }
  };

  // Save solution to archive
  const saveToArchive = useCallback(async (solution, msgIdx) => {
    const card = {
      session_id: sessionId,
      title: solution.title || 'Jugaad Solution',
      status: 'SUCCESS',
      annotation: `"${(solution.expected_outcome || solution.summary || '').slice(0, 100)}"`,
      image: '',
      rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
      bg_color: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
      starred: false,
      solution_json: JSON.stringify({ solution }),
    };
    try {
      const res = await fetch(`${API_BASE}/api/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
      if (res.ok) { setSavedIdx(prev => new Set([...prev, msgIdx])); showToast('Saved to archive ✓'); }
      else showToast('Failed to save');
    } catch { showToast('Failed to save'); }
  }, [sessionId]);

  // SSE streaming call
  const callAPI = useCallback(async (fullMessage, imgBase64 = null) => {
    setLoading(true);
    try {
      const body = {
        session_id: sessionId,
        message: fullMessage,
        channel: 'web',
        lang: respLang,
      };
      if (imgBase64) body.image_base64 = imgBase64;

      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      streamingIdxRef.current = null;
      let streamText = '';

      const flush = (raw) => {
        const blocks = raw.split('\n\n');
        for (const block of blocks) {
          const lines = block.split('\n');
          let eventType = '', dataLine = '';
          for (const l of lines) {
            if (l.startsWith('event: ')) eventType = l.slice(7).trim();
            else if (l.startsWith('data: ')) dataLine = l.slice(6);
          }
          if (!eventType || !dataLine.trim()) continue;
          const data = dataLine.trim();

          if (eventType === 'status') {
            pushMsg({ type: 'status', text: data });
          } else if (eventType === 'token') {
            streamText += data;
            if (streamingIdxRef.current === null) {
              setMessages(prev => {
                streamingIdxRef.current = prev.length;
                return [...prev, { type: 'streaming', text: streamText }];
              });
            } else {
              const idx = streamingIdxRef.current;
              setMessages(prev => {
                const c = [...prev];
                c[idx] = { type: 'streaming', text: streamText };
                return c;
              });
            }
          } else if (eventType === 'clarification') {
            try {
              const parsed = JSON.parse(data);
              pushMsg({ type: 'clarification', question: parsed.question });
            } catch { pushMsg({ type: 'error', text: data }); }
          } else if (eventType === 'solution') {
            try {
              const parsed = JSON.parse(data);
              const idx = streamingIdxRef.current;
              if (idx !== null) {
                setMessages(prev => {
                  const c = [...prev];
                  c[idx] = { type: 'solution', solution: parsed.solution, warnings: parsed.warnings };
                  return c;
                });
              } else {
                pushMsg({ type: 'solution', solution: parsed.solution, warnings: parsed.warnings });
              }
            } catch { pushMsg({ type: 'error', text: 'Could not parse solution.' }); }
            pendingContext.current = [];
          } else if (eventType === 'error') {
            pushMsg({ type: 'error', text: data });
            pendingContext.current = [];
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const cut = buffer.lastIndexOf('\n\n');
        if (cut !== -1) { flush(buffer.slice(0, cut + 2)); buffer = buffer.slice(cut + 2); }
      }
      if (buffer.trim()) flush(buffer);
    } catch (err) {
      pushMsg({ type: 'error', text: `Connection error: ${err.message}` });
      pendingContext.current = [];
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [sessionId, respLang]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    let imgBase64 = null;
    if (imageFile) {
      try { imgBase64 = await fileToBase64(imageFile); } catch { /* ignore */ }
    } else if (workshopImageRef.current) {
      // one-time use: image uploaded on the Workshop page
      imgBase64 = workshopImageRef.current;
      workshopImageRef.current = null;
      setWorkshopImagePreview(null);
    }

    setInput('');
    setInterimText('');
    setImageFile(null);
    pendingContext.current = [text];

    const userMsg = { type: 'user', text, hasImage: !!imgBase64 };
    pushMsg(userMsg);
    callAPI(text, imgBase64);
  }, [input, loading, imageFile, callAPI]);

  const handleClarificationReply = useCallback((answer) => {
    pendingContext.current = [...pendingContext.current, answer];
    pushMsg({ type: 'user', text: answer });
    callAPI(pendingContext.current.join('\n'));
  }, [callAPI]);

  const startNewChat = () => {
    const id = newSessionId();
    setSessionId(id);
    setMessages([]);
    setWorkshopCtx(null);
    setImageFile(null);
    workshopImageRef.current = null;
    setWorkshopImagePreview(null);
    pendingContext.current = [];
    setSavedIdx(new Set());
    inputRef.current?.focus();
  };

  const switchSession = (id) => {
    persistSession(sessionId, messages);
    setSessionId(id);
    localStorage.setItem('jg_session_id', id);
    setMessages(loadSessionMessages(id));
    pendingContext.current = [];
    setSavedIdx(new Set());
  };

  return (
    <main className="max-w-4xl mx-auto px-6 pt-6" style={{ paddingBottom: 170 }}>
      <SessionsDrawer open={showSessions} onClose={() => setShowSessions(false)} currentId={sessionId} onSwitch={switchSession} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%',
          background: 'var(--jg2-ink)', color: 'var(--jg2-paper)',
          padding: '8px 18px', borderRadius: 20,
          fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
          zIndex: 500, animation: 'jg-toast 2.5s ease forwards',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/" style={{
            padding: '6px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em', background: 'white',
            border: '1.5px solid var(--jg2-ink)', textDecoration: 'none', color: 'var(--jg2-ink)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            ← Workshop
          </Link>
          <button onClick={() => setShowSessions(true)} style={{
            padding: '6px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            textTransform: 'uppercase', background: 'white', border: '1.5px solid var(--jg2-ink)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ☰ Conversations
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={voiceLang}
            onChange={handleLangChange}
            style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '5px 8px',
              border: '1.5px solid var(--jg2-ink)', background: 'white', cursor: 'pointer',
              fontWeight: 700, textTransform: 'uppercase',
            }}
          >
            <option value="en-IN">🇮🇳 English</option>
            <option value="hi-IN">🇮🇳 हिन्दी</option>
          </select>
          <button onClick={startNewChat} style={{
            padding: '6px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            textTransform: 'uppercase', background: 'var(--jg2-yellow)', border: '1.5px solid var(--jg2-ink)', cursor: 'pointer',
          }}>
            + New Chat
          </button>
        </div>
      </div>

      {/* Workshop context banner */}
      {workshopCtx && (
        <div style={{
          background: 'white', border: '2px solid var(--jg2-ink)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          boxShadow: '3px 3px 0 var(--jg2-ink)',
        }}>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jg2-mute)', marginBottom: 4 }}>
            Current Build Log
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {workshopImagePreview && (
              <img
                src={workshopImagePreview}
                alt="scrap"
                style={{ height: 52, width: 52, objectFit: 'cover', border: '2px solid var(--jg2-ink)', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: workshopCtx.scraps?.length ? 6 : 0 }}>
                {workshopCtx.title || 'New Project'}
              </div>
              {workshopCtx.scraps?.filter(Boolean).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {workshopCtx.scraps.filter(Boolean).map((s, i) => (
                    <span key={i} style={{ background: 'var(--jg2-ink)', color: 'var(--jg2-paper)', fontSize: 10, padding: '2px 7px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase' }}>
                      {s}
                    </span>
                  ))}
                  {workshopCtx.budget && (
                    <span style={{ background: 'var(--jg2-yellow)', color: 'var(--jg2-ink)', fontSize: 10, padding: '2px 7px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, border: '1px solid var(--jg2-ink)' }}>
                      ₹{workshopCtx.budget}
                    </span>
                  )}
                  {workshopImagePreview && (
                    <span style={{ background: 'var(--jg2-brick-soft)', color: 'var(--jg2-brick)', fontSize: 10, padding: '2px 7px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, border: '1px solid var(--jg2-brick)' }}>
                      📷 photo attached
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', flexDirection: 'column', gap: 12, color: 'var(--jg2-mute)' }}>
            <div style={{ fontSize: 36 }}>⚙</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center' }}>
              Describe your problem. Use what you have.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {[
                'Vegetable cooler ₹500 no electricity Rajasthan',
                'Bike engine se pani pump karna hai Goa ₹1000',
                'Solar dryer for chillies Gujarat ₹800',
              ].map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{
                  padding: '6px 12px', fontSize: 12, background: 'white',
                  border: '1.5px solid var(--jg2-kraft-deep)', borderRadius: 20,
                  cursor: 'pointer', color: 'var(--jg2-graphite)', fontFamily: 'inherit',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'user') return (
            <div key={i}>
              <UserBubble text={msg.text} />
              {msg.hasImage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--jg2-mute)', fontFamily: 'JetBrains Mono, monospace' }}>📎 image attached</span>
                </div>
              )}
            </div>
          );
          if (msg.type === 'status') return <StatusBubble key={i} text={msg.text} />;
          if (msg.type === 'streaming') return <StreamingBubble key={i} text={msg.text} voiceLang={voiceLang} />;
          if (msg.type === 'solution') return (
            <SolutionBubble
              key={i}
              solution={msg.solution}
              warnings={msg.warnings}
              onSave={() => saveToArchive(msg.solution, i)}
              saved={savedIdx.has(i)}
              voiceLang={voiceLang}
            />
          );
          if (msg.type === 'clarification') return (
            <ClarificationBubble key={i} question={msg.question} onReply={handleClarificationReply} voiceLang={voiceLang} />
          );
          if (msg.type === 'error') return <ErrorBubble key={i} text={msg.text} />;
          return null;
        })}

        {loading && messages[messages.length - 1]?.type === 'user' && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Fixed input bar */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 40,
        padding: '10px 20px',
        background: 'rgba(251,249,244,0.97)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--jg2-kraft)',
      }}>
        <div style={{ maxWidth: 896, margin: '0 auto' }}>
          {/* Image preview */}
          {imageFile && (
            <div style={{ marginBottom: 6 }}>
              <ImagePreview file={imageFile} onRemove={() => setImageFile(null)} />
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{
            background: 'white', border: '2px solid var(--jg2-ink)',
            borderRadius: 12, padding: '8px 10px',
            display: 'flex', gap: 6, alignItems: 'flex-end',
            boxShadow: '3px 3px 0 var(--jg2-ink)',
          }}>
            {/* Image attach */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); e.target.value = ''; } }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo"
              style={{
                padding: 7, fontSize: 16, border: '1.5px solid var(--jg2-kraft)',
                borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                background: imageFile ? 'var(--jg2-yellow)' : 'transparent',
                color: 'var(--jg2-graphite)', transition: 'background 0.15s',
              }}
            >
              📷
            </button>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={interimText && !input ? interimText : input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={listening ? '🎙 Listening… click mic again to stop' : 'Describe your problem, budget, location… (Enter to send)'}
              rows={1}
              disabled={loading}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6,
                background: 'transparent',
                color: listening ? 'var(--jg2-brick)' : 'var(--jg2-ink)',
                maxHeight: 120, overflowY: 'auto',
              }}
            />

            {/* Voice button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                title={listening ? 'Stop recording' : `Voice input (${voiceLang === 'hi-IN' ? 'Hindi' : 'English'})`}
                style={{
                  padding: 8, fontSize: 17,
                  border: `1.5px solid ${listening ? 'var(--jg2-brick)' : 'var(--jg2-ink)'}`,
                  borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                  background: listening ? 'var(--jg2-brick)' : 'transparent',
                  color: listening ? '#fff' : 'var(--jg2-graphite)',
                  transition: 'all 0.15s',
                  animation: listening ? 'jg-pulse 1.2s ease-in-out infinite' : 'none',
                }}
              >
                🎙
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={loading || (!input.trim() && !interimText.trim() && !imageFile)}
              className="jg2-btn-navy"
              style={{ padding: '9px 16px', fontSize: 13, flexShrink: 0 }}
            >
              {loading ? '…' : 'Send ↑'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Chat;
