import { useEffect, useState } from 'react';

const MAX_MESSAGE_LENGTH = 1900;
const env = import.meta.env;

// Backend + web app URLs come from build-time env (production) with
// localhost fallbacks for dev. No LLM keys live in the extension —
// every query goes through the FastAPI backend.
const DEFAULT_CONFIG = {
  backendUrl: env.VITE_API_URL || 'http://localhost:8000',
  webAppUrl: env.VITE_WEB_APP_URL || 'http://localhost:5173',
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

async function getDeviceId() {
  let id = await storage.get('jugaadgptDeviceId');
  if (!id) {
    id = crypto.randomUUID();
    await storage.set({ jugaadgptDeviceId: id });
  }
  return id;
}

function truncateText(value, maxLength) {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function detectReplyLanguage(text) {
  const source = (text || '').trim();
  if (!source) return 'english';
  if (/[ऀ-ॿ]/.test(source)) return 'hindi';

  const romanHindiHints = [
    'kaise', 'kya', 'mera', 'mere', 'meri', 'hai', 'nahi', 'karna', 'karu', 'karoon',
    'jugaad', 'sahi', 'bina', 'paisa', 'thik', 'theek', 'krna', 'ka', 'ki',
    'mein', 'me', 'wala', 'wali', 'kyun', 'kaun', 'kitna', 'kaunsa',
  ];
  const lowered = source.toLowerCase();
  const hintMatches = romanHindiHints.filter((hint) => new RegExp(`\\b${hint}\\b`, 'i').test(lowered)).length;
  if (hintMatches >= 2) return 'english';
  return 'english';
}

function extractSearchQuery(pageContext) {
  try {
    const url = new URL(pageContext?.url || '');
    const queryKeys = ['q', 'p', 'text', 'wd', 'query', 'search_query'];
    for (const key of queryKeys) {
      const value = url.searchParams.get(key)?.trim();
      if (value) return value;
    }
  } catch {
    return '';
  }
  return '';
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
  const response = await chrome.runtime.sendMessage({
    type: 'JUGAADGPT_PING_BACKEND',
    backendUrl: url,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Health check failed.');
  }

  return response.result;
}

async function queryBackend(backendUrl, message, lang, deviceId) {
  const response = await chrome.runtime.sendMessage({
    type: 'JUGAADGPT_QUERY_BACKEND',
    backendUrl,
    payload: message,
    sessionId: `extension-${deviceId || Date.now()}`,
    lang,
    deviceId,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Backend request failed.');
  }
  return response;
}

function Header({ settingsOpen, onToggleSettings }) {
  return (
    <header className="panel hero-panel">
      <div>
        <div className="eyebrow">JugaadGPT Extension</div>
        <h1>{settingsOpen ? 'Settings' : 'Search workspace'}</h1>
      </div>
      <div className="hero-actions">
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
  onSave,
  onReset,
  onPing,
}) {
  return (
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
      <div className="section-head" style={{ marginTop: 12 }}>
        <button className="ghost-button" onClick={onSave} disabled={busy}>
          Save
        </button>
        <button className="reset-button" onClick={onReset} disabled={busy}>
          Reset defaults
        </button>
      </div>
    </section>
  );
}

function WorkspaceView({
  busy,
  pageContext,
  prompt,
  responseText,
  quota,
  loginRequired,
  onPromptChange,
  onRefreshPageContext,
  onRunQuery,
  onOpenLogin,
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
        {quota ? (
          <div className="badge">
            {quota.used}/{quota.limit}{quota.authenticated ? '' : ' free'} today
          </div>
        ) : null}
        <label className="field">
          <span>Prompt</span>
          <textarea value={prompt} onChange={onPromptChange} rows={5} />
        </label>
        {loginRequired ? (
          <button className="primary-button" onClick={onOpenLogin}>
            Daily free limit reached — log in on the website
          </button>
        ) : (
          <button className="primary-button" onClick={onRunQuery} disabled={busy}>
            {busy ? 'Working...' : 'Send current page'}
          </button>
        )}
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
  const [quota, setQuota] = useState(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const savedConfig = await storage.get('jugaadgptConfig');
      const nextConfig = { ...DEFAULT_CONFIG, ...(savedConfig || {}) };
      const id = await getDeviceId();
      const context = await getPageContext();
      const detectedSearchQuery = extractSearchQuery(context);

      if (!active) return;
      setConfig(nextConfig);
      setDeviceId(id);
      setPageContext(context);
      if (detectedSearchQuery) {
        setPrompt(`Help with this search query in a practical JugaadGPT way: ${detectedSearchQuery}`);
      }
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

  const saveConfig = async () => {
    await storage.set({ jugaadgptConfig: config });
    setStatus('Configuration saved to chrome.storage.local.');
  };

  const resetConfig = async () => {
    setConfig(DEFAULT_CONFIG);
    await storage.set({ jugaadgptConfig: DEFAULT_CONFIG });
    setStatus('Configuration reset to build defaults.');
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

  // Login happens on the website (never inside the popup) — after logging
  // in there, the higher account quota applies to future extension queries
  // from this device only once the backend sees the same device id, so we
  // simply direct the user to the web app.
  const openWebLogin = () => {
    chrome.tabs.create({ url: `${config.webAppUrl.replace(/\/$/, '')}/?login=1` });
  };

  const runQuery = async () => {
    setBusy(true);
    setResponseText('Working...');
    setStatus('Sending page context to backend...');
    try {
      const message = buildMessage(prompt, pageContext || {});
      const lang = detectReplyLanguage(prompt || extractSearchQuery(pageContext) || '');
      const response = await queryBackend(config.backendUrl, message, lang, deviceId);
      if (response.quota) setQuota(response.quota);
      if (response.loginRequired) {
        setLoginRequired(true);
        setResponseText(response.result || 'Daily free limit reached — log in on the website to continue.');
        setStatus('Daily free limit reached.');
      } else {
        setResponseText(response.result);
        setStatus('Response received.');
      }
    } catch (error) {
      setResponseText(error.message || 'Request failed.');
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
          quota={quota}
          loginRequired={loginRequired}
          onPromptChange={(event) => setPrompt(event.target.value)}
          onRefreshPageContext={refreshPageContext}
          onRunQuery={runQuery}
          onOpenLogin={openWebLogin}
        />
      )}
    </div>
  );
}
