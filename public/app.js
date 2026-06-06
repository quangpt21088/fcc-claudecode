// ─── Tải nội dung động từ DB ─────────────────────────────────
async function loadContent() {
  try {
    const res = await fetch('/api/content');
    const data = await res.json();

    // Hero
    if (data.hero) {
      setText('hero-title', data.hero.title);
      setText('hero-subtitle', data.hero.subtitle);
      setText('stat-years', data.hero.statYears);
      setText('stat-students', data.hero.statStudents);
      setText('stat-rating', data.hero.statRating);
    }

    // Teacher
    if (data.teacher) {
      setText('teacher-name', data.teacher.name);
      setText('teacher-bio', data.teacher.bio);
    }

    // Courses
    const container = document.getElementById('courses-list');
    if (container && data.courses) {
      container.innerHTML = data.courses.map(c => `
        <div class="bg-white rounded-xl shadow p-6 border ${c.status === 'full' ? 'opacity-60' : ''}">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xl font-bold text-blue-700">${escHtml(c.name)}</h3>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${
              c.status === 'available'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }">${c.status === 'available' ? 'Còn chỗ' : 'Hết chỗ'}</span>
          </div>
          <div class="space-y-1 text-sm text-gray-600">
            <p>📅 <strong>Ngày học:</strong> ${escHtml(c.dayOfWeek)}</p>
            <p>⏰ <strong>Giờ:</strong> ${escHtml(c.timeSlot)}</p>
            <p>💰 <strong>Học phí:</strong> ${escHtml(c.price)}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Lỗi tải nội dung:', err);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ─── Scroll reveal ────────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// ─── Form đăng ký ─────────────────────────────────────────────
function initRegister() {
  const form = document.getElementById('register-form');
  const msg = document.getElementById('register-msg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Đang gửi...';
    btn.disabled = true;

    const body = {
      parentName: form.parentName.value.trim(),
      phone: form.phone.value.trim(),
      childName: form.childName.value.trim(),
      grade: form.grade.value,
      note: form.note.value.trim(),
    };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      msg.classList.remove('hidden', 'text-red-600', 'text-green-600');
      if (res.ok) {
        msg.classList.add('text-green-600');
        msg.textContent = '✅ Đăng ký thành công! Chúng tôi sẽ liên hệ sớm.';
        form.reset();
      } else {
        msg.classList.add('text-red-600');
        msg.textContent = '❌ ' + (data.error || 'Có lỗi xảy ra');
      }
    } catch {
      msg.classList.remove('hidden');
      msg.classList.add('text-red-600');
      msg.textContent = '❌ Không thể kết nối server';
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadContent();
  initReveal();
  initRegister();
});
