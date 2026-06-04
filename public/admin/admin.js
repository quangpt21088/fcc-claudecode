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

async function loadData() {
  try {
    const res = await API('/api/content');
    const data = await res.json();

    // Fill form nội dung
    if (data.hero) {
      document.getElementById('f-hero-title').value = data.hero.title || '';
      document.getElementById('f-hero-subtitle').value = data.hero.subtitle || '';
      document.getElementById('f-stat-years').value = data.hero.statYears || '';
      document.getElementById('f-stat-students').value = data.hero.statStudents || '';
      document.getElementById('f-stat-rating').value = data.hero.statRating || '';
    }
    if (data.teacher) {
      document.getElementById('f-teacher-name').value = data.teacher.name || '';
      document.getElementById('f-teacher-bio').value = data.teacher.bio || '';
    }

    // Render lịch học — dùng API admin để lấy cả khóa ẩn
    const coursesRes = await API('/api/admin/courses');
    const coursesData = await coursesRes.json();
    allCourses = coursesData || [];
    renderSchedule(allCourses);
  } catch (err) {
    console.error('Lỗi tải dữ liệu:', err);
  }
}

// ─── Render lịch học ─────────────────────────────────────────
function renderSchedule(courses) {
  const container = document.getElementById('schedule-list');
  container.innerHTML = courses.map((c, i) => `
    <div class="border rounded-lg p-4 grid md:grid-cols-7 gap-3 items-center ${c.hidden ? 'bg-gray-50 opacity-60' : ''}">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Tên lớp</label>
        <input class="s-name w-full border rounded px-2 py-1 text-sm" value="${esc(c.name)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Học phí</label>
        <input class="s-price w-full border rounded px-2 py-1 text-sm" value="${esc(c.price)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Ngày học</label>
        <input class="s-day w-full border rounded px-2 py-1 text-sm" value="${esc(c.day_of_week)}" data-idx="${i}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Khung giờ</label>
        <input class="s-time w-full border rounded px-2 py-1 text-sm" value="${esc(c.time_slot)}" data-idx="${i}">
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle">
          <input type="checkbox" class="s-status" data-idx="${i}" ${c.status === 'available' ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="text-xs text-gray-500 s-status-label">${c.status === 'available' ? 'Còn chỗ' : 'Hết chỗ'}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="toggle">
          <input type="checkbox" class="s-visible" data-idx="${i}" ${!c.hidden ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="text-xs text-gray-500 s-visible-label">${c.hidden ? 'Đang ẩn' : 'Hiển thị'}</span>
      </div>
      <div class="text-xs text-gray-400">ID: ${c.id}</div>
    </div>
  `).join('');

  // Toggle status labels
  container.querySelectorAll('.s-status').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.flex').querySelector('.s-status-label');
      label.textContent = cb.checked ? 'Còn chỗ' : 'Hết chỗ';
    });
  });

  // Toggle visible labels
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

function esc(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Lưu nội dung ────────────────────────────────────────────
document.getElementById('btn-save-content').addEventListener('click', async () => {
  const msg = document.getElementById('msg-content');
  const btn = document.getElementById('btn-save-content');
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;

  try {
    const res = await API('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({
        hero: {
          title: document.getElementById('f-hero-title').value,
          subtitle: document.getElementById('f-hero-subtitle').value,
          statYears: document.getElementById('f-stat-years').value,
          statStudents: document.getElementById('f-stat-students').value,
          statRating: document.getElementById('f-stat-rating').value,
        },
        teacher: {
          name: document.getElementById('f-teacher-name').value,
          bio: document.getElementById('f-teacher-bio').value,
        },
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

// ─── Lưu lịch học ────────────────────────────────────────────
document.getElementById('btn-save-schedule').addEventListener('click', async () => {
  const msg = document.getElementById('msg-schedule');
  const btn = document.getElementById('btn-save-schedule');
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;

  const courses = allCourses.map((c, i) => ({
    id: c.id,
    name: document.querySelector(`.s-name[data-idx="${i}"]`).value,
    price: document.querySelector(`.s-price[data-idx="${i}"]`).value,
    dayOfWeek: document.querySelector(`.s-day[data-idx="${i}"]`).value,
    timeSlot: document.querySelector(`.s-time[data-idx="${i}"]`).value,
    status: document.querySelector(`.s-status[data-idx="${i}"]`).checked ? 'available' : 'full',
    hidden: !document.querySelector(`.s-visible[data-idx="${i}"]`).checked,
  }));

  try {
    const res = await API('/api/admin/schedule', {
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

    // Bind status toggle
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

// Load registrations khi click tab
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'registrations') loadRegistrations();
  });
});
