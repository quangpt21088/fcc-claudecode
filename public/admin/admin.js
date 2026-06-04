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
};
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(tabs).forEach(t => { if(t) t.classList.add('hidden'); });
    if(tabs[btn.dataset.tab]) tabs[btn.dataset.tab].classList.remove('hidden');
  });
});

// ─── Load dữ liệu ────────────────────────────────────────────
let allCourses = [];
let allSchedule = [];
let allSettings = {};
let titleStyles = {};

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

    // Teacher photo preview
    const photoPreview = document.getElementById('teacher-photo-preview');
    if(photoPreview && allSettings.teacher_photo){
      photoPreview.src = allSettings.teacher_photo;
      photoPreview.style.display = 'block';
    }

    // Courses
    const coursesRes = await API('/api/admin/courses');
    allCourses = await coursesRes.json() || [];
    renderCourses(allCourses);

    // Schedule
    const schedRes = await API('/api/admin/schedule');
    allSchedule = await schedRes.json() || [];
    renderScheduleTable(allSchedule);

    // Title styles
    try {
      const stylesRes = await API('/api/admin/title-styles');
      titleStyles = await stylesRes.json() || {};
    } catch(e) { titleStyles = {}; }
    updateSavedStylesList();
    applyTitleStylesToPreview();

  } catch (err) { console.error('Lỗi tải dữ liệu:', err); }
}

function esc(s){ return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escHtml(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

// ─── Render Courses ───────────────────────────────────────────
function renderCourses(courses) {
  const container = document.getElementById('courses-list');
  if(!container) return;
  container.innerHTML = courses.map((c, i) => `
    <div class="border rounded-lg p-4 grid md:grid-cols-7 gap-3 items-center ${c.hidden ? 'bg-gray-50 opacity-60' : ''}">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Tên lớp</label>
        <input class="c-name w-full border rounded px-2 py-1 text-sm" value="${esc(c.name)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Tên ngắn</label>
        <input class="c-short w-full border rounded px-2 py-1 text-sm" value="${esc(c.short_name)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Emoji</label>
        <input class="c-emoji w-full border rounded px-2 py-1 text-sm" value="${esc(c.emoji||'📖')}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Màu</label>
        <select class="c-color w-full border rounded px-2 py-1 text-sm" data-idx="${i}">
          <option value="blue" ${c.color==='blue'?'selected':''}>blue</option>
          <option value="green" ${c.color==='green'?'selected':''}>green</option>
          <option value="purple" ${c.color==='purple'?'selected':''}>purple</option>
          <option value="orange" ${c.color==='orange'?'selected':''}>orange</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle"><input type="checkbox" class="c-status" data-idx="${i}" ${c.status==='available'?'checked':''}><span class="slider"></span></label>
        <span class="text-xs text-gray-500 c-status-label">${c.status==='available'?'Còn chỗ':'Hết chỗ'}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle"><input type="checkbox" class="c-visible" data-idx="${i}" ${!c.hidden?'checked':''}><span class="slider"></span></label>
        <span class="text-xs text-gray-500 c-visible-label">${c.hidden?'Đang ẩn':'Hiển thị'}</span>
      </div>
      <div class="text-xs text-gray-400">ID: ${c.id}</div>
    </div>
  `).join('');

  container.querySelectorAll('.c-status').forEach(cb => {
    cb.addEventListener('change', () => { cb.closest('.flex').querySelector('.c-status-label').textContent = cb.checked ? 'Còn chỗ' : 'Hết chỗ'; });
  });
  container.querySelectorAll('.c-visible').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.c-visible-label');
      const row = cb.closest('.border');
      if(cb.checked){ label.textContent='Hiển thị'; row.classList.remove('bg-gray-50','opacity-60'); }
      else { label.textContent='Đang ẩn'; row.classList.add('bg-gray-50','opacity-60'); }
    });
  });
}

// ─── Render Schedule ──────────────────────────────────────────
function renderScheduleTable(items) {
  const container = document.getElementById('schedule-list');
  if(!container) return;
  container.innerHTML = items.map((s, i) => `
    <div class="border rounded-lg p-4 grid md:grid-cols-6 gap-3 items-center ${s.hidden ? 'bg-gray-50 opacity-60' : ''}">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Lớp</label>
        <input class="s-class w-full border rounded px-2 py-1 text-sm" value="${esc(s.class_name)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Thời gian</label>
        <input class="s-time w-full border rounded px-2 py-1 text-sm" value="${esc(s.time_slot)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Ngày học</label>
        <input class="s-days w-full border rounded px-2 py-1 text-sm" value="${esc(s.days)}" data-idx="${i}">
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle"><input type="checkbox" class="s-status" data-idx="${i}" ${s.status==='available'?'checked':''}><span class="slider"></span></label>
        <span class="text-xs text-gray-500 s-status-label">${s.status==='available'?'Còn chỗ':'Hết chỗ'}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle"><input type="checkbox" class="s-visible" data-idx="${i}" ${!s.hidden?'checked':''}><span class="slider"></span></label>
        <span class="text-xs text-gray-500 s-visible-label">${s.hidden?'Đang ẩn':'Hiển thị'}</span>
      </div>
      <div class="text-xs text-gray-400">ID: ${s.id}</div>
    </div>
  `).join('');

  container.querySelectorAll('.s-status').forEach(cb => {
    cb.addEventListener('change', () => { cb.closest('.flex').querySelector('.s-status-label').textContent = cb.checked ? 'Còn chỗ' : 'Hết chỗ'; });
  });
  container.querySelectorAll('.s-visible').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.s-visible-label');
      const row = cb.closest('.border');
      if(cb.checked){ label.textContent='Hiển thị'; row.classList.remove('bg-gray-50','opacity-60'); }
      else { label.textContent='Đang ẩn'; row.classList.add('bg-gray-50','opacity-60'); }
    });
  });
}

// ─── Title Style Editor ───────────────────────────────────────
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

// ─── Save handlers ────────────────────────────────────────────
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
    const data = await res.json();
    msg.classList.remove('text-red-600','text-green-600');
    if(res.ok){ msg.classList.add('text-green-600'); msg.textContent = '✅ ' + (data.message||'Đã lưu'); }
    else if(res.status===401){ localStorage.removeItem('admin_token'); window.location.href='login.html'; }
    else { msg.classList.add('text-red-600'); msg.textContent = '❌ ' + (data.error||'Lỗi'); }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  finally { btn.textContent = '💾 Lưu nội dung'; btn.disabled = false; }
});

// Save title style
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
    if(res.ok){ msg.classList.remove('text-red-600'); msg.classList.add('text-green-600'); msg.textContent = '✅ Đã lưu style'; }
    else { msg.classList.remove('text-green-600'); msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi'; }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  updateSavedStylesList();
});

// Reset title style
document.getElementById('btn-reset-title-style')?.addEventListener('click', () => {
  const key = titleSelector.value;
  delete titleStyles[key];
  titleFont.value = 'Inter'; titleSize.value = 48; titleWeight.value = 700;
  titleColor.value = '#ffffff'; titleColorText.value = '#ffffff';
  titleLineHeight.value = '1.4'; titleSpacing.value = '0em';
  applyStyleToPreview();
  updateSavedStylesList();
  const msg = document.getElementById('msg-titles');
  msg.classList.remove('text-red-600'); msg.classList.add('text-green-600');
  msg.textContent = '🔄 Đã reset';
});

// Save teacher
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
    const data = await res.json();
    msg.classList.remove('text-red-600','text-green-600');
    if(res.ok){
      msg.classList.add('text-green-600'); msg.textContent = '✅ ' + (data.message||'Đã lưu');
      const preview = document.getElementById('teacher-photo-preview');
      if(preview && photoUrl){ preview.src = photoUrl; preview.style.display='block'; }
    }
    else if(res.status===401){ localStorage.removeItem('admin_token'); window.location.href='login.html'; }
    else { msg.classList.add('text-red-600'); msg.textContent = '❌ ' + (data.error||'Lỗi'); }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  finally { btn.textContent = '💾 Lưu giáo viên'; btn.disabled = false; }
});

// Save courses
document.getElementById('btn-save-courses')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-courses');
  const btn = document.getElementById('btn-save-courses');
  btn.textContent = 'Đang lưu...'; btn.disabled = true;

  const courses = allCourses.map((c, i) => ({
    id: c.id,
    name: document.querySelector(`.c-name[data-idx="${i}"]`)?.value || c.name,
    short_name: document.querySelector(`.c-short[data-idx="${i}"]`)?.value || c.short_name,
    emoji: document.querySelector(`.c-emoji[data-idx="${i}"]`)?.value || c.emoji,
    color: document.querySelector(`.c-color[data-idx="${i}"]`)?.value || c.color,
    status: document.querySelector(`.c-status[data-idx="${i}"]`)?.checked ? 'available' : 'full',
    hidden: !document.querySelector(`.c-visible[data-idx="${i}"]`)?.checked,
  }));

  try {
    const res = await API('/api/admin/courses', { method: 'PUT', body: JSON.stringify({ courses }) });
    const data = await res.json();
    msg.classList.remove('text-red-600','text-green-600');
    if(res.ok){ msg.classList.add('text-green-600'); msg.textContent = '✅ ' + (data.message||'Đã lưu'); }
    else if(res.status===401){ localStorage.removeItem('admin_token'); window.location.href='login.html'; }
    else { msg.classList.add('text-red-600'); msg.textContent = '❌ ' + (data.error||'Lỗi'); }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  finally { btn.textContent = '💾 Lưu khóa học'; btn.disabled = false; }
});

// Save schedule
document.getElementById('btn-save-schedule')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-schedule');
  const btn = document.getElementById('btn-save-schedule');
  btn.textContent = 'Đang lưu...'; btn.disabled = true;

  const items = allSchedule.map((s, i) => ({
    id: s.id,
    class_name: document.querySelector(`.s-class[data-idx="${i}"]`)?.value || s.class_name,
    time_slot: document.querySelector(`.s-time[data-idx="${i}"]`)?.value || s.time_slot,
    days: document.querySelector(`.s-days[data-idx="${i}"]`)?.value || s.days,
    status: document.querySelector(`.s-status[data-idx="${i}"]`)?.checked ? 'available' : 'full',
    hidden: !document.querySelector(`.s-visible[data-idx="${i}"]`)?.checked,
  }));

  try {
    const res = await API('/api/admin/schedule', { method: 'PUT', body: JSON.stringify({ items }) });
    const data = await res.json();
    msg.classList.remove('text-red-600','text-green-600');
    if(res.ok){ msg.classList.add('text-green-600'); msg.textContent = '✅ ' + (data.message||'Đã lưu'); }
    else if(res.status===401){ localStorage.removeItem('admin_token'); window.location.href='login.html'; }
    else { msg.classList.add('text-red-600'); msg.textContent = '❌ ' + (data.error||'Lỗi'); }
  } catch { msg.classList.add('text-red-600'); msg.textContent = '❌ Lỗi kết nối'; }
  finally { btn.textContent = '💾 Lưu lịch học'; btn.disabled = false; }
});

// ─── Registrations ────────────────────────────────────────────
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

// ─── Init ─────────────────────────────────────────────────────
loadData();
tabBtns.forEach(btn => { btn.addEventListener('click', () => { if(btn.dataset.tab==='registrations') loadRegistrations(); }); });
