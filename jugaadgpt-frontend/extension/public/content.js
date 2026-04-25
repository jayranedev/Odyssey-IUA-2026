console.log('JugaadGPT extension loaded in page.');

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'JUGAADGPT_GET_PAGE_CONTEXT') {
    sendResponse(collectPageContext());
  }
  return false;
});
