// === PURPLE RHS DOWNLOAD POPUP + SELAR PROTECTION ===
// Shows 3x: 90s, 220s, 400s - For 25s, 25s, 30s

(function() {
  const style = document.createElement('style');
  style.innerHTML = `
  #mls-download-popup {
    position: fixed; right: 20px; bottom: 100px;
    background: #7c3aed; color: white;
    padding: 16px 20px; border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 9999; display: none; max-width: 320px;
    font-family: sans-serif; animation: slideIn 0.4s ease;
  }
  #mls-download-popup.show { display: block; }
  #mls-download-popup button {
    background: white; color: #7c3aed; border: none;
    padding: 8px 16px; border-radius: 8px;
    font-weight: bold; margin-top: 10px; cursor: pointer; width: 100%;
  }
  #mls-download-popup.close-btn {
    position: absolute; top: 5px; right: 10px;
    background: transparent; color: white; width: auto;
    font-size: 18px; padding: 0;
  }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  #mls-permanent-dl {
    position: fixed; right: 20px; bottom: 20px;
    background: #7c3aed; color: white; padding: 12px 18px;
    border-radius: 50px; z-index: 9998; display: none;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2); cursor: pointer;
    font-weight: bold; font-family: sans-serif;
  }
  `;
  document.head.appendChild(style);

  const popupHTML = `
    <div id="mls-download-popup">
      <button class="close-btn" onclick="this.parentElement.classList.remove('show')">×</button>
      <div style="font-weight:bold; margin-bottom:6px;">📚 Love these notes?</div>
      <div style="font-size:14px; line-height:1.4;">Get lifetime download + updates to keep forever.</div>
      <button id="mls-selar-btn">Get on Selar →</button>
    </div>
    <div id="mls-permanent-dl">⬇️ Download Full Notes</div>
  `;

  function initPopup() {
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    const popup = document.getElementById('mls-download-popup');
    const perm = document.getElementById('mls-permanent-dl');
    const selarBtn = document.getElementById('mls-selar-btn');

    // Use first Selar link as default, you can change later
    const defaultSelar = NOTES_LINKS? Object.values(NOTES_LINKS)[0].selarUrl : "#";

    selarBtn.onclick = perm.onclick = () => {
      if(defaultSelar && defaultSelar!== "#") window.open(defaultSelar, '_blank');
      else alert('Selar link coming soon! Check back Oct 1');
    };

    const timings = typeof POPUP_TIMING!== 'undefined'? POPUP_TIMING : {showAfter:[90000,220000,400000], showFor:[25000,25000,30000]};

    timings.showAfter.forEach((delay, i) => {
      setTimeout(() => {
        popup.classList.add('show');
        setTimeout(() => {
          popup.classList.remove('show');
          if(i === timings.showAfter.length -1) perm.style.display = 'block';
        }, timings.showFor[i]);
      }, delay);
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPopup);
  else initPopup();
})();
