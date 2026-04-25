import { useEffect, useState } from 'react';

const MAX_MESSAGE_LENGTH = 1900;
const env = import.meta.env;

const DEFAULT_CONFIG = {
  backendUrl: 'http://localhost:8000',
  providers: {
    anthropic: {
      label: 'Anthropic',
      apiKey: env.VITE_ANTHROPIC_API_KEY || '',
      model: env.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
    },
    groq: {
      label: 'Groq',
      apiKey: env.VITE_GROQ_API_KEY || '',
      model: env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
    },
    voyage: {
      label: 'Voyage',
      apiKey: env.VITE_VOYAGE_API_KEY || '',
      model: env.VITE_VOYAGE_MODEL || 'voyage-3-large',
    },
    google: {
      label: 'Google AI',
      apiKey: env.VITE_GOOGLE_AI_API_KEY || '',
      model: env.VITE_GOOGLE_AI_MODEL || 'gemma-4-31b-it',
    },
    maps: {
      label: 'Google Maps',
      apiKey: env.VITE_GOOGLE_MAPS_API_KEY || '',
      model: env.VITE_GOOGLE_MAPS_MODEL || 'maps-geocoding',
    },
  },
};

const storage = {
  async get(key) {
    if (!chrome?.storage?.local) return null;
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  },
  async set(value) {
    if (!chrome?.storage?.local) return;
    await chrome.storage.local.set(value);
  },
};

function truncateText(value, maxLength) {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function getProviderEntries(config) {
  return Object.entries(config.providers);
}

function buildMessage(prompt, pageContext) {
  const parts = [
    'Use the current page context to help the user.',
    `Page title: ${truncateText(pageContext.title || 'Unknown', 120)}`,
    `Page URL: ${truncateText(pageContext.url || 'Unknown', 220)}`,
  ];

  if (pageContext.selection) {
    parts.push(`Selected text:\n${truncateText(pageContext.selection, 300)}`);
  }

  if (pageContext.description) {
    parts.push(`Meta description:\n${truncateText(pageContext.description, 220)}`);
  }

  if (pageContext.headings?.length) {
    parts.push(`Headings:\n${truncateText(pageContext.headings.slice(0, 6).join('\n'), 280)}`);
  }

  if (pageContext.bodyText) {
    parts.push(`Body excerpt:\n${truncateText(pageContext.bodyText, 700)}`);
  }

  parts.push(`User request:\n${truncateText(prompt, 320)}`);
  return truncateText(parts.join('\n\n'), MAX_MESSAGE_LENGTH);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tabs[0] ?? null;
}

async function getPageContext() {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return null;
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'JUGAADGPT_GET_PAGE_CONTEXT' });
    return response ?? null;
  } catch {
    return null;
  }
}

async function pingBackend(url) {
  const response = await fetch(`${url.replace(/\/$/, '')}/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  return response.json();
}

async function queryBackend(backendUrl, message) {
  const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: `extension-${Date.now()}`,
      message,
      channel: 'web',
      lang: 'hinglish',
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
  if (clarification?.question) return `Question: ${clarification.question}`;
  if (solution) return JSON.stringify(solution, null, 2);
  return tokens || 'No response from backend.';
}

function Header({ settingsOpen, onToggleSettings, keyCount }) {
  return (
    <header className="panel hero-panel">
      <div>
        <div className="eyebrow">JugaadGPT Extension</div>
        <h1>{settingsOpen ? 'Settings' : 'Search workspace'}</h1>
      </div>
      <div className="hero-actions">
        <div className="badge">{keyCount} keys loaded</div>
        <button className="hero-toggle" onClick={onToggleSettings}>
          {settingsOpen ? 'Back' : 'Settings'}
        </button>
      </div>
    </header>
  );
}

function SettingsView({
  config,
  busy,
  onBackendUrlChange,
  onProviderChange,
  onSave,
  onReset,
  onPing,
}) {
  return (
    <>
      <section className="panel">
        <div className="section-head">
          <h2>Backend</h2>
          <button className="ghost-button" onClick={onPing} disabled={busy}>
            Ping
          </button>
        </div>
        <label className="field">
          <span>API base URL</span>
          <input value={config.backendUrl} onChange={onBackendUrlChange} />
        </label>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Provider keys</h2>
          <button className="ghost-button" onClick={onSave} disabled={busy}>
            Save
          </button>
        </div>
        <div className="provider-list">
          {getProviderEntries(config).map(([providerKey, provider]) => (
            <div className="provider-card" key={providerKey}>
              <div className="provider-title">{provider.label}</div>
              <label className="field">
                <span>Model</span>
                <input
                  value={provider.model}
                  onChange={(event) => onProviderChange(providerKey, 'model', event.target.value)}
                />
              </label>
              <label className="field">
                <span>API key</span>
                <input
                  type="password"
                  value={provider.apiKey}
                  onChange={(event) => onProviderChange(providerKey, 'apiKey', event.target.value)}
                />
              </label>
            </div>
          ))}
        </div>
        <button className="reset-button" onClick={onReset} disabled={busy}>
          Reset defaults
        </button>
      </section>
    </>
  );
}

function WorkspaceView({
  busy,
  pageContext,
  prompt,
  responseText,
  onPromptChange,
  onRefreshPageContext,
  onRunQuery,
}) {
  return (
    <>
      <section className="panel">
        <div className="section-head">
          <h2>Active tab</h2>
          <button className="ghost-button" onClick={onRefreshPageContext} disabled={busy}>
            Refresh
          </button>
        </div>
        <div className="context-card">
          <div className="context-title">{pageContext?.title || 'No readable tab context yet'}</div>
          <div className="context-url">{pageContext?.url || 'Open a standard page and refresh.'}</div>
          {pageContext?.selection ? <p>{truncateText(pageContext.selection, 220)}</p> : null}
        </div>
      </section>

      <section className="panel">
        <h2>Ask JugaadGPT</h2>
        <label className="field">
          <span>Prompt</span>
          <textarea value={prompt} onChange={onPromptChange} rows={5} />
        </label>
        <button className="primary-button" onClick={onRunQuery} disabled={busy}>
          {busy ? 'Working...' : 'Send current page'}
        </button>
      </section>

      <section className="panel">
        <h2>Response</h2>
        <pre className="response-box">{responseText || 'No response yet.'}</pre>
      </section>
    </>
  );
}

export default function ExtensionPopup() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [pageContext, setPageContext] = useState(null);
  const [prompt, setPrompt] = useState('Give me a concise JugaadGPT-style analysis of this page and tell me the next practical step.');
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState('Loading extension config...');
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const savedConfig = await storage.get('jugaadgptConfig');
      const nextConfig = savedConfig || DEFAULT_CONFIG;
      const context = await getPageContext();

      if (!active) return;
      setConfig(nextConfig);
      setPageContext(context);
      setStatus(context ? 'Page context loaded.' : 'Extension configured. Open a normal web page to capture context.');
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const updateBackendUrl = (event) => {
    const value = event.target.value;
    setConfig((current) => ({ ...current, backendUrl: value }));
  };

  const updateProvider = (providerKey, field, value) => {
    setConfig((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [providerKey]: {
          ...current.providers[providerKey],
          [field]: value,
        },
      },
    }));
  };

  const saveConfig = async () => {
    await storage.set({ jugaadgptConfig: config });
    setStatus('Configuration saved to chrome.storage.local.');
  };

  const resetConfig = async () => {
    setConfig(DEFAULT_CONFIG);
    await storage.set({ jugaadgptConfig: DEFAULT_CONFIG });
    setStatus('Configuration reset to repo defaults.');
  };

  const refreshPageContext = async () => {
    const context = await getPageContext();
    setPageContext(context);
    setStatus(context ? 'Page context refreshed.' : 'Could not read page context from the current tab.');
  };

  const runHealthCheck = async () => {
    setBusy(true);
    setStatus('Pinging backend...');
    try {
      const data = await pingBackend(config.backendUrl);
      setStatus(`Backend healthy: ${data.status}`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const runQuery = async () => {
    setBusy(true);
    setResponseText('');
    setStatus('Sending page context to backend...');
    try {
      const message = buildMessage(prompt, pageContext || {});
      const result = await queryBackend(config.backendUrl, message);
      setResponseText(result);
      setStatus('Response received.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="popup-shell">
      <Header
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((current) => !current)}
        keyCount={getProviderEntries(config).length}
      />

      <section className="panel status-panel">
        <h2>Status</h2>
        <p className="status-line">{status}</p>
      </section>

      {settingsOpen ? (
        <SettingsView
          config={config}
          busy={busy}
          onBackendUrlChange={updateBackendUrl}
          onProviderChange={updateProvider}
          onSave={saveConfig}
          onReset={resetConfig}
          onPing={runHealthCheck}
        />
      ) : (
        <WorkspaceView
          busy={busy}
          pageContext={pageContext}
          prompt={prompt}
          responseText={responseText}
          onPromptChange={(event) => setPrompt(event.target.value)}
          onRefreshPageContext={refreshPageContext}
          onRunQuery={runQuery}
        />
      )}
    </div>
  );
}
