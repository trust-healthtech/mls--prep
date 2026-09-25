// 3-COLOUR TOGGLE: Actual Blue -> Soft White -> Light Yellow
(function(){
  const css = `
    *{ backdrop-filter:none!important; -webkit-backdrop-filter:none!important; }

    /* 1. ACTUAL COLOUR - Your original platform */
    body.mode-actual{ background:#f1f5f9!important; }
    body.mode-actual header, body.mode-actual div[style*="blue"]{
      /* keep your original blue - don't override */
    }

    /* 2. SOFT WHITE - clean modern white */
    body.mode-soft{ background:#ffffff!important; }
    body.mode-soft div, body.mode-soft section, body.mode-soft main{
      background:#ffffff!important;
      color:#0f172a!important;
      border-color:#e2e8f0!important;
      box-shadow:0 1px 3px rgba(0,0,0,0.05)!important;
    }
    body.mode-soft p, body.mode-soft span, body.mode-soft small{ color:#334155!important; }

    /* 3. LIGHT YELLOW - eye care milk */
    body.mode-yellow{ background:#FFFBEB!important; }
    body.mode-yellow div, body.mode-yellow section, body.mode-yellow main{
      background:#FFFEF7!important;
      color:#44403c!important;
      border-color:#fde68a!important;
      box-shadow:0 1px 4px rgba(217,119,6,0.08)!important;
    }
    body.mode-yellow p, body.mode-yellow span, body.mode-yellow small{ color:#57534e!important; }
    body.mode-yellow h1, body.mode-yellow h2, body.mode-yellow h3{ color:#292524!important; }
  `;

  let style=document.getElementById('three-mode');
  if(!style){ style=document.createElement('style'); style.id='three-mode'; document.head.appendChild(style); }
  style.innerHTML=css;

  // Toggle button
  let btn=document.getElementById('themeToggle');
  if(!btn){
    btn=document.createElement('div');
    btn.id='themeToggle';
    btn.style.cssText='position:fixed;top:12px;right:12px;z-index:999999;width:46px;height:46px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;font-size:22px;border:1px solid #e2e8f0;';
    document.body.appendChild(btn);
  }

  const modes = ['actual','soft','yellow'];
  const icons = {actual:'🔵', soft:'⚪', yellow:'📖'};
  const names = {actual:'Actual', soft:'Soft White', yellow:'Light Yellow'};

  let cur = localStorage.getItem('mls-3mode') || 'actual';

  function apply(m){
    document.body.classList.remove('mode-actual','mode-soft','mode-yellow');
    document.body.classList.add('mode-'+m);
    btn.innerHTML = icons[m];
    btn.title = names[m] + ' - Tap to switch';
    localStorage.setItem('mls-3mode', m);
    cur=m;
  }

  apply(cur);

  btn.onclick = ()=>{
    let i = modes.indexOf(cur);
    i = (i+1) % modes.length;
    apply(modes[i]);
  };
})();
