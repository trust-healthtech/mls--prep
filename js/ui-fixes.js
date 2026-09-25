// MODERN EYE-CARE - Kindle / Medium style - No blue, No dark
(function(){
  const css = `
    *{ backdrop-filter:none!important; -webkit-backdrop-filter:none!important; filter:none!important; }

    body, html{
      background:#FFFBEB!important; /* warm milk - eye perfect */
    }

    /* REMOVE BLUE HEADER COMPLETELY - make it warm paper */
    div[style*="background: blue"], div[style*="background:#"], header, 
    div[style*="background: rgb(0, 0, 255)"], div[style*="#0000FF"],
    [style*="linear-gradient"]{
      background:#FFFBEB!important;
      background-image:none!important;
    }

    /* All cards - soft paper white */
    div, section, main, article, aside{
      background:#FFFEF7!important;
      background-color:#FFFEF7!important;
      color:#3C3A36!important;
      border-color:#F3E8C9!important;
      box-shadow: 0 1px 4px rgba(60,58,54,0.06)!important;
    }

    /* Text - warm dark brown, not pure black - best for eyes */
    p, span, small, li, div{
      color:#44403C!important;
      font-weight:400!important;
      line-height:1.6!important;
    }
    h1, h2, h3, h4, b, strong{
      color:#292524!important;
    }

    /* Header texts - remove blue glow */
    h1{ color:#1C1917!important; text-shadow:none!important; }

    /* TIP boxes - light cream */
    div[style*="TIP"], small{
      background:#FEF3C7!important;
      color:#78350F!important;
    }

    /* Buttons - warm amber, not blue/red */
    button, .btn, [style*="Start"]{
      background:#D97706!important;
      color:#FFFBEB!important;
      border:none!important;
      border-radius:12px!important;
    }

    /* Hide toggle - we don't need dark/blue anymore */
    #themeToggle{ display:none!important; }
  `;

  let s=document.getElementById('eye-final');
  if(!s){ s=document.createElement('style'); s.id='eye-final'; document.head.appendChild(s); }
  s.innerHTML=css;

  // Force light mode only, delete dark
  document.body.classList.remove('dark-mode','light-mode');
  document.body.classList.add('eye-mode');
  localStorage.setItem('mls-theme','eye');

  console.log("Modern eye-care activated - No blue, No dark");
})(); 
