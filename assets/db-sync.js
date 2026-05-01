/* Alfalah Central Sync v20260502
   طبقة حفظ مركزية آمنة لكل صفحات المشروع مع الحفاظ على التصميم والوظائف القديمة.
*/
(function(){
  'use strict';
  const URL = window.ALFALAH_SUPABASE_URL || 'https://nmbbahzzogspuuvpsxud.supabase.co';
  const KEY = window.ALFALAH_SUPABASE_KEY || 'sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM';
  const SCHOOLS=[{id:1,code:'dan',name:'فرع الدانة'},{id:2,code:'mzd',name:'فرع محمد بن زايد'},{id:3,code:'bny',name:'فرع بني ياس'},{id:4,code:'khb',name:'فرع الخبيصي'},{id:5,code:'jmi',name:'فرع الجيمي'},{id:6,code:'shj',name:'مدرسة الفلاح الخاصة'}];
  let sb=null;
  function client(){
    if(sb) return sb;
    if(window.alfalahSupabase){ sb=window.alfalahSupabase; return sb; }
    if(window.supabase){ sb=window.supabase.createClient(URL,KEY); window.alfalahSupabase=sb; return sb; }
    return null;
  }
  function toast(msg, ok=true){
    const b=document.createElement('div'); b.textContent=msg;
    b.style.cssText='position:fixed;z-index:999999;bottom:20px;left:50%;transform:translateX(-50%);max-width:92%;background:'+(ok?'#0f7b55':'#b83232')+';color:#fff;padding:12px 20px;border-radius:999px;font-family:Cairo,Tahoma,sans-serif;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.22);direction:rtl;text-align:center';
    document.body.appendChild(b); setTimeout(()=>b.remove(),3600);
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function formData(){
    const o={};
    document.querySelectorAll('input,select,textarea').forEach((el,i)=>{ if(el.type==='file') return; const k=el.id||el.name||('field_'+i); o[k]=el.type==='checkbox'?el.checked:el.value; });
    if(typeof window.getFormData==='function'){ try{Object.assign(o,window.getFormData());}catch(e){} }
    o.page=location.pathname; o.saved_at=new Date().toISOString();
    return o;
  }
  function schoolInfo(d={}){
    const path=(location.pathname.match(/schools\/([^\/]+)/)||[])[1]||'';
    let sid=d.esch||d.school||d.school_id||d['f-sname']||d.sname||'';
    let scode=d.school_code||window.SCHOOL||path||'';
    let f=SCHOOLS.find(s=>String(s.id)===String(sid))||SCHOOLS.find(s=>s.code===scode)||SCHOOLS.find(s=>String(sid).includes(s.name)||s.name.includes(String(sid)));
    return f||{id:null,code:scode||null,name:String(sid||'')};
  }
  async function saveScheduleDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=formData();
    const week=parseInt(String(d.wnum||d.week_number||d.week||'1').replace(/[^0-9]/g,''),10)||1;
    const row={week_number:week,week_title:d.wtitle||d.week_title||('الأسبوع '+week),work_date:d.wstart||d.from_date||d.work_date||null,day_name:'أسبوعي',check_in:d.ain0||null,check_out:d.aout4||d.aout0||null,task_type:d.atype0||null,task_details:d.dtasks0||null,tasks:Array.isArray(d._pills)?d._pills.join('، '):String(d._pills||''),notes:d.needDetails||d.notes||d.anote0||'',full_data:d,updated_at:new Date().toISOString()};
    const r=await c.from('daily_work_logs').upsert(row,{onConflict:'week_number'}).select(); if(r.error) throw r.error;
    try{localStorage.setItem('falah_week_'+week,JSON.stringify(d));}catch(e){}
    toast('✅ تم حفظ الأسبوع في قاعدة البيانات'); return true;
  }
  async function saveEvaluationDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=formData(), s=schoolInfo(d);
    const nums=Object.keys(d).filter(k=>/^r_|^rp-|^f-/.test(k)).map(k=>Number(d[k])).filter(n=>!isNaN(n)&&n>0);
    const total=nums.length?Math.round(nums.reduce((a,b)=>a+b,0)):null;
    const row={school_id:s.id,school_code:s.code,visit_date:d['f-date']||d.date||d.visit_date||null,librarian_name:d['f-lib']||d.lib||d.librarian_name||'',total_score:total,final_level:d.final_level||d.level||'',strengths:d.strengths||d['f-strengths']||'',weaknesses:d.weaknesses||d['f-weaknesses']||'',recommendations:d.recommendations||d['f-recommendations']||d.frec||'',full_data:d,updated_at:new Date().toISOString()};
    const r=await c.from('library_evaluations').upsert(row,{onConflict:'school_id'}).select(); if(r.error) throw r.error;
    toast('✅ تم حفظ التقييم في قاعدة البيانات'); return true;
  }
  async function saveManagementDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=formData();
    const row={report_week:d.wnum||d.week_number||'',report_date:new Date().toISOString().slice(0,10),summary:(document.querySelector('#aiOutput')||{}).textContent||(document.querySelector('#mgrLetterBody')||{}).textContent||'تقرير إداري',achievements:(document.querySelector('#mgrAch')||{}).value||(document.querySelector('#mgrAch')||{}).textContent||'',challenges:(document.querySelector('#mgrChal')||{}).value||(document.querySelector('#mgrChal')||{}).textContent||'',next_steps:(document.querySelector('#mgrNext')||{}).value||(document.querySelector('#mgrNext')||{}).textContent||'',full_data:d,updated_at:new Date().toISOString()};
    const r=await c.from('management_reports').insert(row).select(); if(r.error) throw r.error;
    toast('✅ تم حفظ تقرير الإدارة في قاعدة البيانات'); return true;
  }
  async function saveAIToDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const d=formData(), s=schoolInfo(d);
    const text=d.reportText||d.review_text||d.text||'';
    const score=(Number(d.s1||0)+Number(d.s2||0)+Number(d.s3||0))||Number(d.ai_score||0)||0;
    const r=await c.from('ai_reviews').insert({school_id:s.id,review_text:text,score:score,ai_score:score,ai_summary:(document.getElementById('aiResult')||{}).innerText||'',full_data:d}).select(); if(r.error) throw r.error;
    toast('✅ تم حفظ تقييم AI في قاعدة البيانات'); return true;
  }
  async function uploadSchoolFilesDB(){
    const c=client(); if(!c){toast('لم يتم تحميل Supabase',false);return false;}
    const input=document.getElementById('files')||document.querySelector('input[type=file]');
    if(!input||!input.files||!input.files.length){toast('اختر ملفات أولاً',false);return false;}
    const s=schoolInfo(); const cat=window.CATEGORY||(location.pathname.match(/\/(photos|models|certificates)\//)||[])[1]||'files';
    const bucket=cat==='photos'?'library-images':(cat==='certificates'?'specialist-certificates':'library-documents');
    let done=0;
    for(const f of Array.from(input.files).slice(0,10)){
      const safe=f.name.replace(/[^\w\.\-\u0600-\u06FF]+/g,'_'); const path=`${s.code||'general'}/${cat}/${Date.now()}_${safe}`;
      const up=await c.storage.from(bucket).upload(path,f,{upsert:true,contentType:f.type||'application/octet-stream'}); if(up.error) throw up.error;
      const url=c.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      const ins=await c.from('school_files').insert({school_id:s.id,school_code:s.code,file_category:cat,file_name:f.name,file_path:path,file_url:url,file_type:f.type,file_size:f.size}).select(); if(ins.error) throw ins.error;
      done++;
    }
    toast('✅ تم رفع '+done+' ملف/ملفات إلى Supabase');
    setTimeout(renderSchoolFilesFromDB,500);
    return true;
  }
  async function renderSchoolFilesFromDB(){
    if(!location.pathname.includes('/schools/')) return;
    const c=client(); if(!c) return;
    const input=document.getElementById('fileList'); if(!input) return;
    const s=schoolInfo(); const cat=window.CATEGORY||(location.pathname.match(/\/(photos|models|certificates)\//)||[])[1]||null;
    if(!s.id) return;
    let q=c.from('school_files').select('*').eq('school_id',s.id).order('created_at',{ascending:false});
    if(cat) q=q.eq('file_category',cat);
    const r=await q; if(r.error) return;
    const arr=r.data||[];
    const html=arr.map((f,i)=>`<div class="file-row" style="display:block;text-align:right"><div><b>${i+1}. ${esc(f.file_name)}</b><br><small class="muted">${esc(f.created_at||'')} — محفوظ في Supabase</small></div>${(f.file_type||'').startsWith('image/')?`<img src="${esc(f.file_url)}" style="max-width:160px;max-height:120px;border-radius:10px;margin:8px 0;display:block">`:''}<a class="btn outline" href="${esc(f.file_url)}" target="_blank">فتح الملف</a></div>`).join('');
    if(html) input.innerHTML=html;
    const cnt=document.getElementById('count'); if(cnt) cnt.textContent=arr.length;
  }
  function wrap(name,fn){const old=window[name]; if(typeof old==='function'&&!old.__dbWrapped){const nw=async function(){try{old.apply(this,arguments);}catch(e){console.warn(e)}try{await fn();}catch(err){console.error(err);toast('❌ فشل الحفظ في القاعدة: '+(err.message||err),false)}}; nw.__dbWrapped=true; window[name]=nw;}}
  function labelButtons(){document.querySelectorAll('button,.btn,a').forEach(el=>{if((el.textContent||'').includes('حفظ مؤقت'))el.textContent=el.textContent.replace('حفظ مؤقت','حفظ في القاعدة');});}
  function setup(){
    labelButtons();
    if(location.pathname.includes('/schedule/')){
      wrap('saveDraft',saveScheduleDB);
      document.querySelectorAll('button,.btn').forEach(b=>{if((b.textContent||'').includes('حفظ في القاعدة')||(b.id||'').includes('save'))b.addEventListener('click',async e=>{try{await saveScheduleDB()}catch(err){toast('❌ '+err.message,false)}},true)});
    }
    if(location.pathname.includes('/evaluation/')){wrap('saveEval',saveEvaluationDB);wrap('saveAll',saveEvaluationDB);document.querySelectorAll('button,.btn').forEach(b=>{if((b.textContent||'').includes('حفظ في القاعدة')||(b.textContent||'').includes('حفظ التقييم'))b.addEventListener('click',async()=>{try{await saveEvaluationDB()}catch(err){}},true)});}
    if(location.pathname.includes('/management/')){wrap('saveReport',saveManagementDB);document.querySelectorAll('button,.btn').forEach(b=>{if((b.textContent||'').includes('حفظ'))b.addEventListener('click',async()=>{try{await saveManagementDB()}catch(err){}},true)});renderManagerFromDB();}
    if(location.pathname.includes('/ai-evaluation/')){wrap('saveAI',saveAIToDB);enhanceAIPage();}
    if(location.pathname.includes('/schools/')){wrap('uploadFiles',uploadSchoolFilesDB);document.querySelectorAll('button,.btn').forEach(b=>{if((b.textContent||'').includes('رفع')||(b.textContent||'').includes('حفظ / رفع'))b.addEventListener('click',async()=>{try{await uploadSchoolFilesDB()}catch(err){}},true)});renderSchoolFilesFromDB();}
  }
  async function renderManagerFromDB(){
    const c=client(); if(!c) return;
    try{
      const weeks=(await c.from('daily_work_logs').select('*').order('week_number',{ascending:true})).data||[];
      const evals=(await c.from('library_evaluations').select('*')).data||[];
      const files=(await c.from('school_files').select('*')).data||[];
      const sc=document.getElementById('scheduleContent');
      if(sc && weeks.length){sc.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px"><div style="background:#eef6ff;border-radius:12px;padding:14px;text-align:center"><b style="font-size:28px;color:#0c447c">${weeks.length}</b><br>أسابيع محفوظة</div><div style="background:#eef6ff;border-radius:12px;padding:14px;text-align:center"><b style="font-size:28px;color:#0f6e56">${files.length}</b><br>ملفات وشواهد</div><div style="background:#eef6ff;border-radius:12px;padding:14px;text-align:center"><b style="font-size:28px;color:#ba7517">${evals.length}</b><br>تقييمات</div></div><table class="weeks-table"><thead><tr><th>الأسبوع</th><th>العنوان</th><th>من تاريخ</th><th>ملاحظات</th></tr></thead><tbody>${weeks.map(w=>`<tr><td>الأسبوع ${w.week_number||'—'}</td><td>${esc(w.week_title||'')}</td><td>${esc(w.work_date||'')}</td><td>${esc(w.notes||'')}</td></tr>`).join('')}</tbody></table>`;}
      const kw=document.getElementById('kWeeks'); if(kw) kw.textContent=weeks.length||'—';
    }catch(e){console.warn(e)}
  }
  async function enhanceAIPage(){
    const c=client(); if(!c) return;
    const card=document.createElement('section'); card.className='card'; card.innerHTML='<h2>محلل AI من بيانات القاعدة</h2><p class="muted">يجمع الأسابيع والتقييمات والملفات ليقترح صياغة تقرير جاهزة.</p><div class="actions"><button class="btn teal" id="ai-db-generate">🤖 توليد تقرير من القاعدة</button></div><div id="ai-db-output" class="note" style="margin-top:12px">اضغط الزر لتوليد صياغة إدارية.</div>';
    document.querySelector('.wrap')?.appendChild(card);
    document.getElementById('ai-db-generate')?.addEventListener('click',async()=>{
      const weeks=(await c.from('daily_work_logs').select('*')).data||[]; const evals=(await c.from('library_evaluations').select('*')).data||[]; const files=(await c.from('school_files').select('*')).data||[];
      document.getElementById('ai-db-output').innerHTML=`<b>صياغة مقترحة:</b><br>تم خلال الفترة الحالية توثيق ${weeks.length} أسبوع عمل، وتسجيل ${evals.length} تقييم مكتبي، ورفع ${files.length} شاهدًا وملفًا ضمن منصة أكاديمية الفلاح. وتوصي المتابعة بالاستمرار في توثيق الشواهد وربط التوصيات بخطة تحسين أسبوعية قابلة للقياس.`;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup); else setup();
  window.AlfalahDBSync={saveScheduleDB,saveEvaluationDB,saveManagementDB,saveAIToDB,uploadSchoolFilesDB,renderSchoolFilesFromDB};
})();
