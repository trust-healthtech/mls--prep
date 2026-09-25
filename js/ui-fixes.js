// === DARK/LIGHT TOGGLE + BIG BUTTON FIX ===

(function() {
  const style = document.createElement('style');
  style.innerHTML = `
  #theme-toggle-btn {
    position: fixed; top: 15px; right: 15px; z-index: 10000;
    background: #111; color: #fff; border: 2px solid #7c3aed;
    width: 45px; height: 45px; border-radius: 50%;
    font-size: 20px; cursor: pointer; display: flex;
    align-items: center; justify-content: center;
  }
  body.dark-mode { background: #0f0f0f !important; color: #e5e5e5 !important; }
  body.dark-mode .card, body.dark-mode [class*="card"], body.dark-mode section {
    background: #1f1f1f !important; color: #e5e5e5 !important; border-color: #333 !important;
  }
  /* MAKE ALL VIEW BUTTONS BIG AND SAME */
  .view-notes-btn, [class*="view"], button, a.btn {
    min-width: 160px !important; min-height: 48px !important;
    font-size: 16px !important; font-weight: 700 !important;
    padding: 12px 24px !important; border-radius: 10px !important;
  }
  `;
  document.head.appendChild(style);

  function initUI() {
    const btn = document.createElement('div');
    btn.id = 'theme-toggle-btn';
    btn.innerHTML = '🌙';
    document.body.appendChild(btn);

    if(localStorage.getItem('mls-theme') === 'dark') {
      document.body.classList.add('dark-mode');
      btn.innerHTML = '☀️';
    }

    btn.onclick = () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      btn.innerHTML = isDark ? '☀️' : '🌙';
      localStorage.setItem('mls-theme', isDark ? 'dark' : 'light');
    };

    document.querySelectorAll('button, a').forEach(el => {
      if(el.textContent.toLowerCase().includes('view')) {
        el.classList.add('view-notes-btn');
      }
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();
})();
