// ─── Auth check ───────────────────────────────────────────────
const TOKEN = localStorage.getItem('admin_token');
if (!TOKEN) { window.location.href = 'login.html'; }

const API = (path, opts = {}) =>
  fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}`, ...opts.headers },
  });

// ─── Logout ───────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  window.location.href = 'login.html';
});

// ─── Tabs ─────────────────────────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const tabs = {
  content: document.getElementById('tab-content'),
  titles: document.getElementById('tab-titles'),
  teacher: document.getElementById('tab-teacher'),
  courses: document.getElementById('tab-courses'),
  schedule: document.getElementById('tab-schedule'),
  registrations: document.getElementById('tab-registrations'),
  password: document.getElementById('tab-password'),
};
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(tabs).forEach(t => { if(t) t.classList.add('hidden'); });
    if(tabs[btn.dataset.tab]) tabs[btn.dataset.tab].classList.remove('hidden');
  });
});

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
  el.classList.remove('text-red-600','text-green-600');
  el.classList.add(isError ? 'text-red-600' : 'text-green-600');
  el.textContent = text;
}

// ─── State ────────────────────────────────────────────────────
let allCourses = [];
let allSchedule = [];
let allSettings = {};
let titleStyles = {};

// ─── Load dữ liệu ────────────────────────────────────────────
async function loadData() {
  try {
    const settingsRes = await API('/api/admin/settings');
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

    const photoPreview = document.getElementById('teacher-photo-preview');
    if(photoPreview && allSettings.teacher_photo){
      photoPreview.src = allSettings.teacher_photo;
      photoPreview.style.display = 'block';
    }

    // Load courses
    const coursesRes = await API('/api/admin/courses');
    allCourses = await coursesRes.json() || [];
    renderCourses();

    // Load schedule
    const schedRes = await API('/api/admin/schedule');
    allSchedule = await schedRes.json() || [];
    renderSchedule();

    // Title styles
    try {
      const stylesRes = await API('/api/admin/title-styles');
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
  if(!container) return;

  if(allCourses.length === 0){
    container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Chưa có khóa học nào. Nhấn "Thêm khóa học" để tạo.</p>';
    return;
  }

  container.innerHTML = allCourses.map((c) => {
    const hiddenClass = c.hidden ? 'bg-gray-50 opacity-60' : '';
    const statusBadge = c.status === 'available'
      ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Còn chỗ</span>'
      : '<span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Hết chỗ</span>';
    const hiddenBadge = c.hidden
      ? '<span class="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">Đang ẩn</span>'
      : '<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Hiển thị</span>';

    // Count schedules for this course
    const schedCount = allSchedule.filter(s => s.course_id === c.id).length;

    return `
    <div class="border rounded-lg p-4 ${hiddenClass}" data-course-id="${c.id}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">${esc(c.emoji||'📖')}</span>
            <span class="font-bold text-gray-800 truncate">${esc(c.name)}</span>
            ${statusBadge}
            ${hiddenBadge}
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span>${esc(c.short_name||'')}</span>
            <span>🎨 ${c.color||'blue'}</span>
            <span>🕐 ${esc(c.duration||'')}</span>
            <span>👥 ${esc(c.max_students||'')}</span>
            <span>📅 ${schedCount} lịch học</span>
          </div>
          ${c.sub ? `<p class="text-xs text-gray-400 mt-0.5">${esc(c.sub)}</p>` : ''}
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="btn-edit-course px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" data-id="${c.id}">✏️ Sửa</button>
          <button class="btn-del-course px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100" data-id="${c.id}">🗑️ Xóa</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Bind events
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

  if(isEdit) {
    const c = allCourses.find(x => x.id === courseId);
    if(!c) return;
    document.getElementById('course-form-id').value = c.id;
    document.getElementById('course-form-name').value = c.name || '';
    document.getElementById('course-form-short').value = c.short_name || '';
    document.getElementById('course-form-emoji').value = c.emoji || '📖';
    document.getElementById('course-form-color').value = c.color || 'blue';
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
    document.getElementById('course-form-name').value = '';
    document.getElementById('course-form-short').value = '';
    document.getElementById('course-form-emoji').value = '📖';
    document.getElementById('course-form-color').value = 'blue';
    document.getElementById('course-form-sub').value = '';
    document.getElementById('course-form-desc').value = '';
    document.getElementById('course-form-features').value = '';
    document.getElementById('course-form-duration').value = '2h/buổi';
    document.getElementById('course-form-max').value = 'Tối đa 10';
    document.getElementById('course-form-sessions').value = '2 buổi/tuần';
    document.getElementById('course-form-price').value = '';
    document.getElementById('course-form-status').value = 'available';
    document.getElementById('course-form-hidden').checked = false;
    document.getElementById('course-form-sort').value = allCourses.length;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeCourseModal() {
  const modal = document.getElementById('modal-course');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function saveCourse() {
  const msg = document.getElementById('msg-courses');
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

  if(!body.name) { showMsg(msg, '❌ Tên khóa học là bắt buộc', true); return; }

  try {
    let res;
    if(id) {
      // UPDATE
      res = await API(`/api/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      // CREATE
      res = await API('/api/admin/courses', { method: 'POST', body: JSON.stringify(body) });
    }
    if(checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if(res.ok) {
      showMsg(msg, '✅ ' + (data.message || 'Đã lưu'), false);
      closeCourseModal();
      // Reload
      const coursesRes = await API('/api/admin/courses');
      allCourses = await coursesRes.json() || [];
      renderCourses();
      // Also reload schedule in case cascade happened
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

async function deleteCourse(id) {
  const msg = document.getElementById('msg-courses');
  const c = allCourses.find(x => x.id === id);
  if(!c) return;

  const schedCount = allSchedule.filter(s => s.course_id === id).length;
  let confirmMsg = `Xóa khóa học "${c.name}"?`;
  if(schedCount > 0) confirmMsg += `\n⚠️ ${schedCount} lịch học liên quan cũng sẽ bị xóa!`;

  if(!confirm(confirmMsg)) return;

  try {
    const res = await API(`/api/admin/courses/${id}`, { method: 'DELETE' });
    if(checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if(res.ok) {
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
  if(!container) return;

  if(allSchedule.length === 0){
    container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Chưa có lịch học nào. Nhấn "Thêm lịch học" để tạo.</p>';
    return;
  }

  container.innerHTML = allSchedule.map((s) => {
    const hiddenClass = s.hidden ? 'bg-gray-50 opacity-60' : '';
    const course = allCourses.find(c => c.id === s.course_id);
    const courseName = course ? course.name : '(không rõ)';
    const statusColors = {
      available: 'bg-green-100 text-green-700',
      almost_full: 'bg-yellow-100 text-yellow-700',
      full: 'bg-red-100 text-red-700',
    };
    const statusClass = statusColors[s.status] || statusColors.available;
    const hiddenBadge = s.hidden
      ? '<span class="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">Đang ẩn</span>'
      : '<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Hiển thị</span>';

    return `
    <div class="border rounded-lg p-4 ${hiddenClass}" data-schedule-id="${s.id}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold text-gray-800">${esc(s.class_name)}</span>
            <span class="px-2 py-0.5 ${statusClass} text-xs font-semibold rounded-full">${esc(s.status_text||'🟢 Còn chỗ')}</span>
            ${hiddenBadge}
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span>📚 ${esc(courseName)}</span>
            <span>🕐 ${esc(s.time_slot||'')}</span>
            <span>📅 ${esc(s.days||'')}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="btn-edit-schedule px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" data-id="${s.id}">✏️ Sửa</button>
          <button class="btn-del-schedule px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100" data-id="${s.id}">🗑️ Xóa</button>
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

  // Populate course dropdown
  const courseSelect = document.getElementById('schedule-form-course');
  courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>' +
    allCourses.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

  if(isEdit) {
    const s = allSchedule.find(x => x.id === scheduleId);
    if(!s) return;
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
    document.getElementById('schedule-form-course').value = '';
    document.getElementById('schedule-form-name').value = '';
    document.getElementById('schedule-form-time').value = '';
    document.getElementById('schedule-form-days').value = '';
    document.getElementById('schedule-form-status').value = 'available';
    document.getElementById('schedule-form-statustext').value = '🟢 Còn chỗ';
    document.getElementById('schedule-form-hidden').checked = false;
    document.getElementById('schedule-form-sort').value = allSchedule.length;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeScheduleModal() {
  const modal = document.getElementById('modal-schedule');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function saveSchedule() {
  const msg = document.getElementById('msg-schedule');
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

  if(!body.class_name) { showMsg(msg, '❌ Tên lớp là bắt buộc', true); return; }

  try {
    let res;
    if(id) {
      res = await API(`/api/admin/schedule/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      res = await API('/api/admin/schedule', { method: 'POST', body: JSON.stringify(body) });
    }
    if(checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if(res.ok) {
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
  }
}

async function deleteSchedule(id) {
  const msg = document.getElementById('msg-schedule');
  const s = allSchedule.find(x => x.id === id);
  if(!s) return;

  if(!confirm(`Xóa lịch học "${s.class_name}"?`)) return;

  try {
    const res = await API(`/api/admin/schedule/${id}`, { method: 'DELETE' });
    if(checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if(res.ok) {
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
//  TITLE STYLE EDITOR (giữ nguyên)
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
  if(!titlePreview) return;
  titlePreview.style.fontFamily = titleFont.value;
  titlePreview.style.fontSize = titleSize.value + 'px';
  titlePreview.style.fontWeight = titleWeight.value;
  titlePreview.style.color = titleColor.value;
  titlePreview.style.lineHeight = titleLineHeight.value;
  titlePreview.style.letterSpacing = titleSpacing.value;
}

[titleFont, titleSize, titleWeight, titleColor, titleLineHeight, titleSpacing].forEach(el => {
  if(el) el.addEventListener('change', applyStyleToPreview);
  if(el) el.addEventListener('input', applyStyleToPreview);
});
if(titleColorText) titleColorText.addEventListener('input', () => { titleColor.value = titleColorText.value; applyStyleToPreview(); });
if(titleColor) titleColor.addEventListener('input', () => { titleColorText.value = titleColor.value; applyStyleToPreview(); });

if(titleSelector) titleSelector.addEventListener('change', () => {
  const key = titleSelector.value;
  const style = titleStyles[key] || {};
  titleFont.value = style.fontFamily || 'Inter';
  titleSize.value = style.fontSize || 48;
  titleWeight.value = style.fontWeight || 700;
  titleColor.value = style.color || '#ffffff';
  titleColorText.value = style.color || '#ffffff';
  titleLineHeight.value = style.lineHeight || '1.4';
  titleSpacing.value = style.letterSpacing || '0em';
  applyStyleToPreview();
});

function applyTitleStylesToPreview() {
  if(!titlePreview) return;
  const key = titleSelector ? titleSelector.value : 'hero-title1';
  const style = titleStyles[key] || {};
  titlePreview.style.fontFamily = style.fontFamily || 'Inter';
  titlePreview.style.fontSize = (style.fontSize || 48) + 'px';
  titlePreview.style.fontWeight = style.fontWeight || 700;
  titlePreview.style.color = style.color || '#ffffff';
  titlePreview.style.lineHeight = style.lineHeight || '1.4';
  titlePreview.style.letterSpacing = style.letterSpacing || '0em';
}

function updateSavedStylesList() {
  const list = document.getElementById('saved-styles-list');
  if(!list) return;
  const keys = Object.keys(titleStyles);
  if(keys.length === 0){ list.innerHTML = '<p class="text-gray-400 text-xs">Chưa có style nào được lưu.</p>'; return; }
  list.innerHTML = keys.map(k => {
    const s = titleStyles[k];
    return `<div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
      <span class="w-4 h-4 rounded" style="background:${s.color||'#fff'}"></span>
      <span class="font-medium">${k}</span>
      <span class="text-gray-400 text-xs">${s.fontSize||48}px ${s.fontWeight||700} ${s.fontFamily||'Inter'}</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  SAVE HANDLERS (giữ nguyên cho content, teacher, titles)
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-save-content')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-content');
  const btn = document.getElementById('btn-save-content');
  btn.textContent = 'Đang lưu...'; btn.disabled = true;
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
    const res = await API('/api/admin/content', { method: 'PUT', body: JSON.stringify(body) });
    if(checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    msg.classList.remove('text-red-600','text-green-600');
    if(res.ok){ msg.classList.add('text-green-600'); msg.textContent = '✅ ' + (data.message||'Đã lưu'); }
    else { msg.classList.add('text-red-600'); msg.textContent = '❌ ' + (data.error||'Lỗi'); }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  finally { btn.textContent = '💾 Lưu nội dung'; btn.disabled = false; }
});

document.getElementById('btn-save-title-style')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-titles');
  const key = titleSelector.value;
  titleStyles[key] = {
    fontFamily: titleFont.value,
    fontSize: parseInt(titleSize.value),
    fontWeight: parseInt(titleWeight.value),
    color: titleColor.value,
    lineHeight: titleLineHeight.value,
    letterSpacing: titleSpacing.value,
  };
  try {
    const res = await API('/api/admin/title-styles', { method: 'PUT', body: JSON.stringify(titleStyles) });
    if(checkAuth(res)) return;
    if(res.ok){ msg.classList.remove('text-red-600'); msg.classList.add('text-green-600'); msg.textContent = '✅ Đã lưu style'; }
    else { msg.classList.remove('text-green-600'); msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi'; }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  updateSavedStylesList();
});

document.getElementById('btn-reset-title-style')?.addEventListener('click', async () => {
  const key = titleSelector.value;
  delete titleStyles[key];
  titleFont.value = 'Inter'; titleSize.value = 48; titleWeight.value = 700;
  titleColor.value = '#ffffff'; titleColorText.value = '#ffffff';
  titleLineHeight.value = '1.4'; titleSpacing.value = '0em';
  applyStyleToPreview();
  updateSavedStylesList();
  const msg = document.getElementById('msg-titles');
  // Lưu lên server để F5 vẫn giữ trạng thái reset
  try {
    const res = await API('/api/admin/title-styles', { method: 'PUT', body: JSON.stringify(titleStyles) });
    if(checkAuth(res)) return;
    if(res.ok){ msg.classList.remove('text-red-600'); msg.classList.add('text-green-600'); msg.textContent = '🔄 Đã reset'; }
    else { msg.classList.remove('text-green-600'); msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi lưu'; }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
});

document.getElementById('btn-save-teacher')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-teacher');
  const btn = document.getElementById('btn-save-teacher');
  btn.textContent = 'Đang lưu...'; btn.disabled = true;

  let photoUrl = document.getElementById('f-teacher-photo').value;
  const fileInput = document.getElementById('f-teacher-photo-file');
  if(fileInput && fileInput.files[0]){
    const file = fileInput.files[0];
    if(file.size > 2*1024*1024){ msg.classList.add('text-red-600'); msg.textContent = '❌ ảnh quá lớn (tối đa 2MB)'; btn.disabled=false; btn.textContent='💾 Lưu giáo viên'; return; }
    try {
      const base64 = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      photoUrl = base64;
    } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi đọc file'; btn.disabled=false; btn.textContent='💾 Lưu giáo viên'; return; }
  }

  try {
    const body = {
      teacher_name: document.getElementById('f-teacher-name').value,
      teacher_label: document.getElementById('f-teacher-label').value,
      teacher_bio: document.getElementById('f-teacher-bio').value,
      satisfaction_value: document.getElementById('f-satisfaction-value').value,
      satisfaction_label: document.getElementById('f-satisfaction-label').value,
      teacher_photo: photoUrl,
    };
    const res = await API('/api/admin/content', { method: 'PUT', body: JSON.stringify(body) });
    if(checkAuth(res)) { btn.textContent = '💾 Lưu giáo viên'; btn.disabled = false; return; }
    const data = await res.json().catch(() => ({}));
    msg.classList.remove('text-red-600','text-green-600');
    if(res.ok){
      msg.classList.add('text-green-600'); msg.textContent = '✅ ' + (data.message||'Đã lưu');
      const preview = document.getElementById('teacher-photo-preview');
      if(preview && photoUrl){ preview.src = photoUrl; preview.style.display='block'; }
    }
    else { msg.classList.add('text-red-600'); msg.textContent = '❌ ' + (data.error||'Lỗi'); }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  finally { btn.textContent = '💾 Lưu giáo viên'; btn.disabled = false; }
});

// ═══════════════════════════════════════════════════════════════
//  COURSES & SCHEDULE BUTTON BINDINGS
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-add-course')?.addEventListener('click', () => openCourseModal(null));
document.getElementById('btn-course-cancel')?.addEventListener('click', closeCourseModal);
document.getElementById('btn-course-save')?.addEventListener('click', saveCourse);
document.getElementById('modal-course')?.addEventListener('click', (e) => { if(e.target === e.currentTarget) closeCourseModal(); });

document.getElementById('btn-add-schedule')?.addEventListener('click', () => openScheduleModal(null));
document.getElementById('btn-schedule-cancel')?.addEventListener('click', closeScheduleModal);
document.getElementById('btn-schedule-save')?.addEventListener('click', saveSchedule);
document.getElementById('modal-schedule')?.addEventListener('click', (e) => { if(e.target === e.currentTarget) closeScheduleModal(); });

// ═══════════════════════════════════════════════════════════════
//  REGISTRATIONS (giữ nguyên)
// ═══════════════════════════════════════════════════════════════
async function loadRegistrations() {
  try {
    const res = await API('/api/admin/registrations');
    const data = await res.json();
    const tbody = document.getElementById('registrations-list');
    if(!Array.isArray(data) || data.length === 0){ tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">Chưa có đăng ký nào</td></tr>'; return; }
    tbody.innerHTML = data.map((r, i) => `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-gray-400">${i+1}</td>
        <td class="px-3 py-2 font-medium">${escHtml(r.parent_name)}</td>
        <td class="px-3 py-2">${escHtml(r.phone)}</td>
        <td class="px-3 py-2">${escHtml(r.child_name)}</td>
        <td class="px-3 py-2">${escHtml(r.grade)}</td>
        <td class="px-3 py-2 text-gray-500">${escHtml(r.note||'-')}</td>
        <td class="px-3 py-2 text-gray-400 text-xs">${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
        <td class="px-3 py-2">
          <button class="status-btn px-3 py-1 rounded-full text-xs font-semibold ${r.status==='contacted'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}" data-id="${r.id}" data-status="${r.status}">
            ${r.status==='contacted'?'✅ Đã gọi':'⏳ Chưa liên hệ'}
          </button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status==='pending' ? 'contacted' : 'pending';
        try {
          const res = await API(`/api/admin/registrations/${btn.dataset.id}`, { method:'PUT', body: JSON.stringify({status:newStatus}) });
          if(res.ok){ btn.dataset.status=newStatus; btn.className=`status-btn px-3 py-1 rounded-full text-xs font-semibold ${newStatus==='contacted'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`; btn.textContent=newStatus==='contacted'?'✅ Đã gọi':'⏳ Chưa liên hệ'; }
        } catch(e){ console.error(e); }
      });
    });
  } catch(err){ console.error('Lỗi tải đăng ký:', err); }
}

// ─── Đổi mật khẩu ─────────────────────────────────────────────
document.getElementById('btn-change-password')?.addEventListener('click', async () => {
  const current = document.getElementById('pwd-current').value;
  const newPwd = document.getElementById('pwd-new').value;
  const confirm = document.getElementById('pwd-confirm').value;
  const errorEl = document.getElementById('pwd-error');
  const successEl = document.getElementById('pwd-success');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  if (!current || !newPwd || !confirm) {
    errorEl.textContent = '❌ Vui lòng điền đầy đủ thông tin';
    errorEl.classList.remove('hidden');
    return;
  }
  if (newPwd.length < 6) {
    errorEl.textContent = '❌ Mật khẩu mới phải tối thiểu 6 ký tự';
    errorEl.classList.remove('hidden');
    return;
  }
  if (newPwd !== confirm) {
    errorEl.textContent = '❌ Mật khẩu xác nhận không khớp';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const res = await API('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
    });
    if (checkAuth(res)) return;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      successEl.textContent = '✅ ' + (data.message || 'Đã đổi mật khẩu thành công');
      successEl.classList.remove('hidden');
      document.getElementById('pwd-current').value = '';
      document.getElementById('pwd-new').value = '';
      document.getElementById('pwd-confirm').value = '';
    } else {
      errorEl.textContent = '❌ ' + (data.error || 'Lỗi');
      errorEl.classList.remove('hidden');
    }
  } catch (e) {
    errorEl.textContent = '❌ Lỗi kết nối';
    errorEl.classList.remove('hidden');
  }
});

// ─── Init ─────────────────────────────────────────────────────
loadData();
tabBtns.forEach(btn => { btn.addEventListener('click', () => { if(btn.dataset.tab==='registrations') loadRegistrations(); }); });
