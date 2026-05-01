
(function(){
'use strict';
function toast(msg,ok){const b=document.createElement('div');b.textContent=msg;b.style.cssText='position:fixed;z-index:999999;bottom:24px;left:50%;transform:translateX(-50%);background:'+(ok===false?'#b83232':'#0f7b55')+';color:#fff;padding:12px 20px;border-radius:999px;font-family:Cairo,Tahoma,sans-serif;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.22);direction:rtl';document.body.appendChild(b);setTimeout(()=>b.remove(),2800)}
window.alfalahToast=toast;
function relabel(){document.querySelectorAll('button,.btn,a').forEach(el=>{const t=(el.textContent||''); if(t.includes('حفظ مؤقت')) el.textContent=t.replace('حفظ مؤقت','حفظ على الجهاز');});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',relabel);else relabel();
})();
