// University Theme + Dark/Light Toggle
(function(){
  // 1. Create toggle button (top right)
  const toggleBtn = document.createElement('div');
  toggleBtn.id = 'themeToggle';
  toggleBtn.innerHTML = '🌙';
  toggleBtn.style.cssText = `
    position:fixed; top:12px; right:12px; z-index:9999;
    width:42px; height:42px; background:white;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 12px rgba(0,0,0,0.15); cursor:pointer; font-size:20px;
    border:1px solid #e2e8f0;
  `;
  document.body.appendChild(toggleBtn);

  const lightCSS = `
    body.light-mode{ background:#f1f5f9 !important; color:#0f172a !important; }
    .light-mode div[style*="black"]{ background:#ffffff !important; color:#0f172a !important; }
    .light-mode .card, .light-mode section, .light-mode div[style*="border-radius"]{
      background:#ffffff !important; border:1px solid #e2e8f0 !important;
      box-shadow:0 4px 12px rgba(15,23,42,0.06) !important;
      backdrop-filter:none !important; filter:none !important; color:#0f172a !important;
    }
    .light-mode *{ backdrop-filter:none !important; -webkit-backdrop-filter:none !important; text-shadow:none !important; }
  `;
  const darkCSS = `
    body.dark-mode{ background:#0f172a !important; color:#f1f5f9 !important; }
    .dark-mode .card, .dark-mode section, .dark-mode div[style*="border-radius"]{
      background:#1e293b !important; border:1px solid #334155 !important; color:#f1f5f9 !important;
    }
  `;

  const style = document.createElement('style');
  style.innerHTML = lightCSS + darkCSS + `
    body{ transition: all 0.3s ease; }
  `;
  document.head.appendChild(style);

  // 2. Load saved theme
  let theme = localStorage.getItem('mls-theme') || 'light';
  applyTheme(theme);

  function applyTheme(t){
    document.body.classList.remove('light-mode','dark-mode');
    document.body.classList.add(t+'-mode');
    toggleBtn.innerHTML = t === 'light' ? '🌙' : '☀️';
    toggleBtn.style.background = t === 'light' ? 'white' : '#1e293b';
    localStorage.setItem('mls-theme', t);
  }

  // 3. Click to toggle
  toggleBtn.onclick = () => {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
  };
})();
