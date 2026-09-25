// FINAL 2 COLOURS - Actual + Warm Paper Eye Care
(function(){
  const css = `
    *{ backdrop-filter:none!important; -webkit-backdrop-filter:none!important; }

    /* ACTUAL - Your original brand */
    body.mode-actual{ background:#f1f5f9!important; }

    /* WARM PAPER - True eye-care for eye problems - #FFF8DC */
    body.mode-warm{ background:#FFF8DC!important; }
    body.mode-warm div, body.mode-warm section, body.mode-warm main{
      background:#FFFBEB!important;
      color:#3e3524!important;
      border-color:#f5e6a8!important;
      box-shadow:0 1px 6px rgba(120,90,20,0.06)!important;
    }
    body.mode-warm p, body.mode-warm span, body.mode-warm small, body.mode-warm li{
      color:#57534e!important;
    }
    body.mode-warm h1, body.mode-warm h2, body.mode-warm h3, body.mode-warm b{
      color:#2a2218!important;
    }
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
      <div id="themeToggle" style="width:32px;height:32px;background:#FFF8DC;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">🔵</div>
      <div style="font-size:11px;font-weight:700;color:#57534e;line-height:1;">
        <div>Eye Care</div>
        <div id="eyeLabel" style="font-size:9px;color:#a8a29e;font-weight:500;">Actual</div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  const modes=['actual','warm'];
  const icons={actual:'🔵', warm:'📖'};
  const labels={actual:'Actual', warm:'Warm Paper'};

  let cur=localStorage.getItem('mls-final-mode')||'actual';

  function apply(m){
    document.body.classList.remove('mode-actual','mode-warm');
    document.body.classList.add('mode-'+m);
    document.getElementById('themeToggle').innerHTML=icons[m];
    document.getElementById('eyeLabel').innerText=labels[m];
    localStorage.setItem('mls-final-mode',m);
    cur=m;
  }

  apply(cur);
  wrap.onclick=()=>{
    let i=modes.indexOf(cur);
    i=(i+1)%modes.length;
    apply(modes[i]);
  };
})();
