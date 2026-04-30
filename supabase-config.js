// إعدادات Supabase لمشروع مكتبات أكاديمية الفلاح
// Project URL جاهز من مشروعك: alfalah-libraries
window.ALFALAH_SUPABASE_URL = "https://nmbbahzzogspuuvpsxud.supabase.co";

// مهم: الصق هنا Publishable key كاملاً من Supabase > API Keys
// لا تضع Secret key هنا إطلاقاً.
window.ALFALAH_SUPABASE_KEY = "sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM";

(function(){
  try{
    if(window.supabase && window.ALFALAH_SUPABASE_KEY && !window.ALFALAH_SUPABASE_KEY.includes('sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM')){
      window.alfalahSupabase = window.supabase.createClient(window.ALFALAH_SUPABASE_URL, window.ALFALAH_SUPABASE_KEY);
      console.log('Alfalah Supabase connected');
    }else{
      window.alfalahSupabase = null;
      console.warn('Supabase key is missing. Local save will still work.');
    }
  }catch(e){
    window.alfalahSupabase = null;
    console.error('Supabase init error', e);
  }
})();
