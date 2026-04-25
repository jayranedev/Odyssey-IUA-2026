// Content script for rendering a floating pill (placeholder)
console.log('JugaadGPT extension loaded in page.');

function injectFloatingPill() {
  const existing = document.getElementById('jugaadgpt-pill');
  if (existing) return;

  const pill = document.createElement('div');
  pill.id = 'jugaadgpt-pill';
  pill.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: #0E1B2D;
    color: #F4C61E;
    padding: 10px 16px;
    border-radius: 99px;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    border: 1.5px solid #F4C61E;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  pill.innerHTML = `<span>JugaadGPT</span><span>+</span>`;
  
  pill.addEventListener('click', () => {
    alert('JugaadGPT Workspace opened!');
  });

  document.body.appendChild(pill);
}

// injectFloatingPill();
