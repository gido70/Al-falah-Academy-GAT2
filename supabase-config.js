/**
 * ═══════════════════════════════════════════════════════════
 *  ALFALAH PLATFORM — Supabase Config & Helper API
 *  النسخة المُصلَحة والمحسَّنة
 *  الإصلاحات:
 *  1. حل مشكلة Race Condition (الانتظار حتى تحمّل المكتبة)
 *  2. دعم كلا صيغتَي المفتاح (JWT anon + sb_publishable)
 *  3. مكتبة helper functions كاملة لجميع الصفحات
 *  4. Fallback تلقائي إلى localStorage عند انقطاع الاتصال
 *  5. مؤشر حالة الاتصال مرئي
 * ═══════════════════════════════════════════════════════════
 */

// ── إعدادات الاتصال ──────────────────────────────────────
window.ALFALAH_SUPABASE_URL = "https://nmbbahzzogspuuvpsxud.supabase.co";

// ⚠️ استبدل هذا بـ anon key من لوحة Supabase:
// Settings → API → Project API Keys → anon (public)
// يبدأ بـ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
window.ALFALAH_SUPABASE_ANON_KEY = "PUT_YOUR_ANON_JWT_KEY_HERE";

// المفتاح القديم (احتياطي)
window.ALFALAH_SUPABASE_KEY = "sb_publishable_OHbaA9Rse47v5pw_0Juafg_RbeorWMM";

// ── حالة النظام ──────────────────────────────────────────
window.ALFALAH_DB = {
  client: null,
  ready: false,
  mode: 'offline', // 'supabase' | 'local' | 'offline'
  error: null,
  _readyCallbacks: [],

  onReady(fn) {
    if (this.ready) { fn(this.client); return; }
    this._readyCallbacks.push(fn);
  },

  _resolve(client, mode) {
    this.client = client;
    this.ready = true;
    this.mode = mode;
    this._readyCallbacks.forEach(fn => { try { fn(client); } catch(e) {} });
    this._readyCallbacks = [];
    _renderStatusBadge(mode);
    console.log('[Alfalah] DB ready, mode:', mode);
  }
};

// ── تهيئة supabase مع انتظار تحميل المكتبة ──────────────
function _initSupabase() {
  // حدد المفتاح الصحيح
  const key = (window.ALFALAH_SUPABASE_ANON_KEY &&
               window.ALFALAH_SUPABASE_ANON_KEY !== 'PUT_YOUR_ANON_JWT_KEY_HERE')
              ? window.ALFALAH_SUPABASE_ANON_KEY
              : window.ALFALAH_SUPABASE_KEY;

  const url = window.ALFALAH_SUPABASE_URL;

  if (!url || !key) {
    console.warn('[Alfalah] No Supabase credentials → LocalStorage mode');
    window.ALFALAH_DB._resolve(null, 'local');
    return;
  }

  // انتظر حتى تتحمّل مكتبة Supabase (تحل Race Condition)
  let attempts = 0;
  const tryInit = () => {
    attempts++;
    const lib = window.supabase || (window.Supabase && window.Supabase.createClient ? window.Supabase : null);
    const createClient = lib && (lib.createClient || (lib.default && lib.default.createClient));

    if (createClient) {
      try {
        const client = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          },
          db: { schema: 'public' },
          global: {
            headers: { 'X-Client-Info': 'alfalah-platform/1.0' }
          }
        });

        // اختبر الاتصال الفعلي
        client.from('schools').select('id', { count: 'exact', head: true })
          .then(({ error }) => {
            if (error && error.code !== 'PGRST116') {
              console.warn('[Alfalah] Supabase test failed:', error.message, '→ Local mode');
              window.ALFALAH_DB.error = error.message;
              window.ALFALAH_DB._resolve(null, 'local');
            } else {
              window.ALFALAH_DB._resolve(client, 'supabase');
            }
          })
          .catch(err => {
            console.warn('[Alfalah] Network error:', err, '→ Local mode');
            window.ALFALAH_DB._resolve(null, 'local');
          });

      } catch(e) {
        console.error('[Alfalah] createClient error:', e);
        window.ALFALAH_DB.error = e.message;
        window.ALFALAH_DB._resolve(null, 'local');
      }

    } else if (attempts < 30) {
      // انتظر 200ms وحاول مرة أخرى (حتى 6 ثوانٍ)
      setTimeout(tryInit, 200);
    } else {
      console.warn('[Alfalah] Supabase library not loaded after 6s → Local mode');
      window.ALFALAH_DB._resolve(null, 'local');
    }
  };

  tryInit();
}

// ── مؤشر الحالة المرئي ───────────────────────────────────
function _renderStatusBadge(mode) {
  const existing = document.getElementById('alfalah-db-status');
  if (existing) existing.remove();

  const colors = {
    supabase: { bg: '#0f6e56', text: '🟢 Supabase متصل' },
    local:    { bg: '#ba7517', text: '🟡 وضع محلي' },
    offline:  { bg: '#c0392b', text: '🔴 غير متصل' }
  };
  const conf = colors[mode] || colors.offline;

  const badge = document.createElement('div');
  badge.id = 'alfalah-db-status';
  badge.title = `وضع قاعدة البيانات: ${conf.text}`;
  badge.style.cssText = `
    position: fixed; bottom: 10px; left: 10px; z-index: 99999;
    background: ${conf.bg}; color: #fff; font-family: Cairo, sans-serif;
    font-size: 11px; font-weight: 700; padding: 5px 11px;
    border-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,.2);
    cursor: default; direction: rtl; opacity: .88;
    transition: opacity .3s;
  `;
  badge.textContent = conf.text;
  badge.onmouseenter = () => badge.style.opacity = '1';
  badge.onmouseleave = () => badge.style.opacity = '.88';
  document.body.appendChild(badge);
}

// ═══════════════════════════════════════════════════════════
//  HELPER API — واجهة برمجية لجميع صفحات المنصة
// ═══════════════════════════════════════════════════════════

window.AlfalahDB = {

  // ── اختبار الاتصال ───────────────────────────────────
  async ping() {
    const db = window.ALFALAH_DB.client;
    if (!db) return false;
    try {
      const { error } = await db.from('schools').select('id', { head: true, count: 'exact' });
      return !error;
    } catch(e) { return false; }
  },

  // ═══════════════════════════════════════════════════════
  //  التقييمات — library_evaluations
  // ═══════════════════════════════════════════════════════

  // حفظ أو تحديث تقييم مكتبة
  async saveEvaluation(schoolCode, data) {
    const payload = {
      school_code: schoolCode,
      visit_date: data.fields?.date || null,
      librarian_name: data.fields?.lib || null,
      total_score: data.totalScore || null,
      final_level: _getGradeLabel(data.totalScore),
      strengths: data.fields?.ovStr || null,
      weaknesses: data.fields?.ovGap || null,
      recommendations: data.fields?.ovRec || null,
      full_data: data,
      updated_at: new Date().toISOString()
    };

    // احفظ محلياً دائماً
    _localSave(`eval_${schoolCode}`, data);

    const db = window.ALFALAH_DB.client;
    if (!db) return { ok: false, local: true };

    try {
      // ابحث عن سجل موجود
      const { data: existing } = await db
        .from('library_evaluations')
        .select('id')
        .eq('school_code', schoolCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let result;
      if (existing?.id) {
        result = await db
          .from('library_evaluations')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await db
          .from('library_evaluations')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      console.log('[Alfalah] Evaluation saved to Supabase:', schoolCode);
      return { ok: true, data: result.data };

    } catch(e) {
      console.warn('[Alfalah] saveEvaluation error:', e.message);
      return { ok: false, local: true, error: e.message };
    }
  },

  // جلب تقييم مكتبة
  async getEvaluation(schoolCode) {
    const db = window.ALFALAH_DB.client;

    if (db) {
      try {
        const { data, error } = await db
          .from('library_evaluations')
          .select('*')
          .eq('school_code', schoolCode)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data?.full_data) {
          _localSave(`eval_${schoolCode}`, data.full_data);
          return { ok: true, data: data.full_data, source: 'supabase' };
        }
      } catch(e) {
        console.warn('[Alfalah] getEvaluation remote failed:', e.message);
      }
    }

    // Fallback: localStorage
    const local = _localLoad(`eval_${schoolCode}`);
    if (local) return { ok: true, data: local, source: 'local' };
    return { ok: false, data: null };
  },

  // جلب تقييمات جميع المدارس
  async getAllEvaluations() {
    const db = window.ALFALAH_DB.client;
    const codes = ['khb', 'jmi', 'shj', 'bny', 'mzd', 'dan'];

    if (db) {
      try {
        const { data, error } = await db
          .from('library_evaluations')
          .select('school_code, total_score, final_level, visit_date, updated_at, full_data')
          .in('school_code', codes)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          // أحدث تقييم لكل مدرسة
          const bySchool = {};
          data.forEach(row => {
            if (!bySchool[row.school_code]) bySchool[row.school_code] = row;
          });
          return { ok: true, data: bySchool, source: 'supabase' };
        }
      } catch(e) {
        console.warn('[Alfalah] getAllEvaluations error:', e.message);
      }
    }

    // Fallback local
    const local = {};
    codes.forEach(code => {
      const d = _localLoad(`eval_${code}`);
      if (d) local[code] = { school_code: code, total_score: d.totalScore, full_data: d };
    });
    return { ok: true, data: local, source: 'local' };
  },

  // ═══════════════════════════════════════════════════════
  //  جدول الدوام — daily_work_logs
  // ═══════════════════════════════════════════════════════

  // حفظ أسبوع عمل
  async saveWeek(weekNumber, data) {
    const payload = {
      week_number: parseInt(weekNumber),
      week_title: `الأسبوع ${weekNumber}`,
      work_date: data.wstart || null,
      full_data: data,
      updated_at: new Date().toISOString()
    };

    // احفظ محلياً دائماً
    _localSave(`falah_week_${weekNumber}`, data);

    const db = window.ALFALAH_DB.client;
    if (!db) return { ok: false, local: true };

    try {
      const { data: existing } = await db
        .from('daily_work_logs')
        .select('id')
        .eq('week_number', parseInt(weekNumber))
        .limit(1)
        .single();

      let result;
      if (existing?.id) {
        result = await db
          .from('daily_work_logs')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await db
          .from('daily_work_logs')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      console.log('[Alfalah] Week saved to Supabase:', weekNumber);
      return { ok: true, data: result.data };

    } catch(e) {
      console.warn('[Alfalah] saveWeek error:', e.message);
      return { ok: false, local: true, error: e.message };
    }
  },

  // جلب أسبوع عمل
  async getWeek(weekNumber) {
    const db = window.ALFALAH_DB.client;

    if (db) {
      try {
        const { data, error } = await db
          .from('daily_work_logs')
          .select('*')
          .eq('week_number', parseInt(weekNumber))
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data?.full_data) {
          _localSave(`falah_week_${weekNumber}`, data.full_data);
          return { ok: true, data: data.full_data, source: 'supabase' };
        }
      } catch(e) {
        console.warn('[Alfalah] getWeek remote failed:', e.message);
      }
    }

    const local = _localLoad(`falah_week_${weekNumber}`);
    if (local) return { ok: true, data: local, source: 'local' };
    return { ok: false, data: null };
  },

  // جلب كل الأسابيع المحفوظة
  async getAllWeeks() {
    const db = window.ALFALAH_DB.client;

    if (db) {
      try {
        const { data, error } = await db
          .from('daily_work_logs')
          .select('week_number, week_title, work_date, updated_at, full_data')
          .order('week_number', { ascending: true });

        if (!error && data && data.length > 0) {
          // مزامنة مع localStorage
          data.forEach(row => {
            if (row.full_data) _localSave(`falah_week_${row.week_number}`, row.full_data);
          });
          return { ok: true, data, source: 'supabase' };
        }
      } catch(e) {
        console.warn('[Alfalah] getAllWeeks error:', e.message);
      }
    }

    // Fallback: اقرأ كل الأسابيع من localStorage
    const weeks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('falah_week_')) {
        const wn = parseInt(k.replace('falah_week_', ''));
        if (!isNaN(wn)) {
          const d = _localLoad(k.replace('falah_week_', 'falah_week_'));
          if (d) weeks.push({ week_number: wn, full_data: d, source: 'local' });
        }
      }
    }
    weeks.sort((a, b) => a.week_number - b.week_number);
    return { ok: true, data: weeks, source: 'local' };
  },

  // ═══════════════════════════════════════════════════════
  //  تقارير الإدارة — management_reports
  // ═══════════════════════════════════════════════════════

  async saveManagementReport(weekLabel, reportData) {
    const payload = {
      report_week: weekLabel,
      report_date: new Date().toISOString().split('T')[0],
      summary: reportData.summary || null,
      achievements: reportData.achievements || null,
      challenges: reportData.challenges || null,
      next_steps: reportData.nextSteps || null,
      full_data: reportData,
      updated_at: new Date().toISOString()
    };

    _localSave(`mgmt_report_${weekLabel}`, reportData);

    const db = window.ALFALAH_DB.client;
    if (!db) return { ok: false, local: true };

    try {
      const result = await db
        .from('management_reports')
        .insert(payload)
        .select()
        .single();

      if (result.error) throw result.error;
      return { ok: true, data: result.data };
    } catch(e) {
      return { ok: false, local: true, error: e.message };
    }
  },

  // ═══════════════════════════════════════════════════════
  //  رفع ملفات المدارس — Storage
  // ═══════════════════════════════════════════════════════

  /**
   * رفع ملف لمكتبة مدرسة
   * @param {string} schoolCode  - رمز المدرسة (khb, jmi, ...)
   * @param {string} category    - 'photos' | 'documents' | 'certificates'
   * @param {File}   file        - كائن الملف
   * @returns {Promise<{ok, url, error}>}
   */
  async uploadSchoolFile(schoolCode, category, file) {
    const buckets = {
      photos:       'library-images',
      documents:    'library-documents',
      certificates: 'specialist-certificates'
    };

    const bucket = buckets[category];
    if (!bucket) return { ok: false, error: 'نوع ملف غير معروف' };

    // احفظ محلياً دائماً كـ base64
    const base64 = await _fileToBase64(file);
    const localKey = `file_${schoolCode}_${category}`;
    const existing = _localLoad(localKey) || [];
    existing.push({
      name: file.name,
      type: file.type,
      size: file.size,
      base64,
      uploadedAt: new Date().toISOString()
    });
    _localSave(localKey, existing);

    const db = window.ALFALAH_DB.client;
    if (!db) return { ok: false, local: true, base64, name: file.name };

    try {
      const path = `${schoolCode}/${category}/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;

      const { error: upErr } = await db.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (upErr) throw upErr;

      const { data: urlData } = db.storage
        .from(bucket)
        .getPublicUrl(path);

      const fileUrl = urlData?.publicUrl || null;

      // سجّل في جدول school_files
      await db.from('school_files').insert({
        school_code: schoolCode,
        file_category: category,
        file_name: file.name,
        file_path: path,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size
      });

      console.log('[Alfalah] File uploaded:', path);
      return { ok: true, url: fileUrl, path, name: file.name };

    } catch(e) {
      console.warn('[Alfalah] Upload error:', e.message);
      return { ok: false, local: true, base64, name: file.name, error: e.message };
    }
  },

  // جلب ملفات مدرسة
  async getSchoolFiles(schoolCode, category) {
    const db = window.ALFALAH_DB.client;

    if (db) {
      try {
        let query = db.from('school_files')
          .select('*')
          .eq('school_code', schoolCode);

        if (category) query = query.eq('file_category', category);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) return { ok: true, data, source: 'supabase' };
      } catch(e) {
        console.warn('[Alfalah] getSchoolFiles error:', e.message);
      }
    }

    // Fallback محلي
    const localKey = `file_${schoolCode}_${category || 'all'}`;
    const local = _localLoad(localKey) || [];
    return { ok: true, data: local, source: 'local' };
  },

  // ═══════════════════════════════════════════════════════
  //  تقييمات AI — ai_reviews
  // ═══════════════════════════════════════════════════════

  async saveAIReview(schoolCode, evaluationId, reviewData) {
    const payload = {
      school_code: schoolCode,
      review_text: reviewData.text || null,
      ai_summary: reviewData.summary || null,
      ai_strengths: reviewData.strengths || null,
      ai_weaknesses: reviewData.weaknesses || null,
      ai_recommendations: reviewData.recommendations || null,
      full_data: reviewData,
    };

    _localSave(`ai_review_${schoolCode}`, reviewData);

    const db = window.ALFALAH_DB.client;
    if (!db) return { ok: false, local: true };

    if (evaluationId) payload.evaluation_id = evaluationId;

    try {
      const result = await db
        .from('ai_reviews')
        .insert(payload)
        .select()
        .single();

      if (result.error) throw result.error;
      return { ok: true, data: result.data };
    } catch(e) {
      return { ok: false, local: true, error: e.message };
    }
  },

  // ═══════════════════════════════════════════════════════
  //  حالة النظام
  // ═══════════════════════════════════════════════════════

  getStatus() {
    return {
      ready: window.ALFALAH_DB.ready,
      mode: window.ALFALAH_DB.mode,
      connected: window.ALFALAH_DB.mode === 'supabase',
      error: window.ALFALAH_DB.error
    };
  },

  // اختصار: انتظر حتى يصبح النظام جاهزاً
  onReady(callback) {
    window.ALFALAH_DB.onReady(callback);
  }
};

// ═══════════════════════════════════════════════════════════
//  أدوات داخلية (Private)
// ═══════════════════════════════════════════════════════════

function _localSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}

function _localLoad(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch(e) { return null; }
}

function _fileToBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function _getGradeLabel(score) {
  if (!score) return '—';
  if (score >= 90) return 'ممتاز';
  if (score >= 80) return 'جيد جداً';
  if (score >= 70) return 'جيد';
  if (score >= 60) return 'مقبول';
  return 'يحتاج تطوير';
}

// ═══════════════════════════════════════════════════════════
//  تشغيل التهيئة
// ═══════════════════════════════════════════════════════════
(function bootstrap() {
  // إذا تحمّل DOM → شغّل مباشرة، وإلا انتظر
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initSupabase);
  } else {
    // DOM محمَّل لكن supabase.js ربما لم يكتمل → نبدأ فوراً مع retry
    _initSupabase();
  }
})();

/**
 * ═══════════════════════════════════════════════════════════
 *  كيفية الاستخدام في أي صفحة:
 * ═══════════════════════════════════════════════════════════
 *
 *  // انتظر حتى يصبح النظام جاهزاً:
 *  AlfalahDB.onReady(async () => {
 *    const status = AlfalahDB.getStatus();
 *    console.log('وضع الاتصال:', status.mode);
 *  });
 *
 *  // حفظ تقييم مكتبة:
 *  const result = await AlfalahDB.saveEvaluation('khb', myData);
 *
 *  // جلب تقييم:
 *  const { data } = await AlfalahDB.getEvaluation('khb');
 *
 *  // حفظ أسبوع دوام:
 *  await AlfalahDB.saveWeek(1, weekData);
 *
 *  // جلب كل الأسابيع:
 *  const { data: weeks } = await AlfalahDB.getAllWeeks();
 *
 *  // رفع صورة مكتبة:
 *  const fileInput = document.getElementById('myFile');
 *  const file = fileInput.files[0];
 *  const { ok, url } = await AlfalahDB.uploadSchoolFile('khb', 'photos', file);
 * ═══════════════════════════════════════════════════════════
 */
