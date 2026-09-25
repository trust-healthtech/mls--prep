(function(){
var st=document.createElement('style');
st.innerHTML='#mls-popup{position:fixed;right:12px;bottom:80px;background:#7c3aed;color:#fff;padding:12px 16px;border-radius:12px;z-index:99999;display:none;max-width:260px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.3)}#mls-popup.show{display:block}#mls-popup button{background:#fff;color:#7c3aed;border:none;padding:7px 12px;border-radius:6px;font-weight:700;width:100%;margin-top:8px;font-size:12px}';
document.head.appendChild(st);
var p=document.createElement('div');p.id='mls-popup';p.innerHTML='📚 Love this note?<br><small>Keep reading, you got this! 💪</small><button onclick="this.parentElement.style.display=\'none\'">Continue Reading →</button>';document.body.appendChild(p);
var timer=null;
document.addEventListener('click',function(e){
 var txt=(e.target.innerText||'').toLowerCase();
 if(txt.includes('view')){clearTimeout(timer);timer=setTimeout(function(){p.style.display='block';p.classList.add('show');setTimeout(function(){p.style.display='none';},25000);},42000);}
});
})();
