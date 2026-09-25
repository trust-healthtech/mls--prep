// FINAL 2 COLOURS - Actual + Soft Milk Eye Care
(function(){
  const css = `
    *{ backdrop-filter:none!important; -webkit-backdrop-filter:none!important; }

    /* ACTUAL - Your original brand */
    body.mode-actual{ background:#f1f5f9!important; }

    /* SOFT MILK - Light + Milk - Eye Care Health */
    body.mode-soft{ background:#FFFEF7!important; }
    body.mode-soft div, body.mode-soft section, body.mode-soft main{
      background:#FFFEFA!important;
      color:#2d2a26!important;
      border-color:#f3ead3!important;
      box-shadow:0 1px 6px rgba(0,0,0,0.04)!important;
    }
    body.mode-soft p, body.mode-soft span, body.mode-soft small{ color:#44403c!important; }
    body.mode-soft h1, body.mode-soft h2, body.mode-soft h3{ color:#1c1917!important; }
  `;

  let s=document.getElementById('health-eye');
  if(!s){ s=document.createElement('style'); s.id='health-eye'; document.head.appendChild(s); }
  s.innerHTML=css;

  let wrap=document.getElementById('eyeCareWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='eyeCareWrap';
    wrap.style.cssText='position:fixed;top:10px;right:10px;z-index:999999;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:4px 12px 4px 6px;box-shadow:0 4px 12px rgba(0,0,0,0.12);cursor:pointer;user-select:none;';
    wrap.innerHTML=`
      <div id="themeToggle" style="width:32px;height:32px;background:#FFFEF7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">🔵</div>
      <div style="font-size:11px;font-weight:700;color:#57534e;line-height:1;">
        <div>Eye Care</div>
        <div id="eyeLabel" style="font-size:9px;color:#a8a29e;font-weight:500;">Actual</div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  const modes=['actual','soft'];
  const icons={actual:'🔵', soft:'🥛'};
  const labels={actual:'Actual', soft:'Soft Milk'};

  let cur=localStorage.getItem('mls-2mode')||'actual';

  function apply(m){
    document.body.classList.remove('mode-actual','mode-soft');
    document.body.classList.add('mode-'+m);
    document.getElementById('themeToggle').innerHTML=icons[m];
    document.getElementById('eyeLabel').innerText=labels[m];
    localStorage.setItem('mls-2mode',m);
    cur=m;
  }

  apply(cur);
  wrap.onclick=()=>{
    let i=modes.indexOf(cur);
    i=(i+1)%modes.length;
    apply(modes[i]);
  };
})();
