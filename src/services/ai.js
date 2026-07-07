import { API_BASE, authHeaders } from './api';

let _sessionId = null;
function getSessionId() {
  if (!_sessionId) _sessionId = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  return _sessionId;
}

/**
 * Calls JugaadGPT backend (SSE stream) and returns the accumulated plain-text response.
 * Drop-in replacement for the previous Google AI call.
 */
export const getGemmaResponse = async (prompt, history = []) => {
  try {
    const message = history.length
      ? `${history.map(m => (m.role === 'user' ? m.text : '')).filter(Boolean).join('\n')}\n${prompt}`
      : prompt;

    const res = await fetch(`${API_BASE}/api/query`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ session_id: getSessionId(), message, channel: 'web' }),
    });

    if (!res.ok) throw new Error(`Server ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let tokens = '';
    let solution = null;
    let clarification = null;

    const parseChunk = (raw) => {
      const blocks = raw.split('\n\n');
      for (const block of blocks) {
        const lines = block.split('\n');
        let ev = '', data = '';
        for (const l of lines) {
          if (l.startsWith('event: ')) ev = l.slice(7).trim();
          else if (l.startsWith('data: ')) data = l.slice(6).trim();
        }
        if (!ev || !data) continue;
        if (ev === 'token') tokens += data;
        else if (ev === 'solution') { try { solution = JSON.parse(data); } catch { /* ignore */ } }
        else if (ev === 'clarification') { try { clarification = JSON.parse(data); } catch { /* ignore */ } }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const cut = buffer.lastIndexOf('\n\n');
      if (cut !== -1) { parseChunk(buffer.slice(0, cut + 2)); buffer = buffer.slice(cut + 2); }
    }
    if (buffer.trim()) parseChunk(buffer);

    if (clarification) return `**Question:** ${clarification.question}`;
    if (solution) {
      const s = solution.solution || solution;
      const lines = [`## ${s.title || 'Jugaad Solution'} — ₹${s.total_cost_inr || 0}`];
      if (s.summary) lines.push(s.summary);
      if (s.materials?.length) {
        lines.push('\n**Materials:**');
        s.materials.forEach(m => lines.push(`- ${m.item} (${m.quantity}) — ₹${m.cost_inr || 0}`));
      }
      if (s.build_steps?.length) {
        lines.push('\n**Steps:**');
        s.build_steps.forEach((st, i) => lines.push(`${i + 1}. ${st}`));
      }
      if (s.expected_outcome) lines.push(`\n**Result:** ${s.expected_outcome}`);
      return lines.join('\n');
    }
    return tokens || 'No response from JugaadGPT.';
  } catch (err) {
    console.error('JugaadGPT error:', err);
    return `ENGINE ERROR: ${err.message}`;
  }
};
