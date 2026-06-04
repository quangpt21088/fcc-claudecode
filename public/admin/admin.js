// ─── Auth check ───────────────────────────────────────────────
const TOKEN = localStorage.getItem('admin_token');
if (!TOKEN) {
  window.location.href = 'login.html';
}

const API = (path, opts = {}) =>
  fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      ...opts.headers,
    },
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
  courses: document.getElementById('tab-courses'),
  schedule: document.getElementById('tab-schedule'),
  registrations: document.getElementById('tab-registrations'),
};

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(tabs).forEach(t => t.classList.add('hidden'));
    tabs[btn.dataset.tab].classList.remove('hidden');
  });
});

// ─── Load dữ liệu ────────────────────────────────────────────
let allCourses = [];
let allSchedule = [];

async function loadData() {
  try {
    // Settings
    const settingsRes = await API('/api/admin/settings');
    const S = await settingsRes.json();

    // Fill form nội dung
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val||''; };
    setVal('f-hero-title', S.hero_title1);
    setVal('f-hero-subtitle', S.hero_title2);
    setVal('f-stat-years', S.hero_stat1_value);
    setVal('f-stat-students', S.hero_stat2_value);
    setVal('f-stat-rating', S.hero_stat3_value);
    setVal('f-teacher-name', S.teacher_name);
    setVal('f-teacher-bio', S.teacher_bio);

    // Courses (tất cả, kể cả ẩn)
    const coursesRes = await API('/api/admin/courses');
    allCourses = await coursesRes.json() || [];
    renderCourses(allCourses);

    // Schedule (tất cả, kể cả ẩn)
    const schedRes = await API('/api/admin/schedule');
    allSchedule = await schedRes.json() || [];
    renderScheduleTable(allSchedule);

  } catch (err) {
    console.error('Lỗi tải dữ liệu:', err);
  }
}

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
        <input class="c-emoji w-full border rounded px-2 py-1 text-sm" value="${esc(c.emoji)}" data-idx="${i}">
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
        <label class="toggle">
          <input type="checkbox" class="c-status" data-idx="${i}" ${c.status === 'available' ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="text-xs text-gray-500 c-status-label">${c.status === 'available' ? 'Còn chỗ' : 'Hết chỗ'}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle">
          <input type="checkbox" class="c-visible" data-idx="${i}" ${!c.hidden ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="text-xs text-gray-500 c-visible-label">${c.hidden ? 'Đang ẩn' : 'Hiển thị'}</span>
      </div>
      <div class="text-xs text-gray-400">ID: ${c.id}</div>
    </div>
  `).join('');

  // Toggle status
  container.querySelectorAll('.c-status').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.c-status-label');
      label.textContent = cb.checked ? 'Còn chỗ' : 'Hết chỗ';
    });
  });

  // Toggle visible
  container.querySelectorAll('.c-visible').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.c-visible-label');
      const row = cb.closest('.border');
      if (cb.checked) {
        label.textContent = 'Hiển thị';
        row.classList.remove('bg-gray-50', 'opacity-60');
      } else {
        label.textContent = 'Đang ẩn';
        row.classList.add('bg-gray-50', 'opacity-60');
      }
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
        <label class="toggle">
          <input type="checkbox" class="s-status" data-idx="${i}" ${s.status === 'available' ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="text-xs text-gray-500 s-status-label">${s.status === 'available' ? 'Còn chỗ' : 'Hết chỗ'}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle">
          <input type="checkbox" class="s-visible" data-idx="${i}" ${!s.hidden ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="text-xs text-gray-500 s-visible-label">${s.hidden ? 'Đang ẩn' : 'Hiển thị'}</span>
      </div>
      <div class="text-xs text-gray-400">ID: ${s.id}</div>
    </div>
  `).join('');

  container.querySelectorAll('.s-status').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.s-status-label');
      label.textContent = cb.checked ? 'Còn chỗ' : 'Hết chỗ';
    });
  });

  container.querySelectorAll('.s-visible').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.s-visible-label');
      const row = cb.closest('.border');
      if (cb.checked) {
        label.textContent = 'Hiển thị';
        row.classList.remove('bg-gray-50', 'opacity-60');
      } else {
        label.textContent = 'Đang ẩn';
        row.classList.add('bg-gray-50', 'opacity-60');
      }
    });
  });
}

// ─── Lưu nội dung (settings) ──────────────────────────────────
document.getElementById('btn-save-content').addEventListener('click', async () => {
  const msg = document.getElementById('msg-content');
  const btn = document.getElementById('btn-save-content');
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;

  try {
    const res = await API('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({
        hero_title1: document.getElementById('f-hero-title').value,
        hero_title2: document.getElementById('f-hero-subtitle').value,
        hero_stat1_value: document.getElementById('f-stat-years').value,
        hero_stat2_value: document.getElementById('f-stat-students').value,
        hero_stat3_value: document.getElementById('f-stat-rating').value,
        teacher_name: document.getElementById('f-teacher-name').value,
        teacher_bio: document.getElementById('f-teacher-bio').value,
      }),
    });
    const data = await res.json();
    msg.classList.remove('text-red-600', 'text-green-600');
    if (res.ok) {
      msg.classList.add('text-green-600');
      msg.textContent = '✅ ' + (data.message || 'Đã lưu');
    } else if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = 'login.html';
    } else {
      msg.classList.add('text-red-600');
      msg.textContent = '❌ ' + (data.error || 'Lưu thất bại');
    }
  } catch {
    msg.classList.remove('hidden');
    msg.classList.add('text-red-600');
    msg.textContent = '❌ Không thể kết nối server';
  } finally {
    btn.textContent = '💾 Cập nhật trang chủ';
    btn.disabled = false;
  }
});

// ─── Lưu khóa học ────────────────────────────────────────────
document.getElementById('btn-save-courses')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-courses');
  const btn = document.getElementById('btn-save-courses');
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;

  const courses = allCourses.map((c, i) => ({
    id: c.id,
    name: document.querySelector(`.c-name[data-idx="${i}"]`).value,
    short_name: document.querySelector(`.c-short[data-idx="${i}"]`).value,
    emoji: document.querySelector(`.c-emoji[data-idx="${i}"]`).value,
    color: document.querySelector(`.c-color[data-idx="${i}"]`).value,
    status: document.querySelector(`.c-status[data-idx="${i}"]`).checked ? 'available' : 'full',
    hidden: !document.querySelector(`.c-visible[data-idx="${i}"]`).checked,
  }));

  try {
    const res = await API('/api/admin/courses', {
      method: 'PUT',
      body: JSON.stringify({ courses }),
    });
    const data = await res.json();
    msg.classList.remove('text-red-600', 'text-green-600');
    if (res.ok) {
      msg.classList.add('text-green-600');
      msg.textContent = '✅ ' + (data.message || 'Đã lưu');
    } else if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = 'login.html';
    } else {
      msg.classList.add('text-red-600');
      msg.textContent = '❌ ' + (data.error || 'Lưu thất bại');
    }
  } catch {
    msg.classList.add('text-red-600');
    msg.textContent = '❌ Không thể kết nối server';
  } finally {
    btn.textContent = '💾 Lưu khóa học';
    btn.disabled = false;
  }
});

// ─── Lưu lịch học ────────────────────────────────────────────
document.getElementById('btn-save-schedule')?.addEventListener('click', async () => {
  const msg = document.getElementById('msg-schedule');
  const btn = document.getElementById('btn-save-schedule');
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;

  const items = allSchedule.map((s, i) => ({
    id: s.id,
    class_name: document.querySelector(`.s-class[data-idx="${i}"]`).value,
    time_slot: document.querySelector(`.s-time[data-idx="${i}"]`).value,
    days: document.querySelector(`.s-days[data-idx="${i}"]`).value,
    status: document.querySelector(`.s-status[data-idx="${i}"]`).checked ? 'available' : 'full',
    hidden: !document.querySelector(`.s-visible[data-idx="${i}"]`).checked,
  }));

  try {
    const res = await API('/api/admin/schedule', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    msg.classList.remove('text-red-600', 'text-green-600');
    if (res.ok) {
      msg.classList.add('text-green-600');
      msg.textContent = '✅ ' + (data.message || 'Đã lưu');
    } else if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = 'login.html';
    } else {
      msg.classList.add('text-red-600');
      msg.textContent = '❌ ' + (data.error || 'Lưu thất bại');
    }
  } catch {
    msg.classList.add('text-red-600');
    msg.textContent = '❌ Không thể kết nối server';
  } finally {
    btn.textContent = '💾 Lưu lịch học';
    btn.disabled = false;
  }
});

// ─── Load đăng ký ────────────────────────────────────────────
async function loadRegistrations() {
  try {
    const res = await API('/api/admin/registrations');
    const data = await res.json();
    const tbody = document.getElementById('registrations-list');

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">Chưa có đăng ký nào</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((r, i) => `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-3 py-2 text-gray-400">${i + 1}</td>
        <td class="px-3 py-2 font-medium">${escHtml(r.parent_name)}</td>
        <td class="px-3 py-2">${escHtml(r.phone)}</td>
        <td class="px-3 py-2">${escHtml(r.child_name)}</td>
        <td class="px-3 py-2">${escHtml(r.grade)}</td>
        <td class="px-3 py-2 text-gray-500">${escHtml(r.note || '-')}</td>
        <td class="px-3 py-2 text-gray-400 text-xs">${new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
        <td class="px-3 py-2">
          <button class="status-btn px-3 py-1 rounded-full text-xs font-semibold ${
            r.status === 'contacted'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }" data-id="${r.id}" data-status="${r.status}">
            ${r.status === 'contacted' ? '✅ Đã gọi' : '⏳ Chưa liên hệ'}
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = btn.dataset.status === 'pending' ? 'contacted' : 'pending';
        try {
          const res = await API(`/api/admin/registrations/${btn.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus }),
          });
          if (res.ok) {
            btn.dataset.status = newStatus;
            btn.className = `status-btn px-3 py-1 rounded-full text-xs font-semibold ${
              newStatus === 'contacted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`;
            btn.textContent = newStatus === 'contacted' ? '✅ Đã gọi' : '⏳ Chưa liên hệ';
          }
        } catch (err) {
          console.error('Lỗi cập nhật trạng thái:', err);
        }
      });
    });
  } catch (err) {
    console.error('Lỗi tải đăng ký:', err);
  }
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ─── Init ─────────────────────────────────────────────────────
loadData();

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'registrations') loadRegistrations();
  });
});
