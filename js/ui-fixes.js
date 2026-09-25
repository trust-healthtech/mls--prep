// CLEAN LIGHT MODE - Eliminate dark crazy layout
(function(){
  const style = document.createElement('style');
  style.innerHTML = `
    body { background: #f8fafc !important; color: #1e293b !important; }
    /* Remove all dark/black cards */
    div[style*="background: black"], div[style*="background:#000"], div[style*="background: #000"],
    .study-hub-dashboard, #quizShell, #evaluationBlock {
      background: #ffffff !important;
      color: #1e293b !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
      border-radius: 16px !important;
      filter: none !important;
      backdrop-filter: none !important;
    }
    /* All inner cards white */
    div {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    /* Buttons stay clean */
    button { border-radius: 12px !important; }
    /* Remove blur */
    * { filter: none !important; }
  `;
  document.head.appendChild(style);
  console.log("Light clean mode activated");
})();
