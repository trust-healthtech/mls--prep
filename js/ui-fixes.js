(function(){
var css='#theme-toggle{position:fixed;top:10px;right:10px;z-index:10000;width:34px;height:34px;background:#fff;border:1px solid #ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer}button{padding:8px 14px!important;font-size:13px!important;border-radius:8px!important}body.dark-mode{background:#0f0f14!important;color:#eee!important}body.dark-mode .card{background:#1c1c26!important}';
var s=document.createElement('style');s.innerHTML=css;document.head.appendChild(s);
var b=document.createElement('div');b.id='theme-toggle';b.innerHTML='🌙';document.body.appendChild(b);
b.onclick=()=>{document.body.classList.toggle('dark-mode');b.innerHTML=document.body.classList.contains('dark-mode')?'☀️':'🌙'};
})();
