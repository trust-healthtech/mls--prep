// EYE CARE MILK MODE - Soft for eyes like phone reading mode
(function(){
  const css = `
    *{ backdrop-filter:none!important; -webkit-backdrop-filter:none!important; filter:none!important; }

    /* EYE CARE MODE - Warm milk paper */
    body.eye-mode{ background:#fdf6e3!important; }
    body.eye-mode div, body.eye-mode section, body.eye-mode main, body.eye-mode article{
      background:#fffaf0!important;
      color:#3c2f2f!important;
      border:1px solid #f5e6c8!important;
    }
    body.eye-mode div[style*="background"], body.eye-mode div[style*="background-color"]{
      background:#fffaf0!important;
    }
    body.eye-mode p, body.eye-mode span, body.eye-mode small, body.eye-mode li{
      color:#4a3f35!important;
    }
    body.eye-mode h1, body.eye-mode h2, body.eye-mode h3, body.eye-mode b, body.eye-mode strong{
      color:#2c241b!important;
    }
    /* Buttons warm */
    body.eye-mode button{ background:#d97706!important; color:white!important; }

    /* WHITE MODE still available */
    body.light-mode{ background:#ffffff!important; }
    body.light-mode div, body.light-mode section{ background:#ffffff!important; color:#1e293b!important; }

    /* DARK MODE */
    body.dark-mode{ background:#0f172a!important; }
    body.dark-mode div, body.dark-mode section{ background:#1e293b!important; color:#f1f5f9!important; }
  `;
  const s=document.createElement('style');
  s.innerHTML=css;
  document.head.appendChild(s);

  let btn=document.getElementById('themeToggle');
  if(!btn){
    btn=document.createElement('div');
    btn.id='themeToggle';
    btn.style.cssText='position:fixed;top:10px;right:10px;z-index:999999;width:48px;height:48px;background:#fffaf0;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);cursor:pointer;font-size:22px;border:1px solid #f5e6c8;';
    document.body.appendChild(btn);
  }

  // Cycle: Eye Care (milk) -> White -> Dark
  const modes = ['eye','light','dark'];
  const icons = {eye:'📖', light:'☀️', dark:'🌙'};
  const labels = {eye:'Eye Care', light:'White', dark:'Dark'};

  let cur = localStorage.getItem('mls-theme') || 'eye';

  function setMode(m){
    document.body.classList.remove('eye-mode','light-mode','dark-mode');
    document.body.classList.add(m+'-mode');
    btn.innerHTML = icons[m];
    btn.title = labels[m] + ' - Tap to change';
    localStorage.setItem('mls-theme', m);
    cur=m;
  }
  setMode(cur);
  btn.onclick = ()=>{
    let idx = modes.indexOf(cur);
    idx = (idx+1) % modes.length;
    setMode(modes[idx]);
  };
})();
