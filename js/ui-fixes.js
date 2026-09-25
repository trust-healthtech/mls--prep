// HEALTH EYE-CARE 3 MODES - For MLS students with eye strain
(function(){
  const css = `
    *{ backdrop-filter:none!important; -webkit-backdrop-filter:none!important; }

    /* MODE 1: ACTUAL - Your original */
    body.mode-actual{ background:#f1f5f9!important; }

    /* MODE 2: SOFT WHITE - Health white, warm 4000K */
    body.mode-soft{ background:#FFFEF7!important; }
    body.mode-soft div, body.mode-soft section, body.mode-soft main{
      background:#FFFFFF!important;
      color:#1e293b!important;
      border-color:#e8e6df!important;
    }

    /* MODE 3: WARM PAPER - Clinical eye-care, best for eye problems */
    body.mode-yellow{ background:#FDF6E3!important; }
    body.mode-yellow div, body.mode-yellow section, body.mode-yellow main{
      background:#FFFBEB!important;
      color:#3a3226!important;
      border-color:#f5e6b8!important;
    }
    body.mode-yellow p, body.mode-yellow span{ color:#4a4235!important; }
    body.mode-yellow h1, body.mode-yellow h2, body.mode-yellow h3{ color:#2a2218!important; }
  `;
  let s=document.getElementById('health-eye');
  if(!s){ s=document.createElement('style'); s.id='health-eye'; document.head.appendChild(s); }
  s.innerHTML=css;

  // Create toggle WITH LABEL "Eye Care"
  let wrap=document.getElementById('eyeCareWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='eyeCareWrap';
    wrap.style.cssText='position:fixed;top:10px;right:10px;z-index:999999;display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:4px 10px 4px 6px;box-shadow:0 4px 12px rgba(0,0,0,0.12);cursor:pointer;';
    wrap.innerHTML=`
      <div id="themeToggle" style="width:32px;height:32px;background:#FFFBEB;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">📖</div>
      <div style="font-size:11px;font-weight:600;color:#57534e;line-height:1;">
        <div>Eye Care</div>
        <div id="eyeLabel" style="font-size:9px;color:#a8a29e;">Actual</div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  const modes=['actual','soft','yellow'];
  const icons={actual:'🔵', soft:'⚪', yellow:'📖'};
  const labels={actual:'Actual', soft:'Soft White', yellow:'Warm Paper'};

  let cur=localStorage.getItem('mls-health-mode')||'actual';

  function apply(m){
    document.body.classList.remove('mode-actual','mode-soft','mode-yellow');
    document.body.classList.add('mode-'+m);
    document.getElementById('themeToggle').innerHTML=icons[m];
    document.getElementById('eyeLabel').innerText=labels[m];
    localStorage.setItem('mls-health-mode',m);
    cur=m;
  }

  apply(cur);
  wrap.onclick=()=>{
    let i=modes.indexOf(cur);
    i=(i+1)%modes.length;
    apply(modes[i]);
  };
})();
