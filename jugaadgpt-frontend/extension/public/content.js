console.log('JugaadGPT extension loaded in page.');

const MAX_MESSAGE_LENGTH = 1900;
const DEFAULT_BACKEND_URL = 'https://odyssey-iua-2026-1.onrender.com';
const SEARCH_HOST_PATTERNS = [
  /(^|\.)google\./i,
  /(^|\.)bing\.com$/i,
  /(^|\.)duckduckgo\.com$/i,
  /(^|\.)search\.yahoo\.com$/i,
  /(^|\.)youtube\.com$/i,
  /(^|\.)brave\.com$/i,
];

let lastProcessedKey = '';
let currentLocationHref = window.location.href;
let overlayRefs = null;

function truncateText(value, maxLength) {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function detectReplyLanguage(text) {
  const source = (text || '').trim();
  if (!source) return 'english';
  if (/[\u0900-\u097F]/.test(source)) return 'hindi';

  const romanHindiHints = [
    'kaise', 'kya', 'mera', 'mere', 'meri', 'hai', 'nahi', 'karna', 'karu', 'karoon',
    'jugaad', 'sahi', 'bina', 'paisa', 'repair', 'thik', 'theek', 'krna', 'ka', 'ki',
    'mein', 'me', 'wala', 'wali', 'kyun', 'kaun', 'kitna', 'kaunsa',
  ];
  const lowered = source.toLowerCase();
  const hintMatches = romanHindiHints.filter((hint) => new RegExp(`\\b${hint}\\b`, 'i').test(lowered)).length;
  if (hintMatches >= 2) return 'english';
  return 'english';
}

function collectPageContext() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((node) => node.textContent?.trim())
    .filter(Boolean)
    .slice(0, 12);

  const selectedText = window.getSelection?.().toString().trim() || '';
  const metaDescription = document
    .querySelector('meta[name="description"]')
    ?.getAttribute('content')
    ?.trim() || '';

  const bodyText = document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 2400) || '';

  return {
    title: document.title || '',
    url: window.location.href,
    selection: selectedText,
    description: metaDescription,
    headings,
    bodyText,
  };
}

function isSearchPage() {
  return SEARCH_HOST_PATTERNS.some((pattern) => pattern.test(window.location.hostname));
}

function getSearchQuery() {
  const url = new URL(window.location.href);
  const queryKeys = ['q', 'p', 'text', 'wd', 'query', 'search_query'];
  for (const key of queryKeys) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }

  const input = document.querySelector('input[name="q"], input[type="search"], textarea[name="q"]');
  return input?.value?.trim() || '';
}

function detectProblemType(query) {
  const normalized = query.toLowerCase();
  if (/\b(repair|fix|broken|not working|issue|problem|replace)\b/.test(normalized)) return 'repair';
  if (/\b(cool|cooler|cold|fresh|fridge|preserve)\b/.test(normalized)) return 'cooling';
  if (/\b(pump|water|irrigation|well)\b/.test(normalized)) return 'water';
  if (/\b(dry|dryer|dehydrate)\b/.test(normalized)) return 'drying';
  if (/\b(light|electricity|power|battery)\b/.test(normalized)) return 'power';
  return 'general';
}

async function getStoredConfig() {
  if (!chrome?.storage?.local) {
    return { backendUrl: DEFAULT_BACKEND_URL };
  }
  const result = await chrome.storage.local.get('jugaadgptConfig');
  return result.jugaadgptConfig || { backendUrl: DEFAULT_BACKEND_URL };
}

function buildSearchMessage(query, pageContext) {
  const parts = [
    `The user searched for: ${truncateText(query, 240)}.`,
    `This is likely a ${detectProblemType(query)} problem.`,
    'Give a practical JugaadGPT answer based on the search intent.',
    'If budget, location, climate, or power details are missing, ask one short clarification question.',
    `Search page title: ${truncateText(pageContext.title || 'Unknown', 140)}`,
  ];

  if (pageContext.headings?.length) {
    parts.push(`Visible search headings:\n${truncateText(pageContext.headings.slice(0, 4).join('\n'), 220)}`);
  }

  parts.push('Respond with the most practical next step for the user.');
  return truncateText(parts.join('\n\n'), MAX_MESSAGE_LENGTH);
}

async function queryBackend(backendUrl, message, lang) {
  const response = await chrome.runtime.sendMessage({
    type: 'JUGAADGPT_QUERY_BACKEND',
    backendUrl,
    payload: message,
    sessionId: `extension-search-${Date.now()}`,
    lang,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Backend request failed.');
  }

  return response.result;
}

function ensureOverlay() {
  if (overlayRefs && document.body.contains(overlayRefs.container)) {
    return overlayRefs;
  }

  const container = document.createElement('div');
  container.id = 'jugaadgpt-search-overlay';
  container.style.cssText = [
    'position:fixed',
    'right:20px',
    'bottom:20px',
    'width:340px',
    'max-width:calc(100vw - 32px)',
    'z-index:2147483647',
    'font-family:Segoe UI, Tahoma, sans-serif',
    'color:#132238',
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = [
    'border:1px solid #132238',
    'background:#fffaf0',
    'box-shadow:3px 3px 0 #132238',
    'overflow:hidden',
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = [
    'background:#132238',
    'color:#fff4d0',
    'padding:12px',
    'display:flex',
    'justify-content:space-between',
    'align-items:flex-start',
    'gap:8px',
  ].join(';');

  const titleWrap = document.createElement('div');
  const eyebrow = document.createElement('div');
  eyebrow.textContent = 'JUGAADGPT';
  eyebrow.style.cssText = 'font-size:11px;font-weight:700;opacity:.8;margin-bottom:4px;';
  const title = document.createElement('div');
  title.textContent = 'Search assist';
  title.style.cssText = 'font-size:20px;font-weight:800;line-height:1;';
  titleWrap.append(eyebrow, title);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = 'Hide';
  closeButton.style.cssText = [
    'border:1px solid rgba(255,244,208,.5)',
    'background:rgba(255,244,208,.08)',
    'color:#fff4d0',
    'padding:8px 10px',
    'font-weight:700',
    'cursor:pointer',
  ].join(';');
  closeButton.addEventListener('click', () => {
    container.remove();
    overlayRefs = null;
  });

  header.append(titleWrap, closeButton);

  const body = document.createElement('div');
  body.style.cssText = 'padding:12px;display:flex;flex-direction:column;gap:10px;';

  const queryLabel = document.createElement('div');
  queryLabel.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;opacity:.7;';
  queryLabel.textContent = 'Detected query';

  const queryText = document.createElement('div');
  queryText.style.cssText = 'border:1px solid rgba(19,34,56,.28);background:#fffdf7;padding:10px;font-size:13px;font-weight:700;';

  const status = document.createElement('div');
  status.style.cssText = 'font-size:13px;';

  const response = document.createElement('div');
  response.style.cssText = [
    'border:1px solid rgba(19,34,56,.28)',
    'background:#fffdf7',
    'padding:10px',
    'font-size:13px',
    'white-space:pre-wrap',
    'max-height:220px',
    'overflow:auto',
  ].join(';');

  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:11px;opacity:.72;';
  hint.textContent = 'Runs automatically on search pages and shows the first useful answer or clarification.';

  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;gap:8px;';

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.textContent = 'Open side panel';
  openButton.style.cssText = [
    'flex:1',
    'border:1px solid #132238',
    'background:#f4c61e',
    'color:#132238',
    'padding:10px 12px',
    'font-weight:700',
    'cursor:pointer',
  ].join(';');
  openButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'JUGAADGPT_OPEN_FULL_PANEL' }).catch(() => {});
  });

  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.textContent = 'Retry';
  refreshButton.style.cssText = [
    'border:1px solid #132238',
    'background:#fff7de',
    'color:#132238',
    'padding:10px 12px',
    'font-weight:700',
    'cursor:pointer',
  ].join(';');

  footer.append(openButton, refreshButton);
  body.append(queryLabel, queryText, status, response, hint, footer);
  panel.append(header, body);
  container.appendChild(panel);
  document.body.appendChild(container);

  overlayRefs = { container, queryText, status, response, refreshButton };
  return overlayRefs;
}

function updateOverlay(query, statusText, responseText) {
  const overlay = ensureOverlay();
  overlay.queryText.textContent = query;
  overlay.status.textContent = statusText;
  overlay.response.textContent = responseText;
}

async function runSearchAssist(force = false) {
  if (!isSearchPage()) return;
  const query = getSearchQuery();
  if (!query) return;

  const searchKey = `${window.location.hostname}|${query.toLowerCase()}`;
  if (!force && searchKey === lastProcessedKey) return;
  lastProcessedKey = searchKey;

  const pageContext = collectPageContext();
  const message = buildSearchMessage(query, pageContext);
  const config = await getStoredConfig();
  const lang = detectReplyLanguage(query);

  updateOverlay(query, 'Running parallel JugaadGPT query...', 'Working...');

  try {
    const result = await queryBackend(config.backendUrl || DEFAULT_BACKEND_URL, message, lang);
    const isClarification = result.startsWith('Need one detail');
    updateOverlay(query, isClarification ? 'JugaadGPT needs one missing constraint.' : 'JugaadGPT found a response.', result);
  } catch (error) {
    updateOverlay(query, 'JugaadGPT could not complete the request.', error.message || 'Unknown error');
  }

  if (overlayRefs) {
    overlayRefs.refreshButton.onclick = () => {
      runSearchAssist(true);
    };
  }
}

function watchLocationChanges() {
  setInterval(() => {
    if (window.location.href !== currentLocationHref) {
      currentLocationHref = window.location.href;
      setTimeout(() => {
        runSearchAssist();
      }, 600);
    }
  }, 800);
}

function patchHistory() {
  const { pushState, replaceState } = history;

  history.pushState = function patchedPushState(...args) {
    const result = pushState.apply(this, args);
    setTimeout(() => runSearchAssist(), 600);
    return result;
  };

  history.replaceState = function patchedReplaceState(...args) {
    const result = replaceState.apply(this, args);
    setTimeout(() => runSearchAssist(), 600);
    return result;
  };

  window.addEventListener('popstate', () => {
    setTimeout(() => runSearchAssist(), 600);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'JUGAADGPT_GET_PAGE_CONTEXT') {
    sendResponse(collectPageContext());
  }
  return false;
});

patchHistory();
watchLocationChanges();
window.addEventListener('load', () => {
  setTimeout(() => {
    runSearchAssist();
  }, 1200);
});
