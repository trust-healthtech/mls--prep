(function(){
var st=document.createElement('style');
st.innerHTML='#mls-popup{position:fixed;right:12px;bottom:80px;background:linear-gradient(135deg,#0b1f6b,#2563eb);color:#fff;padding:12px 16px;border-radius:12px;z-index:99999;display:none;max-width:260px;font-size:13px;box-shadow:0 12px 30px rgba(37,99,235,0.32),0 0 12px rgba(96,165,250,0.24);border:1px solid rgba(255,255,255,0.15);}#mls-popup.show{display:block;}#mls-popup button{margin-top:8px;background:#fff;color:#0b1f6b;border:none;border-radius:999px;padding:6px 10px;font-weight:700;cursor:pointer;box-shadow:0 4px 10px rgba(15,23,42,0.12);}';
document.head.appendChild(st);
var p=document.createElement('div');p.id='mls-popup';p.innerHTML='📚 Love this note?<br><small>Keep reading, you got this! 💪</small><button onclick="this.parentElement.style.display=\'none\'">Close</button>';
document.body.appendChild(p);
var timer=null;
document.addEventListener('click',function(e){
 var txt=(e.target.innerText||'').toLowerCase();
 if(txt.includes('view')){clearTimeout(timer);timer=setTimeout(function(){p.style.display='block';p.classList.add('show');setTimeout(function(){p.style.display='none';},25000);},42000);}
});
})();
