'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from './AppShell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getSessionId() {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('jg_session_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('jg_session_id', id); }
  return id;
}

// ── Bubble components ────────────────────────────────────────────────────────

const UserBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <div style={{
      background: 'var(--jg2-ink)', color: 'var(--jg2-paper)',
      padding: '12px 16px', borderRadius: '12px 12px 2px 12px',
      maxWidth: '70%', fontSize: 14, lineHeight: 1.6,
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
    <div style={{
      padding: '4px 0', fontSize: 12, color: 'var(--jg2-mute)',
      fontFamily: 'JetBrains Mono, monospace',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jg2-yellow)', flexShrink: 0 }} />
      {text}
    </div>
  </div>
);

const StreamingBubble = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
    <div style={{
      background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)',
      padding: '14px 18px', borderRadius: '12px 12px 12px 2px',
      maxWidth: '82%', fontSize: 13.5, lineHeight: 1.7,
      fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap',
      color: 'var(--jg2-graphite)',
    }}>
      {text}
      <span style={{
        display: 'inline-block', width: 2, height: '1em',
        background: 'var(--jg2-ink)', marginLeft: 2, verticalAlign: 'text-bottom',
        animation: 'jg-blink 0.8s step-end infinite',
      }} />
    </div>
  </div>
);

const SolutionBubble = ({ solution, warnings }) => (
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
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              Materials
            </div>
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
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              How to Build
            </div>
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
      </div>
    </div>
  </div>
);

const ClarificationBubble = ({ question, onReply, disabled }) => {
  const [ans, setAns] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!ans.trim() || sent) return;
    setSent(true);
    onReply(ans.trim());
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        background: 'var(--jg2-card)', border: '1.5px solid var(--jg2-kraft)',
        padding: '14px 18px', borderRadius: '12px 12px 12px 2px', maxWidth: '80%',
      }}>
        <div style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 12, color: 'var(--jg2-graphite)' }}>
          {question}
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
                flex: 1, padding: '8px 12px',
                border: '1.5px solid var(--jg2-ink)', borderRadius: 6,
                fontFamily: 'inherit', fontSize: 13, outline: 'none',
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
      fontSize: 13, color: 'var(--jg2-brick)', maxWidth: '70%',
    }}>
      {text}
    </div>
  </div>
);

// ── Main chat screen ─────────────────────────────────────────────────────────

export const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => getSessionId());

  // Accumulates all messages in the current incomplete constraint-gathering turn.
  // When clarification is needed, we keep adding to this context so the extractor
  // always sees the full conversation even if the user sends one-word replies.
  const pendingContext = useRef([]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const streamingIdxRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pushMsg = (msg) => setMessages(prev => [...prev, msg]);

  const callAPI = useCallback(async (fullMessage) => {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: fullMessage, channel: 'web' }),
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
            else if (l.startsWith('data: ')) dataLine = l.slice(6).trim();
          }
          if (!eventType || !dataLine) continue;

          if (eventType === 'status') {
            pushMsg({ type: 'status', text: dataLine });

          } else if (eventType === 'token') {
            streamText += dataLine;
            if (streamingIdxRef.current === null) {
              setMessages(prev => {
                streamingIdxRef.current = prev.length;
                return [...prev, { type: 'streaming', text: streamText }];
              });
            } else {
              const idx = streamingIdxRef.current;
              setMessages(prev => {
                const copy = [...prev];
                copy[idx] = { type: 'streaming', text: streamText };
                return copy;
              });
            }

          } else if (eventType === 'clarification') {
            const parsed = JSON.parse(dataLine);
            // Don't clear pendingContext — next reply will include all prior context
            pushMsg({ type: 'clarification', question: parsed.question });

          } else if (eventType === 'solution') {
            const parsed = JSON.parse(dataLine);
            const idx = streamingIdxRef.current;
            if (idx !== null) {
              setMessages(prev => {
                const copy = [...prev];
                copy[idx] = { type: 'solution', solution: parsed.solution, warnings: parsed.warnings };
                return copy;
              });
            } else {
              pushMsg({ type: 'solution', solution: parsed.solution, warnings: parsed.warnings });
            }
            // Solution delivered — reset context
            pendingContext.current = [];

          } else if (eventType === 'error') {
            pushMsg({ type: 'error', text: dataLine });
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
  }, [sessionId]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    // New top-level message: start fresh context
    pendingContext.current = [text];
    pushMsg({ type: 'user', text });
    callAPI(text);
  }, [input, loading, callAPI]);

  const handleClarificationReply = useCallback((answer) => {
    // Add this answer to the accumulated context so the extractor sees everything
    pendingContext.current = [...pendingContext.current, answer];
    const fullContext = pendingContext.current.join('\n');

    pushMsg({ type: 'user', text: answer });
    callAPI(fullContext);
  }, [callAPI]);

  return (
    <AppShell active="workshop" bgClass="jg2-bg-grid">
      <style>{`
        @keyframes jg-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes jg-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div style={{
        maxWidth: 760, margin: '0 auto',
        height: 'calc(100vh - 160px)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>

          {messages.length === 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: 12, color: 'var(--jg2-mute)',
            }}>
              <div style={{ fontSize: 32 }}>⚙</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                Describe your problem. Use what you have.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                {[
                  'Vegetable cooler ₹500 no electricity Rajasthan',
                  'Bike engine se pani pump karna hai Goa ₹1000',
                  'Solar dryer for chillies Gujarat ₹800',
                ].map(s => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{
                    padding: '6px 12px', fontSize: 12,
                    background: 'var(--jg2-paper)', border: '1.5px solid var(--jg2-kraft-deep)',
                    borderRadius: 20, cursor: 'pointer', color: 'var(--jg2-graphite)', fontFamily: 'inherit',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'user') return <UserBubble key={i} text={msg.text} />;
            if (msg.type === 'status') return <StatusBubble key={i} text={msg.text} />;
            if (msg.type === 'streaming') return <StreamingBubble key={i} text={msg.text} />;
            if (msg.type === 'solution') return <SolutionBubble key={i} solution={msg.solution} warnings={msg.warnings} />;
            if (msg.type === 'clarification') return (
              <ClarificationBubble key={i} question={msg.question} onReply={handleClarificationReply} disabled={loading} />
            );
            if (msg.type === 'error') return <ErrorBubble key={i} text={msg.text} />;
            return null;
          })}

          {loading && messages[messages.length - 1]?.type === 'user' && <ThinkingBubble />}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{
          background: 'var(--jg2-card)', border: '2px solid var(--jg2-ink)',
          borderRadius: 12, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-end',
          boxShadow: '3px 3px 0 var(--jg2-ink)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Describe your problem, budget, location… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6,
              background: 'transparent', color: 'var(--jg2-ink)',
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="jg2-btn-navy"
            style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0, opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            {loading ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </AppShell>
  );
};
