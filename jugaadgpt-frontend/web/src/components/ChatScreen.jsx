'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from './AppShell';
import { authHeaders } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';
const WORKSHOP_KEY = 'jg_workshop_draft';
const SESSIONS_KEY = 'jg_sessions_v2';
const ROTATIONS = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1'];
const BG_COLORS = ['bg-white', 'bg-[#fdfcf0]', 'bg-yellow-50'];

function getSessionId() {
  if (typeof window === 'undefined') return 'ssr';
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

// ── Voice Input hook ─────────────────────────────────────────────────────────

function useVoice(onFinal, onInterim) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    setSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const start = useCallback((lang = 'hi-IN') => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      const final = e.results[e.results.length - 1].isFinal;
      if (final) onFinal(t);
      else onInterim?.(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onFinal, onInterim]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return { listening, start, stop, supported };
}

// ── Bubble components ────────────────────────────────────────────────────────

const UserBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <div style={{ padding: '4px 0', fontSize: 12, color: 'var(--jg2-mute)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jg2-yellow)', flexShrink: 0 }} />
      {text}
    </div>
  </div>
);

const StreamingBubble = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <div style={{
      background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)',
      padding: '14px 18px', borderRadius: '12px 12px 12px 2px',
      maxWidth: '82%', fontSize: 13.5, lineHeight: 1.7,
      fontFamily: 'JetBrains Mono, monospace', color: 'var(--jg2-graphite)',
    }}>
      <span style={{ color: 'var(--jg2-mute)', fontStyle: 'italic' }}>Drafting blueprint</span>
      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--jg2-ink)', marginLeft: 8, animation: 'jg-blink 0.8s infinite' }} />
      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--jg2-ink)', marginLeft: 4, animation: 'jg-blink 0.8s infinite 0.2s' }} />
      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--jg2-ink)', marginLeft: 4, animation: 'jg-blink 0.8s infinite 0.4s' }} />
    </div>
  </div>
);

const SolutionBubble = ({ solution, saved, warnings, onSave }) => {
  const router = useRouter();

  const handleLoadBlueprint = () => {
    localStorage.setItem('jg_blueprint', JSON.stringify(solution));
    router.push('/blueprints');
  };

  const handleFindBazaari = () => {
    localStorage.setItem('jg_bazaari', JSON.stringify({
      bazaari_context: {
        total_cost_inr: solution.total_cost_inr,
        materials: solution.materials
      }
    }));
    router.push('/bazaari');
  };

  return (
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <div style={{
      background: 'var(--jg2-card)', border: '2px solid var(--jg2-ink)',
      borderRadius: '12px 12px 12px 2px', maxWidth: '85%', overflow: 'hidden',
      boxShadow: '3px 3px 0 var(--jg2-ink)',
    }}>
      <div style={{
        background: 'var(--jg2-yellow)', padding: '10px 18px',
        borderBottom: '2px solid var(--jg2-ink)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          JUGAAD SOLUTION
        </span>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--jg2-graphite)', marginLeft: 'auto' }}>
          ₹{solution.total_cost_inr?.toFixed(0)}
        </span>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{solution.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--jg2-graphite)' }}>{solution.summary}</div>
        </div>

        {solution.materials?.length > 0 && (
          <div style={{ background: 'var(--jg2-kraft-light)', padding: '10px 14px', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Materials</div>
            {solution.materials.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: i < solution.materials.length - 1 ? '1px solid var(--jg2-kraft)' : 'none' }}>
                <span>{m.item} <span style={{ color: 'var(--jg2-mute)', fontSize: 11 }}>({m.quantity})</span></span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, flexShrink: 0, paddingLeft: 12 }}>₹{m.cost_inr?.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        {solution.build_steps?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>How to Build</div>
            {solution.build_steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, lineHeight: 1.6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--jg2-brick)', flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                <span style={{ color: 'var(--jg2-graphite)' }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {solution.expected_outcome && (
          <div style={{ background: 'var(--jg2-brick-soft)', padding: '10px 14px', borderRadius: 6, fontSize: 13, lineHeight: 1.6 }}>
            <strong>Expected result:</strong> {solution.expected_outcome}
          </div>
        )}

        {warnings?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--jg2-brick)', fontFamily: 'JetBrains Mono, monospace' }}>
            ⚠ {warnings.join(' · ')}
          </div>
        )}

        {/* Save to Archive */}
        <div style={{ borderTop: '1px dashed var(--jg2-kraft)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={onSave}
            disabled={saved}
            style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '6px 12px',
              background: saved ? 'var(--jg2-kraft-light)' : 'var(--jg2-yellow)',
              border: '1.5px solid var(--jg2-ink)',
              cursor: saved ? 'default' : 'pointer',
              color: 'var(--jg2-ink)',
            }}
          >
            {saved ? '✓ Saved to Archive' : '⊞ Save to Archive'}
          </button>
          
          <button
            onClick={handleLoadBlueprint}
            style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '6px 12px',
              background: 'var(--jg2-paper)',
              border: '1.5px solid var(--jg2-ink)',
              cursor: 'pointer', color: 'var(--jg2-ink)',
            }}
          >
            📐 Load Blueprint
          </button>

          <button
            onClick={handleFindBazaari}
            style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '6px 12px',
              background: 'var(--jg2-paper)',
              border: '1.5px solid var(--jg2-ink)',
              cursor: 'pointer', color: 'var(--jg2-ink)',
            }}
          >
            🛒 Find in Bazaari
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

const ClarificationBubble = ({ question, onReply }) => {
  const [ans, setAns] = useState('');
  const [sent, setSent] = useState(false);
  const send = () => {
    if (!ans.trim() || sent) return;
    setSent(true);
    onReply(ans.trim());
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)', padding: '14px 18px', borderRadius: '12px 12px 12px 2px', maxWidth: '80%' }}>
        <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 12, color: 'var(--jg2-graphite)' }}>{question}</div>
        {!sent ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus value={ans} onChange={e => setAns(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Your answer…"
              style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--jg2-ink)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, outline: 'none', background: 'var(--jg2-paper)' }}
            />
            <button onClick={send} className="jg2-btn-navy" style={{ padding: '8px 14px', fontSize: 13 }}>Send</button>
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
    <div style={{ background: 'var(--jg2-brick-soft)', border: '1.5px solid var(--jg2-brick)', padding: '10px 16px', borderRadius: '12px 12px 12px 2px', fontSize: 13, color: 'var(--jg2-brick)', maxWidth: '70%' }}>
      {text}
    </div>
  </div>
);

// ── Sessions drawer ──────────────────────────────────────────────────────────

const SessionsDrawer = ({ open, onClose, currentId, onSwitch, sessionVersion }) => {
  const [sessions, setSessions] = useState([]);
  
  useEffect(() => {
    if (!open) return;
    const fetchRemote = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sessions`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.map(d => ({ id: d.id, title: d.title, updatedAt: d.updated_at })));
          return;
        }
      } catch {}
      setSessions(loadSessions());
    };
    fetchRemote();
  }, [open, sessionVersion]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: open ? 'flex' : 'none',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: 280, background: 'var(--jg2-paper)',
        borderRight: '2px solid var(--jg2-ink)', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1.5px solid var(--jg2-ink)', fontFamily: "'Archivo Black', sans-serif", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Conversations
          <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: 20, fontSize: 13, color: 'var(--jg2-mute)', fontFamily: 'JetBrains Mono, monospace' }}>No past conversations yet.</div>
        ) : sessions.map(s => (
          <button key={s.id} onClick={() => { onSwitch(s.id); onClose(); }} style={{
            padding: '12px 16px', textAlign: 'left', background: s.id === currentId ? 'var(--jg2-kraft-light)' : 'transparent',
            border: 'none', borderBottom: '0.5px solid rgba(14,44,90,0.15)',
            cursor: 'pointer', color: 'var(--jg2-ink)', fontSize: 13, lineHeight: 1.4,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.title}</div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--jg2-mute)' }}>
              {new Date(s.updatedAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Fire-and-forget mirror of session + message to the backend
function mirrorToBackend(sessionId, title, lang, role, type, content) {
  const headers = authHeaders({ 'Content-Type': 'application/json' });
  const payload = { id: sessionId, lang };
  if (title) payload.title = title.slice(0, 60);

  fetch(`${API_BASE}/api/sessions`, {
    method: 'POST', headers,
    body: JSON.stringify(payload),
  }).then(() => fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
    method: 'POST', headers,
    body: JSON.stringify({ role, type, content_json: JSON.stringify(content) }),
  })).catch(() => {});
}

// ── Main chat screen ─────────────────────────────────────────────────────────

export const ChatScreen = () => {
  const searchParams = useSearchParams();
  const { user, sessionVersion, signOut, openLogin } = useAuth();
  const [sessionId, setSessionId] = useState(() => {
    const queryId = searchParams?.get('session_id');
    if (queryId) {
      if (typeof window !== 'undefined') localStorage.setItem('jg_session_id', queryId);
      return queryId;
    }
    return getSessionId();
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [showSessions, setShowSessions] = useState(false);
  const [savedIdx, setSavedIdx] = useState(new Set());
  const [toast, setToast] = useState('');
  const [workshopCtx, setWorkshopCtx] = useState(null);

  const pendingContext = useRef([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const streamingIdxRef = useRef(null);

  // Load workshop draft or existing session messages on mount (and on auth change)
  useEffect(() => {
    if (searchParams?.get('from') === 'workshop') {
      const raw = localStorage.getItem(WORKSHOP_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setWorkshopCtx(parsed);
            setInput(parsed.prompt || '');
          } else {
            setInput(raw);
          }
        } catch {
          setInput(raw);
        }
        localStorage.removeItem(WORKSHOP_KEY);
      }
    } else {
      const loadRemote = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              const formatted = data.messages.map(m => {
                const uiType = (m.role === 'user' && m.type === 'text') ? 'user' : m.type;
                return {
                  id: m.id,
                  type: uiType,
                  text: uiType === 'user' ? JSON.parse(m.content_json) : null,
                  solution: m.type === 'solution' ? JSON.parse(m.content_json) : null,
                  question: m.type === 'clarification' ? JSON.parse(m.content_json) : null
                };
              });
              setMessages(formatted);
              localStorage.setItem(`jg_msgs_${sessionId}`, JSON.stringify(formatted));
              return;
            }
          }
        } catch {}
        const stored = loadSessionMessages(sessionId);
        if (stored.length) setMessages(stored);
      };
      loadRemote();
    }
  }, [sessionId, searchParams, sessionVersion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (searchParams?.get('history') === 'true') {
      setShowSessions(true);
    }
  }, [searchParams]);

  // Auto-save session after each message
  useEffect(() => {
    if (messages.length) persistSession(sessionId, messages);
  }, [messages, sessionId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const pushMsg = (msg) => setMessages(prev => [...prev, msg]);

  // Voice
  const handleFinal = useCallback((t) => { setInput(t); setInterimText(''); }, []);
  const handleInterim = useCallback((t) => setInterimText(t), []);
  const { listening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useVoice(handleFinal, handleInterim);

  const toggleVoice = () => {
    if (listening) stopVoice();
    else startVoice(voiceLang);
  };

  // Save to archive
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
        method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(card),
      });
      if (res.ok) { setSavedIdx(prev => new Set([...prev, msgIdx])); showToast('Saved to archive ✓'); }
      else showToast('Failed to save');
    } catch { showToast('Failed to save'); }
  }, [sessionId]);

  // API call
  const callAPI = useCallback(async (fullMessage) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ session_id: sessionId, message: fullMessage, channel: 'web' }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      streamingIdxRef.current = null;
      let streamText = '';
      let finalSolution = null;

      const flush = (raw) => {
        const blocks = raw.split('\n\n');
        for (const block of blocks) {
          const lines = block.split('\n');
          let eventType = '';
          const dataLines = [];
          for (const l of lines) {
            if (l.startsWith('event: ')) eventType = l.slice(7).trim();
            else if (l.startsWith('data: ')) dataLines.push(l.slice(6));
          }
          if (!eventType || dataLines.length === 0) continue;
          
          const dataLine = dataLines.join('\n');

          if (eventType === 'status') {
            pushMsg({ type: 'status', text: dataLine });
          } else if (eventType === 'token') {
            streamText += dataLine;
            if (streamingIdxRef.current === null) {
              setMessages(prev => { streamingIdxRef.current = prev.length; return [...prev, { type: 'streaming', text: streamText }]; });
            } else {
              const idx = streamingIdxRef.current;
              setMessages(prev => { const c = [...prev]; c[idx] = { type: 'streaming', text: streamText }; return c; });
            }
          } else if (eventType === 'clarification') {
            const parsed = JSON.parse(dataLine);
            pushMsg({ type: 'clarification', question: parsed.question });
            mirrorToBackend(sessionId, null, voiceLang, 'assistant', 'clarification', parsed.question);
          } else if (eventType === 'solution') {
            const parsed = JSON.parse(dataLine);
            finalSolution = parsed.solution;
            const idx = streamingIdxRef.current;
            if (idx !== null) {
              setMessages(prev => { const c = [...prev]; c[idx] = { type: 'solution', solution: parsed.solution, warnings: parsed.warnings }; return c; });
            } else {
              pushMsg({ type: 'solution', solution: parsed.solution, warnings: parsed.warnings });
            }
            pendingContext.current = [];
            mirrorToBackend(sessionId, parsed.solution?.title, voiceLang, 'assistant', 'solution', parsed.solution);
          } else if (eventType === 'error') {
            pushMsg({ type: 'error', text: dataLine });
            pendingContext.current = [];
          } else if (['login_required', 'quota_exhausted', 'capacity'].includes(eventType)) {
            try {
              const parsed = JSON.parse(dataLine);
              pushMsg({ type: 'error', text: parsed.message || 'Capacity reached.' });
            } catch {
              pushMsg({ type: 'error', text: dataLine });
            }
            if (eventType === 'login_required') {
              if (user) signOut().catch(() => {});
              openLogin();
            }
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
      pushMsg({ type: 'error', text: `Error: ${err.message}` });
      pendingContext.current = [];
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [sessionId, voiceLang]);

  const handleSend = useCallback((e) => {
    if (e) e.preventDefault();
    const text = (interimText && !input ? interimText : input).trim();
    if (!text || loading) return;
    setInput('');
    setInterimText('');
    pendingContext.current = [text];
    pushMsg({ type: 'user', text });
    
    // Attempt to extract a title if this is the first message
    const stored = loadSessionMessages(sessionId);
    const title = stored.length === 0 ? text : null;
    mirrorToBackend(sessionId, title, voiceLang, 'user', 'text', text);
    
    callAPI(text);
  }, [input, loading, callAPI, sessionId, voiceLang]);

  const handleClarificationReply = useCallback((answer) => {
    pendingContext.current = [...pendingContext.current, answer];
    pushMsg({ type: 'user', text: answer });
    mirrorToBackend(sessionId, null, voiceLang, 'user', 'text', answer);
    callAPI(pendingContext.current.join('\n'));
  }, [callAPI, sessionId, voiceLang]);

  const startNewChat = () => {
    const id = newSessionId();
    setSessionId(id);
    setMessages([]);
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
    <AppShell active="workshop" bgClass="jg2-bg-grid">
      <style>{`
        @keyframes jg-pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes jg-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes jg-toast { 0% { opacity: 0; transform: translateY(8px); } 15%, 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; } }
      `}</style>

      <SessionsDrawer
        open={showSessions} onClose={() => setShowSessions(false)}
        currentId={sessionId} onSwitch={switchSession}
        sessionVersion={sessionVersion}
      />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--jg2-ink)', color: 'var(--jg2-paper)',
          padding: '8px 18px', borderRadius: 20, fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
          zIndex: 500, animation: 'jg-toast 2.5s ease forwards',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, gap: 8 }}>
          <button
            onClick={() => setShowSessions(true)}
            style={{ padding: '6px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ☰ Conversations
          </button>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Voice lang toggle */}
            {voiceSupported && (
              <select
                value={voiceLang}
                onChange={e => setVoiceLang(e.target.value)}
                style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '4px 6px', border: '1.5px solid var(--jg2-kraft)', background: 'var(--jg2-paper)', cursor: 'pointer' }}
              >
                <option value="hi-IN">🎙 Hindi</option>
                <option value="en-IN">🎙 English</option>
              </select>
            )}
            <button
              onClick={startNewChat}
              style={{ padding: '6px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', background: 'var(--jg2-yellow)', border: '1.5px solid var(--jg2-ink)', cursor: 'pointer' }}
            >
              + New Chat
            </button>
          </div>
        </div>

        {/* Workshop context header */}
        {workshopCtx && (
          <div style={{
            background: 'var(--jg2-card)', border: '2px solid var(--jg2-ink)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 4,
            boxShadow: '3px 3px 0 var(--jg2-ink)',
          }}>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jg2-mute)', marginBottom: 4 }}>Current Build Log</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: workshopCtx.scraps?.length ? 6 : 0 }}>{workshopCtx.title || 'New Project'}</div>
            {workshopCtx.scraps?.filter(Boolean).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {workshopCtx.scraps.filter(Boolean).map((s, i) => (
                  <span key={i} style={{ background: 'var(--jg2-ink)', color: 'var(--jg2-paper)', fontSize: 10, padding: '2px 7px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase' }}>{s}</span>
                ))}
                {workshopCtx.budget && (
                  <span style={{ background: 'var(--jg2-yellow)', color: 'var(--jg2-ink)', fontSize: 10, padding: '2px 7px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, border: '1px solid var(--jg2-ink)' }}>₹{workshopCtx.budget}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--jg2-mute)' }}>
              <div style={{ fontSize: 32 }}>⚙</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Describe your problem. Use what you have.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                {['Vegetable cooler ₹500 no electricity Rajasthan', 'Bike engine se pani pump karna hai Goa ₹1000', 'Solar dryer for chillies Gujarat ₹800'].map(s => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{
                    padding: '6px 12px', fontSize: 12, background: 'var(--jg2-paper)',
                    border: '1.5px solid var(--jg2-kraft-deep)', borderRadius: 20,
                    cursor: 'pointer', color: 'var(--jg2-graphite)', fontFamily: 'inherit',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'user') return <UserBubble key={i} text={msg.text} />;
            if (msg.type === 'status') return <StatusBubble key={i} text={msg.text} />;
            if (msg.type === 'streaming') return <StreamingBubble key={i} text={msg.text} />;
            if (msg.type === 'solution') return (
              <SolutionBubble key={i} solution={msg.solution} warnings={msg.warnings}
                onSave={() => saveToArchive(msg.solution, i)} saved={savedIdx.has(i)} />
            );
            if (msg.type === 'clarification') return (
              <ClarificationBubble key={i} question={msg.question} onReply={handleClarificationReply} disabled={loading} />
            );
            if (msg.type === 'error') return <ErrorBubble key={i} text={msg.text} />;
            return null;
          })}

          {loading && messages[messages.length - 1]?.type === 'user' && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} style={{
          background: 'var(--jg2-card)', border: '2px solid var(--jg2-ink)',
          borderRadius: 12, padding: '10px 12px',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          boxShadow: '3px 3px 0 var(--jg2-ink)',
        }}>
          <textarea
            ref={inputRef}
            value={interimText && !input ? interimText : input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={listening ? '🎙 Listening…' : 'Describe your problem, budget, location… (Enter to send)'}
            rows={1}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6,
              background: 'transparent', color: listening ? 'var(--jg2-brick)' : 'var(--jg2-ink)',
              maxHeight: 120, overflowY: 'auto',
            }}
          />

          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              title={listening ? 'Stop recording' : `Voice input (${voiceLang})`}
              style={{
                padding: '8px', fontSize: 18, border: '1.5px solid var(--jg2-ink)',
                borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                background: listening ? 'var(--jg2-brick)' : 'var(--jg2-paper)',
                color: listening ? '#fff' : 'var(--jg2-ink)',
                transition: 'background 0.15s',
              }}
            >
              🎙
            </button>
          )}

          <button
            type="submit"
            onClick={handleSend}
            disabled={loading || (!input.trim() && !interimText.trim())}
            className="jg2-btn-navy"
            style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0, opacity: loading || (!input.trim() && !interimText.trim()) ? 0.5 : 1 }}
          >
            {loading ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </AppShell>
  );
};
