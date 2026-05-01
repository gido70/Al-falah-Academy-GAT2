
/* Alfalah Central Database Sync Layer
   يحول أزرار الحفظ إلى حفظ مركزي في Supabase مع إبقاء التصدير والاستيراد كما هو.
*/
(function(){
  'use strict';
  const URL = window.ALFALAH_SUPABASE_URL || 'https://nmbbahzzogspuuvpsxud.supabase.co';
  const KEY = window.ALFALAH_SUPABASE_KEY || 'sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM';
  let sb = null;
  function client(){
    if(sb) return sb;
    if(window.alfalahSupabase){ sb = window.alfalahSupabase; return sb; }
    if(window.supabase){ sb = window.supabase.createClient(URL, KEY); window.alfalahSupabase = sb; return sb; }
    return null;
  }
  function toast(msg, ok=true){
    if(typeof window.toast === 'function'){ try{ window.toast(msg); return; }catch(e){} }
    const b=document.createElement('div');
    b.textContent=msg;
    b.style.cssText='position:fixed;z-index:999999;bottom:22px;left:50%;transform:translateX(-50%);background:'+(ok?'#0f7b55':'#b83232')+';color:#fff;padding:12px 22px;border-radius:999px;font-family:Cairo,Tahoma,sans-serif;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.22);direction:rtl';
    document.body.appendChild(b); setTimeout(()=>b.remove(),3200);
  }
  function allFormData(){
    const o={};
    document.querySelectorAll('input,select,textarea').forEach((el,i)=>{
      if(el.type==='file') return;
      const k=el.id||el.name||('field_'+i);
      o[k]=el.type==='checkbox'?el.checked:el.value;
    });
    if(typeof window.getFormData==='function'){ try{ Object.assign(o, window.getFormData()); }catch(e){} }
    o.page=location.pathname; o.saved_at=new Date().toISOString();
    return o;
  }
  function schoolInfo(d){
    const schools=[{id:1,code:'dan',name:'فرع الدانة'},{id:2,code:'mzd',name:'فرع محمد بن زايد'},{id:3,code:'bny',name:'فرع بني ياس'},{id:4,code:'khb',name:'فرع الخبيصي'},{id:5,code:'jmi',name:'فرع الجيمي'},{id:6,code:'shj',name:'مدرسة الفلاح الخاصة'}];
    let sid=d.esch||d.school||d.school_id||d['f-sname']||'';
    let scode=d.school_code||window.SCHOOL||'';
    let f=schools.find(s=>String(s.id)===String(sid))||schools.find(s=>s.code===scode);
    if(!f&&typeof sid==='string') f=schools.find(s=>sid.includes(s.name)||s.name.includes(sid));
    return f||{id:null,code:scode||null,name:String(sid||'')};
  }
  async function saveScheduleDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=allFormData();
    const week=parseInt(String(d.wnum||d.week_number||d.week||'1').replace(/[^0-9]/g,''),10)||1;
    const row={
      week_number:week,
      week_title:d.wtitle||d.week_title||('الأسبوع '+week),
      work_date:d.wstart||d.from_date||d.work_date||null,
      day_name:'أسبوعي',
      check_in:d.ain0||null,
      check_out:d.aout4||d.aout0||null,
      task_type:d.atype0||null,
      task_details:d.dtasks0||null,
      tasks:(d._pills||[]).join?(d._pills||[]).join('، '):String(d._pills||''),
      notes:d.needDetails||d.notes||d.anote0||'',
      full_data:d,
      updated_at:new Date().toISOString()
    };
    const r=await c.from('daily_work_logs').upsert(row,{onConflict:'week_number'}).select();
    if(r.error) throw r.error;
    try{localStorage.setItem('falah_week_'+week,JSON.stringify(d));}catch(e){}
    toast('✅ تم حفظ الأسبوع في قاعدة البيانات'); return true;
  }
  async function saveEvaluationDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=allFormData(); const s=schoolInfo(d);
    const nums=Object.keys(d).filter(k=>/^r_|^rp-|^f-/.test(k)).map(k=>Number(d[k])).filter(n=>!isNaN(n)&&n>0);
    const total=nums.length?Math.round(nums.reduce((a,b)=>a+b,0)):null;
    const row={school_id:s.id,school_code:s.code,visit_date:d['f-date']||d.visit_date||null,librarian_name:d['f-lib']||d.librarian_name||'',total_score:total,final_level:d.final_level||d.level||'',strengths:d.strengths||d['f-strengths']||'',weaknesses:d.weaknesses||d['f-weaknesses']||'',recommendations:d.recommendations||d['f-recommendations']||d.frec||'',full_data:d,updated_at:new Date().toISOString()};
    const r=await c.from('library_evaluations').upsert(row,{onConflict:'school_id'}).select();
    if(r.error) throw r.error;
    toast('✅ تم حفظ التقييم في قاعدة البيانات'); return true;
  }
  async function saveAIToDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=allFormData(); const s=schoolInfo(d);
    const row={school_id:s.id,review_text:d.reportText||d.review_text||d.text||'',score:Number(d.s1||0)+Number(d.s2||0)+Number(d.s3||0),ai_score:Number(d.s1||0)+Number(d.s2||0)+Number(d.s3||0),ai_summary:(document.getElementById('aiResult')||{}).innerText||'',full_data:d};
    const r=await c.from('ai_reviews').insert(row).select();
    if(r.error) throw r.error;
    toast('✅ تم حفظ تقييم AI في قاعدة البيانات'); return true;
  }
  async function uploadSchoolFilesDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const input=document.getElementById('files')||document.querySelector('input[type=file]');
    if(!input||!input.files||!input.files.length){toast('اختر ملفات أولاً',false);return false;}
    const schools={dan:1,mzd:2,bny:3,khb:4,jmi:5,shj:6};
    const code=window.SCHOOL||(location.pathname.match(/schools\/([^\/]+)/)||[])[1]||'';
    const cat=window.CATEGORY||(location.pathname.match(/\/(photos|models|certificates)\//)||[])[1]||'files';
    const bucket=cat==='photos'?'library-images':(cat==='certificates'?'specialist-certificates':'library-documents');
    let done=0;
    for(const f of Array.from(input.files)){
      const safe=f.name.replace(/[^\w\.\-\u0600-\u06FF]+/g,'_');
      const path=`${code}/${cat}/${Date.now()}_${safe}`;
      const up=await c.storage.from(bucket).upload(path,f,{upsert:true,contentType:f.type||'application/octet-stream'});
      if(up.error) throw up.error;
      const url=c.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      const ins=await c.from('school_files').insert({school_id:schools[code]||null,school_code:code,file_category:cat,file_name:f.name,file_path:path,file_url:url,file_type:f.type,file_size:f.size}).select();
      if(ins.error) throw ins.error;
      done++;
    }
    toast('✅ تم رفع '+done+' ملف/ملفات إلى قاعدة البيانات'); return true;
  }
  async function saveManagementDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=allFormData();
    const row={report_week:d.wnum||d.week_number||'',report_date:new Date().toISOString().slice(0,10),summary:(document.querySelector('#aiOutput')||{}).textContent||(document.querySelector('#mgrLetterBody')||{}).textContent||'تقرير إداري',achievements:(document.querySelector('#mgrAch')||{}).textContent||'',challenges:(document.querySelector('#mgrChal')||{}).textContent||'',next_steps:(document.querySelector('#mgrNext')||{}).textContent||'',full_data:d,updated_at:new Date().toISOString()};
    const r=await c.from('management_reports').insert(row).select();
    if(r.error) throw r.error;
    toast('✅ تم حفظ تقرير الإدارة في قاعدة البيانات'); return true;
  }
  function wrap(name,fn){
    const old=window[name];
    if(typeof old==='function'&&!old.__dbWrapped){
      const nw=async function(){try{old.apply(this,arguments);}catch(e){console.warn(e)}try{await fn();}catch(e){console.error(e);toast('❌ فشل الحفظ في القاعدة: '+(e.message||e),false);}};
      nw.__dbWrapped=true; window[name]=nw;
    }
  }
  function setup(){
    document.querySelectorAll('button,.btn,a').forEach(el=>{if((el.textContent||'').includes('حفظ مؤقت'))el.textContent=el.textContent.replace('حفظ مؤقت','حفظ في القاعدة');});
    if(location.pathname.includes('/schedule/')){
      wrap('saveDraft',saveScheduleDB);
      const b=document.getElementById('btn-save');
      if(b) b.addEventListener('click',async ev=>{ev.preventDefault();try{await saveScheduleDB()}catch(e){toast('❌ '+e.message,false)}},true);
    }
    if(location.pathname.includes('/evaluation/')){wrap('saveEval',saveEvaluationDB);wrap('saveAll',saveEvaluationDB);}
    if(location.pathname.includes('/ai-evaluation/'))wrap('saveAI',saveAIToDB);
    if(location.pathname.includes('/management/')){
      wrap('saveReport',saveManagementDB);
      document.querySelectorAll('button').forEach(b=>{if((b.textContent||'').includes('حفظ'))b.addEventListener('click',async()=>{try{await saveManagementDB()}catch(e){}},true);});
    }
    if(location.pathname.includes('/schools/'))wrap('uploadFiles',uploadSchoolFilesDB);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
  window.AlfalahDBSync={saveScheduleDB,saveEvaluationDB,saveAIToDB,uploadSchoolFilesDB,saveManagementDB};
})();
