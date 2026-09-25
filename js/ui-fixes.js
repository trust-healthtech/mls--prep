// FINAL CRISP UNIVERSITY - NO BLUR EVER
(function(){
  const style = document.createElement('style');
  style.innerHTML = `
    html, body { background:#ffffff !important; }
    *{
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      text-shadow: none !important;
      -webkit-font-smoothing: antialiased !important;
    }
    body.light-mode{
      background:#f8fafc !important;
    }
    body.light-mode > div, body.light-mode main, body.light-mode section{
      background:#ffffff !important;
      color:#0f172a !important;
      opacity:1 !important;
    }
    body.dark-mode{
      background:#0f172a !important;
    }
    body.dark-mode > div, body.dark-mode main, body.dark-mode section{
      background:#1e293b !important;
      color:#f8fafc !important;
      opacity:1 !important;
    }
    /* Make all text sharp */
    p, h1, h2, h3, span, div, small{ 
      opacity:1 !important; 
      filter:none !important;
    }
  `;
  document.head.appendChild(style);

  let btn = document.getElementById('themeToggle');
  if(!btn){
    btn=document.createElement('div');
    btn.id='themeToggle';
    btn.style.cssText='position:fixed;top:10px;right:10px;z-index:99999;width:44px;height:44px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer;font-size:20px;';
    document.body.appendChild(btn);
  }
  let t=localStorage.getItem('mls-theme')||'light';
  const apply=(m)=>{
    document.body.classList.remove('light-mode','dark-mode');
    document.body.classList.add(m+'-mode');
    btn.innerHTML=m==='light'?'🌙':'☀️';
    localStorage.setItem('mls-theme',m);
    t=m;
  };
  apply(t);
  btn.onclick=()=>apply(t==='light'?'dark':'light');
})();
