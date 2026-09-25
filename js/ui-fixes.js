// FINAL FIX - Perfect color matching Light/Dark
(function(){
  // Toggle button
  let btn = document.getElementById('themeToggle');
  if(!btn){
    btn = document.createElement('div');
    btn.id='themeToggle';
    btn.style.cssText=`position:fixed;top:12px;right:12px;z-index:9999;width:44px;height:44px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);cursor:pointer;font-size:22px;border:1px solid #e2e8f0;`;
    document.body.appendChild(btn);
  }

  const css = `
    /* LIGHT MODE - UNIVERSITY CLEAN */
    body.light-mode{ background:#f8fafc !important; }
    body.light-mode div, body.light-mode section, body.light-mode article{
      background:#ffffff !important;
      color:#0f172a !important;
      border-color:#e2e8f0 !important;
    }
    body.light-mode p, body.light-mode span, body.light-mode div, body.light-mode small, body.light-mode li{
      color:#334155 !important;
    }
    body.light-mode h1, body.light-mode h2, body.light-mode h3, body.light-mode b, body.light-mode strong{
      color:#0f172a !important;
    }
    /* TIP text must be visible */
    body.light-mode [class*="TIP"], body.light-mode small{
      color:#64748b !important;
    }

    /* DARK MODE - FIXED CONTRAST */
    body.dark-mode{ background:#0f172a !important; }
    body.dark-mode div, body.dark-mode section, body.dark-mode article{
      background:#1e293b !important;
      color:#f1f5f9 !important;
      border-color:#334155 !important;
    }
    body.dark-mode p, body.dark-mode span, body.dark-mode div, body.dark-mode small, body.dark-mode li, body.dark-mode h1, body.dark-mode h2, body.dark-mode h3{
      color:#e2e8f0 !important;
    }
    body.dark-mode b, body.dark-mode strong{ color:#ffffff !important; }

    /* Remove blur */
    *{ backdrop-filter:none !important; -webkit-backdrop-filter:none !important; filter:none !important; }

    /* Buttons */
    body.light-mode button{ background:#2563eb !important; color:white !important; }
    body.dark-mode button{ background:#3b82f6 !important; color:white !important; }
  `;
  
  let st = document.getElementById('theme-fix');
  if(!st){ st=document.createElement('style'); st.id='theme-fix'; document.head.appendChild(st); }
  st.innerHTML=css;

  let theme = localStorage.getItem('mls-theme') || 'light';
  function apply(t){
    document.body.classList.remove('light-mode','dark-mode');
    document.body.classList.add(t+'-mode');
    btn.innerHTML = t==='light' ? '🌙' : '☀️';
    btn.style.background = t==='light' ? '#fff' : '#1e293b';
    localStorage.setItem('mls-theme', t);
    theme=t;
  }
  apply(theme);
  btn.onclick = ()=> apply(theme==='light'?'dark':'light');
})();
