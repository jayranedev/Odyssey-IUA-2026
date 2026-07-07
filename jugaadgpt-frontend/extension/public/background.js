const DEFAULT_BACKEND_URL = 'https://odyssey-iua-2026-1.onrender.com';

let authToken = null;
chrome.storage.local.get(['authToken'], (result) => {
  authToken = result.authToken || null;
});

function normalizeLang(lang) {
  if (lang === 'hindi') return 'hindi';
  if (lang === 'english') return 'english';
  if (lang === 'hinglish') return 'english';
  return 'english';
}

async function pingBackend(url) {
  const response = await fetch(`${(url || DEFAULT_BACKEND_URL).replace(/\/$/, '')}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

async function queryBackend(backendUrl, message, sessionId, lang, deviceId) {
  const headers = { 'Content-Type': 'application/json' };
  if (deviceId) headers['X-Device-Id'] = deviceId;
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const response = await fetch(`${(backendUrl || DEFAULT_BACKEND_URL).replace(/\/$/, '')}/api/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session_id: sessionId || `extension-${Date.now()}`,
      message,
      channel: 'web',
      lang: normalizeLang(lang),
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`Backend request failed: ${response.status}${detail ? ` ${detail}` : ''}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming response unavailable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let tokens = '';
  let solution = null;
  let clarification = null;
  let lastStatus = '';
  let backendError = '';
  let quota = null;
  let loginRequired = false;
  let capacityMessage = '';

  const parseEvents = (rawChunk) => {
    const blocks = rawChunk.split('\n\n');
    for (const block of blocks) {
      let eventName = '';
      let eventData = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) eventName = line.slice(7).trim();
        if (line.startsWith('data: ')) eventData = line.slice(6).trim();
      }

      if (!eventName || !eventData) continue;
      if (eventName === 'token') tokens += eventData;
      if (eventName === 'status') lastStatus = eventData;
      if (eventName === 'error') backendError = eventData;
      if (eventName === 'quota') {
        try { quota = JSON.parse(eventData); } catch { quota = null; }
      }
      if (eventName === 'login_required') {
        loginRequired = true;
        try { capacityMessage = JSON.parse(eventData).message || ''; } catch { capacityMessage = ''; }
      }
      if (eventName === 'quota_exhausted' || eventName === 'capacity') {
        try { capacityMessage = JSON.parse(eventData).message || eventData; } catch { capacityMessage = eventData; }
      }
      if (eventName === 'solution') {
        try {
          solution = JSON.parse(eventData);
        } catch {
          solution = null;
        }
      }
      if (eventName === 'clarification') {
        try {
          clarification = JSON.parse(eventData);
        } catch {
          clarification = null;
        }
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const boundary = buffer.lastIndexOf('\n\n');
    if (boundary !== -1) {
      parseEvents(buffer.slice(0, boundary + 2));
      buffer = buffer.slice(boundary + 2);
    }
  }

  if (buffer.trim()) parseEvents(buffer);
  if (backendError) {
    throw new Error(`Backend error: ${backendError}`);
  }

  const wrap = (result) => ({ result, quota, loginRequired });

  if (loginRequired) {
    return wrap(capacityMessage || 'Daily free limit reached — log in on the website to continue.');
  }
  if (capacityMessage) {
    return wrap(capacityMessage);
  }
  if (clarification?.question) {
    return wrap(`Need one detail before I can answer properly:\n\n${clarification.question}`);
  }
  if (solution?.solution) {
    const data = solution.solution;
    const lines = [
      data.title || 'JugaadGPT suggestion',
      data.summary || '',
    ].filter(Boolean);
    if (data.build_steps?.length) {
      lines.push(`Next step: ${data.build_steps[0]}`);
    }
    return wrap(lines.join('\n\n'));
  }
  if (tokens) return wrap(tokens);
  if (lastStatus) return wrap(`Backend status: ${lastStatus}`);
  return wrap('No response from backend.');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'JUGAADGPT_SET_TOKEN') {
    authToken = message.token;
    chrome.storage.local.set({ authToken: message.token });
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'JUGAADGPT_QUERY_BACKEND') {
    queryBackend(message.backendUrl, message.payload, message.sessionId, message.lang, message.deviceId)
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((error) => sendResponse({ ok: false, error: error.message || 'Unknown error' }));
    return true;
  }

  if (message?.type === 'JUGAADGPT_PING_BACKEND') {
    pingBackend(message.backendUrl)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message || 'Unknown error' }));
    return true;
  }

  if (message?.type === 'JUGAADGPT_OPEN_FULL_PANEL') {
    const tabId = _sender?.tab?.id;
    const windowId = _sender?.tab?.windowId;

    if (chrome.sidePanel?.open && typeof tabId === 'number') {
      chrome.sidePanel.setOptions({
        tabId,
        path: 'index.html',
        enabled: true,
      }, () => {
        const setOptionsError = chrome.runtime.lastError;
        if (setOptionsError) {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, () => {
            sendResponse({ ok: true, mode: 'tab-fallback' });
          });
          return;
        }

        chrome.sidePanel.open({ tabId, windowId }, () => {
          const openError = chrome.runtime.lastError;
          if (openError) {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, () => {
              sendResponse({ ok: true, mode: 'tab-fallback' });
            });
            return;
          }
          sendResponse({ ok: true, mode: 'side-panel' });
        });
      });
      return true;
    }

    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, () => {
      sendResponse({ ok: true, mode: 'tab-fallback' });
    });
    return true;
  }

  return false;
});
