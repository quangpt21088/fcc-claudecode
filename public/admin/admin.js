// ─── Auth check ───────────────────────────────────────────────
const TOKEN = localStorage.getItem('admin_token');
if (!TOKEN) { window.location.href = 'login.html'; throw new Error('NO_TOKEN'); }

const API = (path, opts = {}) =>
  fetch(path, {
    ...opts,
    headers: { 'Authorization': `Bearer ${TOKEN}`, ...opts.headers },
  });

// ─── Logout ───────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  window.location.href = 'login.html';
});

// ─── Sidebar navigation ───────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    tabPanels.forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tab-' + item.dataset.tab);
    if (panel) panel.classList.add('active');
    // Close mobile sidebar
    sidebar.classList.remove('open');
    // Load registrations when tab opened
    if (item.dataset.tab === 'registrations') loadRegistrations();
  });
});

// Mobile menu toggle
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

// ─── Helpers ──────────────────────────────────────────────────
function esc(s){ return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escHtml(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

function checkAuth(res) {
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

function showMsg(el, text, isError) {
  el.classList.remove('show', 'toast-success', 'toast-error');
  el.classList.add('show', isError ? 'toast-error' : 'toast-success');
  el.textContent = text;
}

// Button loading state
function setBtnLoading(btn, loading) {
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

// ─── State ────────────────────────────────────────────────────
let allCourses = [];
let allSchedule = [];
let allSettings = {};
let titleStyles = {};

// ─── File upload helper (FormData → /api/admin/upload) ────────
async function uploadFile(file) {
  if (!file) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error('Ảnh quá lớn (tối đa 2MB)');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: form,
  });
  if (checkAuth(res)) throw new Error('AUTH');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload thất bại');
  return data.url;
}

// ─── Upload zone setup ────────────────────────────────────────
function setupUploadZone(zoneId, fileInputId, onUpload) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(fileInputId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], onUpload);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0], onUpload);
  });

  async function handleFile(file, cb) {
    try {
      const url = await uploadFile(file);
      if (cb) cb(url);
    } catch (e) {
      if (e.message !== 'AUTH') alert(e.message || 'Lỗi upload');
    }
  }
}

setupUploadZone('logo-upload-zone', 'logo-file-input', (url) => {
  document.getElementById('f-logo-url').value = url;
  const preview = document.getElementById('logo-preview');
  preview.src = url;
  preview.style.display = 'block';
});

setupUploadZone('teacher-upload-zone', 'teacher-file-input', (url) => {
  document.getElementById('f-teacher-photo').value = url;
  const preview = document.getElementById('teacher-photo-preview');
  preview.src = url;
  preview.style.display = 'block';
});

// ─── Load dữ liệu ────────────────────────────────────────────
async function loadData() {
  try {
    const settingsRes = await API('/api/admin/settings');
    if (checkAuth(settingsRes)) return;
    allSettings = await settingsRes.json();

    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    setVal('f-hero-title1', allSettings.hero_title1);
    setVal('f-hero-title2', allSettings.hero_title2);
    setVal('f-hero-desc', allSettings.hero_desc);
    setVal('f-hero-badge', allSettings.hero_badge);
    setVal('f-stat1-value', allSettings.hero_stat1_value);
    setVal('f-stat1-label', allSettings.hero_stat1_label);
    setVal('f-stat2-value', allSettings.hero_stat2_value);
    setVal('f-stat2-label', allSettings.hero_stat2_label);
    setVal('f-stat3-value', allSettings.hero_stat3_value);
    setVal('f-stat3-label', allSettings.hero_stat3_label);
    setVal('f-courses-title', allSettings.courses_section_title);
    setVal('f-courses-desc', allSettings.courses_section_desc);
    setVal('f-schedule-title', allSettings.schedule_section_title);
    setVal('f-schedule-desc', allSettings.schedule_section_desc);
    setVal('f-form-title', allSettings.form_section_title);
    setVal('f-form-desc', allSettings.form_section_desc);
    setVal('f-hotline', allSettings.footer_hotline);
    setVal('f-address', allSettings.footer_address);
    setVal('f-map', allSettings.footer_map);
    setVal('f-teacher-name', allSettings.teacher_name);
    setVal('f-teacher-label', allSettings.teacher_label);
    setVal('f-teacher-bio', allSettings.teacher_bio);
    setVal('f-satisfaction-value', allSettings.satisfaction_value);
    setVal('f-satisfaction-label', allSettings.satisfaction_label);
    setVal('f-teacher-photo', allSettings.teacher_photo);

    // General tab
    setVal('f-logo-url', allSettings.logo_url);
    setVal('f-site-name', allSettings.site_name);
    setVal('f-site-name-accent', allSettings.site_name_accent);
    setVal('f-approach-title', allSettings.approach_title);
    setVal('f-why-title', allSettings.why_title);

    // Logo preview
    const logoPreview = document.getElementById('logo-preview');
    if (logoPreview && allSettings.logo_url) {
      logoPreview.src = allSettings.logo_url;
      logoPreview.style.display = 'block';
    }

    const photoPreview = document.getElementById('teacher-photo-preview');
    if (photoPreview && allSettings.teacher_photo) {
      photoPreview.src = allSettings.teacher_photo;
      photoPreview.style.display = 'block';
    }

    // Load courses
    const coursesRes = await API('/api/admin/courses');
    if (checkAuth(coursesRes)) return;
    allCourses = await coursesRes.json() || [];
    renderCourses();

    // Load schedule
    const schedRes = await API('/api/admin/schedule');
    if (checkAuth(schedRes)) return;
    allSchedule = await schedRes.json() || [];
    renderSchedule();

    // Title styles
    try {
      const stylesRes = await API('/api/admin/title-styles');
      if (checkAuth(stylesRes)) return;
      titleStyles = await stylesRes.json() || {};
    } catch(e) { titleStyles = {}; }
    updateSavedStylesList();
    applyTitleStylesToPreview();

  } catch (err) { console.error('Lỗi tải dữ liệu:', err); }
}

// ═══════════════════════════════════════════════════════════════
//  COURSES CRUD
// ═══════════════════════════════════════════════════════════════

function renderCourses() {
  const container = document.getElementById('courses-list');
  if (!container) return;

  if (allCourses.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><p>Chưa có khóa học nào. Nhấn "Thêm khóa học" để tạo.</p></div>';
    return;
  }

  const colorMap = { blue:'#3b82f6', green:'#22c55e', purple:'#a855f7', orange:'#f97316' };

  container.innerHTML = allCourses.map((c) => {
    const schedCount = allSchedule.filter(s => s.course_id === c.id).length;
    const statusBadge = c.status === 'available'
      ? '<span class="badge badge-available">Còn chỗ</span>'
      : '<span class="badge badge-full">Hết chỗ</span>';
    const hiddenBadge = c.hidden
      ? '<span class="badge badge-hidden">Đang ẩn</span>'
      : '<span class="badge badge-available">Hiển thị</span>';

    return `
    <div class="course-card" data-course-id="${c.id}">
      <div class="flex items-start gap-4">
        <div class="course-color-bar self-stretch" style="background:${colorMap[c.color]||colorMap.blue}"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-lg">${esc(c.emoji||'📖')}</span>
            <span class="font-bold text-white truncate">${esc(c.name)}</span>
            ${statusBadge}
            ${hiddenBadge}
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span>${esc(c.short_name||'')}</span>
            <span>🎨 ${c.color||'blue'}</span>
            <span>🕐 ${esc(c.duration||'')}</span>
            <span>👥 ${esc(c.max_students||'')}</span>
            <span>📅 ${schedCount} lịch học</span>
          </div>
          ${c.sub ? `<p class="text-xs text-gray-500 mt-1">${esc(c.sub)}</p>` : ''}
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="btn-edit-course px-3 py-1.5 text-xs bg-brand-600/20 text-brand-400 rounded-lg hover:bg-brand-600/30 transition" data-id="${c.id}">✏️ Sửa</button>
          <button class="btn-del-course px-3 py-1.5 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition" data-id="${c.id}">🗑️ Xóa</button>
        </div>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.btn-edit-course').forEach(btn => {
    btn.addEventListener('click', () => openCourseModal(parseInt(btn.dataset.id)));
  });
  container.querySelectorAll('.btn-del-course').forEach(btn => {
    btn.addEventListener('click', () => deleteCourse(parseInt(btn.dataset.id)));
  });
}

// ─── Course Modal ─────────────────────────────────────────────
function openCourseModal(courseId) {
  const modal = document.getElementById('modal-course');
  const title = document.getElementById('modal-course-title');
  const isEdit = !!courseId;
  title.textContent = isEdit ? 'Sửa khóa học' : 'Thêm khóa học';

  // Update color dots
  document.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('selected', d.dataset.color === (isEdit ? allCourses.find(x=>x.id===courseId)?.color : 'blue'));
  });

  if (isEdit) {
    const c = allCourses.find(x => x.id === courseId);
    if (!c) return;
    document.getElementById('course-form-id').value = c.id;
    document.getElementById('course-form-name').value = c.name || '';
    document.getElementById('course-form-short').value = c.short_name || '';
    document.getElementById('course-form-emoji').value = c.emoji || '📖';
    document.getElementById('course-form-color').value = c.color || 'blue';
    document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('selected', d.dataset.color === c.color));
    document.getElementById('course-form-sub').value = c.sub || '';
    document.getElementById('course-form-desc').value = c.description || '';
    const features = Array.isArray(c.features) ? c.features.join('\n') : '';
    document.getElementById('course-form-features').value = features;
    document.getElementById('course-form-duration').value = c.duration || '2h/buổi';
    document.getElementById('course-form-max').value = c.max_students || 'Tối đa 10';
    document.getElementById('course-form-sessions').value = c.sessions || '2 buổi/tuần';
    document.getElementById('course-form-price').value = c.price || '';
    document.getElementById('course-form-status').value = c.status || 'available';
    document.getElementById('course-form-hidden').checked = !!c.hidden;
    document.getElementById('course-form-sort').value = c.sort_order || 0;
  } else {
    document.getElementById('course-form-id').value = '';
    ['course-form-name','course-form-short','course-form-sub','course-form-desc','course-form-features','course-form-price'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('course-form-emoji').value = '📖';
    document.getElementById('course-form-color').value = 'blue';
    document.getElementById('course-form-duration').value = '2h/buổi';
    document.getElementById('course-form-max').value = 'Tối đa 10';
    document.getElementById('course-form-sessions').value = '2 buổi/tuần';
    document.getElementById('course-form-status').value = 'available';
    document.getElementById('course-form-hidden').checked = false;
    document.getElementById('course-form-sort').value = allCourses.length;
  }

  modal.classList.add('show');
}

function closeCourseModal() {
  document.getElementById('modal-course').classList.remove('show');
}

async function saveCourse() {
  const msg = document.getElementById('msg-courses');
  const btn = document.getElementById('btn-course-save');
  const id = document.getElementById('course-form-id').value;
  const featuresText = document.getElementById('course-form-features').value;
  const features = featuresText.split('\n').map(f => f.trim()).filter(f => f);

  const body = {
    name: document.getElementById('course-form-name').value.trim(),
    short_name: document.getElementById('course-form-short').value.trim(),
    emoji: document.getElementById('course-form-emoji').value.trim(),
    color: document.getElementById('course-form-color').value,
    sub: document.getElementById('course-form-sub').value.trim(),
    description: document.getElementById('course-form-desc').value.trim(),
    features: features,
    duration: document.getElementById('course-form-duration').value.trim(),
    max_students: document.getElementById('course-form-max').value.trim(),
    sessions: document.getElementById('course-form-sessions').value.trim(),
    price: document.getElementById('course-form-price').value.trim(),
    status: document.getElementById('course-form-status').value,
    hidden: document.getElementById('course-form-hidden').checked,
    sort_order: parseInt(document.getElementById('course-form-sort').value) || 0,
  };

  if (!body.name) { showMsg(msg, '❌ Tên khóa học là bắt buộc', true); return; }

  setBtnLoading(btn, true);
  try {
    let res;
    if (id) {
      res = await API(`/api/admin/courses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      res = await API('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showMsg(msg, '✅ ' + (data.message || 'Đã lưu'), false);
      closeCourseModal();
      const coursesRes = await API('/api/admin/courses');
      allCourses = await coursesRes.json() || [];
      renderCourses();
      const schedRes = await API('/api/admin/schedule');
      allSchedule = await schedRes.json() || [];
      renderSchedule();
    } else {
      showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
    }
  } catch(e) {
    showMsg(msg, '❌ Lỗi kết nối', true);
  } finally {
    setBtnLoading(btn, false);
  }
}

async function deleteCourse(id) {
  const msg = document.getElementById('msg-courses');
  const c = allCourses.find(x => x.id === id);
  if (!c) return;

  const schedCount = allSchedule.filter(s => s.course_id === id).length;
  let confirmMsg = `Xóa khóa học "${c.name}"?`;
  if (schedCount > 0) confirmMsg += `\n⚠️ ${schedCount} lịch học liên quan cũng sẽ bị xóa!`;

  if (!confirm(confirmMsg)) return;

  try {
    const res = await API(`/api/admin/courses/${id}`, { method: 'DELETE' });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showMsg(msg, '✅ ' + (data.message || 'Đã xóa'), false);
      const coursesRes = await API('/api/admin/courses');
      allCourses = await coursesRes.json() || [];
      renderCourses();
      const schedRes = await API('/api/admin/schedule');
      allSchedule = await schedRes.json() || [];
      renderSchedule();
    } else {
      showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
    }
  } catch(e) {
    showMsg(msg, '❌ Lỗi kết nối', true);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SCHEDULE CRUD
// ═══════════════════════════════════════════════════════════════

function renderSchedule() {
  const container = document.getElementById('schedule-list');
  if (!container) return;

  if (allSchedule.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p>Chưa có lịch học nào. Nhấn "Thêm lịch học" để tạo.</p></div>';
    return;
  }

  container.innerHTML = allSchedule.map((s) => {
    const course = allCourses.find(c => c.id === s.course_id);
    const courseName = course ? course.name : '(không rõ)';
    const statusBadge = s.status === 'available' ? 'badge-available' : s.status === 'almost_full' ? 'badge-almost' : 'badge-full';
    const hiddenBadge = s.hidden
      ? '<span class="badge badge-hidden">Đang ẩn</span>'
      : '<span class="badge badge-available">Hiển thị</span>';

    return `
    <div class="schedule-card" data-schedule-id="${s.id}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="font-bold text-white">${esc(s.class_name)}</span>
            <span class="badge ${statusBadge}">${esc(s.status_text||'🟢 Còn chỗ')}</span>
            ${hiddenBadge}
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span>📚 ${esc(courseName)}</span>
            <span>🕐 ${esc(s.time_slot||'')}</span>
            <span>📅 ${esc(s.days||'')}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="btn-edit-schedule px-3 py-1.5 text-xs bg-brand-600/20 text-brand-400 rounded-lg hover:bg-brand-600/30 transition" data-id="${s.id}">✏️ Sửa</button>
          <button class="btn-del-schedule px-3 py-1.5 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition" data-id="${s.id}">🗑️ Xóa</button>
        </div>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.btn-edit-schedule').forEach(btn => {
    btn.addEventListener('click', () => openScheduleModal(parseInt(btn.dataset.id)));
  });
  container.querySelectorAll('.btn-del-schedule').forEach(btn => {
    btn.addEventListener('click', () => deleteSchedule(parseInt(btn.dataset.id)));
  });
}

// ─── Schedule Modal ───────────────────────────────────────────
function openScheduleModal(scheduleId) {
  const modal = document.getElementById('modal-schedule');
  const title = document.getElementById('modal-schedule-title');
  const isEdit = !!scheduleId;
  title.textContent = isEdit ? 'Sửa lịch học' : 'Thêm lịch học';

  const courseSelect = document.getElementById('schedule-form-course');
  courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>' +
    allCourses.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

  if (isEdit) {
    const s = allSchedule.find(x => x.id === scheduleId);
    if (!s) return;
    document.getElementById('schedule-form-id').value = s.id;
    document.getElementById('schedule-form-course').value = s.course_id || '';
    document.getElementById('schedule-form-name').value = s.class_name || '';
    document.getElementById('schedule-form-time').value = s.time_slot || '';
    document.getElementById('schedule-form-days').value = s.days || '';
    document.getElementById('schedule-form-status').value = s.status || 'available';
    document.getElementById('schedule-form-statustext').value = s.status_text || '🟢 Còn chỗ';
    document.getElementById('schedule-form-hidden').checked = !!s.hidden;
    document.getElementById('schedule-form-sort').value = s.sort_order || 0;
  } else {
    document.getElementById('schedule-form-id').value = '';
    ['schedule-form-course','schedule-form-name','schedule-form-time','schedule-form-days','schedule-form-statustext'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('schedule-form-status').value = 'available';
    document.getElementById('schedule-form-hidden').checked = false;
    document.getElementById('schedule-form-sort').value = allSchedule.length;
  }

  modal.classList.add('show');
}

function closeScheduleModal() {
  document.getElementById('modal-schedule').classList.remove('show');
}

async function saveSchedule() {
  const msg = document.getElementById('msg-schedule');
  const btn = document.getElementById('btn-schedule-save');
  const id = document.getElementById('schedule-form-id').value;

  const body = {
    course_id: parseInt(document.getElementById('schedule-form-course').value) || null,
    class_name: document.getElementById('schedule-form-name').value.trim(),
    time_slot: document.getElementById('schedule-form-time').value.trim(),
    days: document.getElementById('schedule-form-days').value.trim(),
    status: document.getElementById('schedule-form-status').value,
    status_text: document.getElementById('schedule-form-statustext').value.trim(),
    hidden: document.getElementById('schedule-form-hidden').checked,
    sort_order: parseInt(document.getElementById('schedule-form-sort').value) || 0,
  };

  if (!body.class_name) { showMsg(msg, '❌ Tên lớp là bắt buộc', true); return; }

  setBtnLoading(btn, true);
  try {
    let res;
    if (id) {
      res = await API(`/api/admin/schedule/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      res = await API('/api/admin/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showMsg(msg, '✅ ' + (data.message || 'Đã lưu'), false);
      closeScheduleModal();
      const schedRes = await API('/api/admin/schedule');
      allSchedule = await schedRes.json() || [];
      renderSchedule();
    } else {
      showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
    }
  } catch(e) {
    showMsg(msg, '❌ Lỗi kết nối', true);
  } finally {
    setBtnLoading(btn, false);
  }
}

async function deleteSchedule(id) {
  const msg = document.getElementById('msg-schedule');
  const s = allSchedule.find(x => x.id === id);
  if (!s) return;

  if (!confirm(`Xóa lịch học "${s.class_name}"?`)) return;

  try {
    const res = await API(`/api/admin/schedule/${id}`, { method: 'DELETE' });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showMsg(msg, '✅ ' + (data.message || 'Đã xóa'), false);
      const schedRes = await API('/api/admin/schedule');
      allSchedule = await schedRes.json() || [];
      renderSchedule();
    } else {
      showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
    }
  } catch(e) {
    showMsg(msg, '❌ Lỗi kết nối', true);
  }
}

// ═══════════════════════════════════════════════════════════════
//  TITLE STYLE EDITOR
// ═══════════════════════════════════════════════════════════════
const titleSelector = document.getElementById('title-selector');
const titleFont = document.getElementById('title-font');
const titleSize = document.getElementById('title-size');
const titleWeight = document.getElementById('title-weight');
const titleColor = document.getElementById('title-color');
const titleColorText = document.getElementById('title-color-text');
const titleLineHeight = document.getElementById('title-lineheight');
const titleSpacing = document.getElementById('title-spacing');
const titlePreview = document.getElementById('title-preview');

function applyStyleToPreview() {
  if (!titlePreview) return;
  titlePreview.style.fontFamily = titleFont.value;
  titlePreview.style.fontSize = titleSize.value + 'px';
  titlePreview.style.fontWeight = titleWeight.value;
  titlePreview.style.color = titleColor.value;
  titlePreview.style.lineHeight = titleLineHeight.value;
  titlePreview.style.letterSpacing = titleSpacing.value;
}

[titleFont, titleSize, titleWeight, titleColor, titleLineHeight, titleSpacing].forEach(el => {
  if (el) el.addEventListener('change', applyStyleToPreview);
  if (el) el.addEventListener('input', applyStyleToPreview);
});
if (titleColorText) titleColorText.addEventListener('input', () => { titleColor.value = titleColorText.value; applyStyleToPreview(); });
if (titleColor) titleColor.addEventListener('input', () => { titleColorText.value = titleColor.value; applyStyleToPreview(); });

if (titleSelector) titleSelector.addEventListener('change', () => {
  const key = titleSelector.value;
  const style = titleStyles[key] || {};
  titleFont.value = style.fontFamily || 'Playfair Display';
  titleSize.value = style.fontSize || 48;
  titleWeight.value = style.fontWeight || 700;
  titleColor.value = style.color || '#ffffff';
  titleColorText.value = style.color || '#ffffff';
  titleLineHeight.value = style.lineHeight || '1.4';
  titleSpacing.value = style.letterSpacing || '0em';
  applyStyleToPreview();
});

function applyTitleStylesToPreview() {
  if (!titlePreview) return;
  const key = titleSelector ? titleSelector.value : 'hero-title1';
  const style = titleStyles[key] || {};
  titlePreview.style.fontFamily = style.fontFamily || 'Playfair Display';
  titlePreview.style.fontSize = (style.fontSize || 48) + 'px';
  titlePreview.style.fontWeight = style.fontWeight || 700;
  titlePreview.style.color = style.color || '#ffffff';
  titlePreview.style.lineHeight = style.lineHeight || '1.4';
  titlePreview.style.letterSpacing = style.letterSpacing || '0em';
}

function updateSavedStylesList() {
  const list = document.getElementById('saved-styles-list');
  if (!list) return;
  const keys = Object.keys(titleStyles);
  if (keys.length === 0) { list.innerHTML = '<p class="text-gray-500 text-xs">Chưa có style nào được lưu.</p>'; return; }
  list.innerHTML = keys.map(k => {
    const s = titleStyles[k];
    return `<div class="flex items-center gap-3 p-2 rounded-lg bg-white/3">
      <span class="w-4 h-4 rounded" style="background:${s.color||'#fff'}"></span>
      <span class="text-white/80 text-sm font-medium">${k}</span>
      <span class="text-gray-500 text-xs">${s.fontSize||48}px ${s.fontWeight||700} ${s.fontFamily||'Playfair Display'}</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  SAVE HANDLERS
// ═══════════════════════════════════════════════════════════════

// ─── Save Content ─────────────────────────────────────────────
document.getElementById('btn-save-content')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-content');
  const btn = document.getElementById('btn-save-content');
  setBtnLoading(btn, true);
  try {
    const body = {
      hero_title1: document.getElementById('f-hero-title1').value,
      hero_title2: document.getElementById('f-hero-title2').value,
      hero_desc: document.getElementById('f-hero-desc').value,
      hero_badge: document.getElementById('f-hero-badge').value,
      hero_stat1_value: document.getElementById('f-stat1-value').value,
      hero_stat1_label: document.getElementById('f-stat1-label').value,
      hero_stat2_value: document.getElementById('f-stat2-value').value,
      hero_stat2_label: document.getElementById('f-stat2-label').value,
      hero_stat3_value: document.getElementById('f-stat3-value').value,
      hero_stat3_label: document.getElementById('f-stat3-label').value,
      courses_section_title: document.getElementById('f-courses-title').value,
      courses_section_desc: document.getElementById('f-courses-desc').value,
      schedule_section_title: document.getElementById('f-schedule-title').value,
      schedule_section_desc: document.getElementById('f-schedule-desc').value,
      form_section_title: document.getElementById('f-form-title').value,
      form_section_desc: document.getElementById('f-form-desc').value,
      footer_hotline: document.getElementById('f-hotline').value,
      footer_address: document.getElementById('f-address').value,
      footer_map: document.getElementById('f-map').value,
    };
    const res = await API('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) showMsg(msg, '✅ ' + (data.message || 'Đã lưu'), false);
    else showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
  } catch { showMsg(msg, '❌ Lỗi kết nối', true); }
  finally { setBtnLoading(btn, false); }
});

// ─── Save General (logo, site name, section titles) ──────────
document.getElementById('btn-save-general')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-general');
  const btn = document.getElementById('btn-save-general');
  setBtnLoading(btn, true);
  try {
    const body = {
      logo_url: document.getElementById('f-logo-url').value,
      site_name: document.getElementById('f-site-name').value,
      site_name_accent: document.getElementById('f-site-name-accent').value,
      approach_title: document.getElementById('f-approach-title').value,
      why_title: document.getElementById('f-why-title').value,
    };
    const res = await API('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) showMsg(msg, '✅ ' + (data.message || 'Đã lưu'), false);
    else showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
  } catch { showMsg(msg, '❌ Lỗi kết nối', true); }
  finally { setBtnLoading(btn, false); }
});

// ─── Save Title Style ─────────────────────────────────────────
document.getElementById('btn-save-title-style')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-titles');
  const btn = document.getElementById('btn-save-title-style');
  const key = titleSelector.value;
  titleStyles[key] = {
    fontFamily: titleFont.value,
    fontSize: parseInt(titleSize.value),
    fontWeight: parseInt(titleWeight.value),
    color: titleColor.value,
    lineHeight: titleLineHeight.value,
    letterSpacing: titleSpacing.value,
  };
  setBtnLoading(btn, true);
  try {
    const res = await API('/api/admin/title-styles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(titleStyles) });
    if (checkAuth(res)) return;
    if (res.ok) showMsg(msg, '✅ Đã lưu style', false);
    else showMsg(msg, '❌ Lỗi', true);
  } catch { showMsg(msg, '❌ Lỗi kết nối', true); }
  finally { setBtnLoading(btn, false); }
  updateSavedStylesList();
});

document.getElementById('btn-reset-title-style')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-titles');
  const key = titleSelector.value;
  delete titleStyles[key];
  titleFont.value = 'Playfair Display'; titleSize.value = 48; titleWeight.value = 700;
  titleColor.value = '#ffffff'; titleColorText.value = '#ffffff';
  titleLineHeight.value = '1.4'; titleSpacing.value = '0em';
  applyStyleToPreview();
  updateSavedStylesList();
  try {
    const res = await API('/api/admin/title-styles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(titleStyles) });
    if (checkAuth(res)) return;
    if (res.ok) showMsg(msg, '🔄 Đã reset', false);
    else showMsg(msg, '❌ Lỗi lưu', true);
  } catch { showMsg(msg, '❌ Lỗi kết nối', true); }
});

// ─── Save Teacher ──────────────────────────────────────────────
document.getElementById('btn-save-teacher')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-teacher');
  const btn = document.getElementById('btn-save-teacher');
  setBtnLoading(btn, true);

  try {
    const body = {
      teacher_name: document.getElementById('f-teacher-name').value,
      teacher_label: document.getElementById('f-teacher-label').value,
      teacher_bio: document.getElementById('f-teacher-bio').value,
      satisfaction_value: document.getElementById('f-satisfaction-value').value,
      satisfaction_label: document.getElementById('f-satisfaction-label').value,
      teacher_photo: document.getElementById('f-teacher-photo').value,
    };
    const res = await API('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showMsg(msg, '✅ ' + (data.message || 'Đã lưu'), false);
      const preview = document.getElementById('teacher-photo-preview');
      if (preview && body.teacher_photo) { preview.src = body.teacher_photo; preview.style.display = 'block'; }
    } else {
      showMsg(msg, '❌ ' + (data.error || 'Lỗi'), true);
    }
  } catch { showMsg(msg, '❌ Lỗi kết nối', true); }
  finally { setBtnLoading(btn, false); }
});

// ─── Color dots for course form ────────────────────────────────
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
    document.getElementById('course-form-color').value = dot.dataset.color;
  });
});

// ─── Courses & Schedule Button Bindings ───────────────────────
document.getElementById('btn-add-course')?.addEventListener('click', () => openCourseModal(null));
document.getElementById('btn-course-cancel')?.addEventListener('click', closeCourseModal);
document.getElementById('btn-course-save')?.addEventListener('click', saveCourse);
document.getElementById('modal-course')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeCourseModal(); });

document.getElementById('btn-add-schedule')?.addEventListener('click', () => openScheduleModal(null));
document.getElementById('btn-schedule-cancel')?.addEventListener('click', closeScheduleModal);
document.getElementById('btn-schedule-save')?.addEventListener('click', saveSchedule);
document.getElementById('modal-schedule')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeScheduleModal(); });

// ═══════════════════════════════════════════════════════════════
//  REGISTRATIONS
// ═══════════════════════════════════════════════════════════════
async function loadRegistrations() {
  try {
    const res = await API('/api/admin/registrations');
    if (checkAuth(res)) return;
    const data = await res.json();
    const tbody = document.getElementById('registrations-list');
    const empty = document.getElementById('registrations-empty');
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = data.map((r, i) => `
      <tr>
        <td class="text-gray-500">${i+1}</td>
        <td class="text-white font-medium">${escHtml(r.parent_name)}</td>
        <td>${escHtml(r.phone)}</td>
        <td>${escHtml(r.child_name)}</td>
        <td>${escHtml(r.grade)}</td>
        <td class="text-gray-400">${escHtml(r.note||'-')}</td>
        <td class="text-gray-500 text-xs">${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
        <td>
          <button class="status-btn badge ${r.status==='contacted'?'badge-available':'badge-almost'}" data-id="${r.id}" data-status="${r.status}">
            ${r.status==='contacted'?'✅ Đã gọi':'⏳ Chưa liên hệ'}
          </button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status === 'pending' ? 'contacted' : 'pending';
        try {
          const res = await API(`/api/admin/registrations/${btn.dataset.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
          if (checkAuth(res)) return;
          if (res.ok) {
            btn.dataset.status = newStatus;
            btn.className = `status-btn badge ${newStatus==='contacted'?'badge-available':'badge-almost'}`;
            btn.textContent = newStatus === 'contacted' ? '✅ Đã gọi' : '⏳ Chưa liên hệ';
          }
        } catch(e) { console.error(e); }
      });
    });
  } catch(err) { console.error('Lỗi tải đăng ký:', err); }
}

// ═══════════════════════════════════════════════════════════════
//  PASSWORD CHANGE — with strength meter + redirect
// ═══════════════════════════════════════════════════════════════

// Show/hide password toggles
document.querySelectorAll('[data-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.toggle);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// Password strength checker
window.checkPwdStrength = function(pwd) {
  const reqs = {
    len: pwd.length >= 6,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    num: /[0-9]/.test(pwd),
  };

  // Update requirement indicators
  document.querySelectorAll('.pwd-req').forEach(el => {
    const key = el.dataset.req;
    const pass = reqs[key];
    el.querySelector('.req-icon').className = `req-icon ${pass ? 'pass' : 'fail'}`;
    el.querySelector('.req-icon').textContent = pass ? '✓' : '✗';
  });

  // Update strength bar
  const score = Object.values(reqs).filter(Boolean).length;
  const bars = document.querySelectorAll('#pwd-strength .pwd-strength-bar');
  bars.forEach((bar, i) => {
    bar.className = 'pwd-strength-bar';
    if (i < score) {
      bar.classList.add(score <= 2 ? 'weak' : score === 3 ? 'medium' : 'strong');
    }
  });

  return score;
};

// Confirm password match indicator
document.getElementById('pwd-confirm')?.addEventListener('input', function() {
  const newPwd = document.getElementById('pwd-new').value;
  const match = document.getElementById('pwd-match');
  if (!this.value) { match.style.display = 'none'; return; }
  match.style.display = 'block';
  if (this.value === newPwd) {
    match.textContent = '✅ Mật khẩu khớp';
    match.className = 'text-xs mt-1 text-green-400';
  } else {
    match.textContent = '❌ Mật khẩu không khớp';
    match.className = 'text-xs mt-1 text-red-400';
  }
});

// Change password handler
document.getElementById('btn-change-password')?.addEventListener('click', async () => {
  const current = document.getElementById('pwd-current').value;
  const newPwd = document.getElementById('pwd-new').value;
  const confirm = document.getElementById('pwd-confirm').value;
  const errorEl = document.getElementById('pwd-error');
  const btn = document.getElementById('btn-change-password');

  errorEl.style.display = 'none';

  if (!current || !newPwd || !confirm) {
    errorEl.textContent = '❌ Vui lòng điền đầy đủ thông tin';
    errorEl.style.display = 'block';
    return;
  }
  if (newPwd.length < 6) {
    errorEl.textContent = '❌ Mật khẩu mới phải tối thiểu 6 ký tự';
    errorEl.style.display = 'block';
    return;
  }
  if (newPwd !== confirm) {
    errorEl.textContent = '❌ Mật khẩu xác nhận không khớp';
    errorEl.style.display = 'block';
    return;
  }

  setBtnLoading(btn, true);
  try {
    const res = await API('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
    });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      // Clear token and show success overlay
      localStorage.removeItem('admin_token');
      const overlay = document.getElementById('pwd-success-overlay');
      const bar = document.getElementById('pwd-redirect-bar');
      const countdown = document.getElementById('pwd-redirect-countdown');
      overlay.classList.add('show');
      // Animate progress bar
      requestAnimationFrame(() => { bar.style.width = '100%'; });
      // Countdown
      let secs = 3;
      countdown.textContent = secs + 's';
      const timer = setInterval(() => {
        secs--;
        if (secs <= 0) {
          clearInterval(timer);
          window.location.href = 'login.html';
        } else {
          countdown.textContent = secs + 's';
        }
      }, 1000);
    } else {
      errorEl.textContent = '❌ ' + (data.error || 'Lỗi');
      errorEl.style.display = 'block';
    }
  } catch (e) {
    errorEl.textContent = '❌ Lỗi kết nối';
    errorEl.style.display = 'block';
  } finally {
    setBtnLoading(btn, false);
  }
});

// ─── Init ─────────────────────────────────────────────────────
loadData();
