const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool, initDB } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/', apiLimiter);
app.use('/api/admin/login', loginLimiter);

// Cache in-memory
let contentCache = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30s

function invalidateCache() { contentCache = null; }

// ─── Auth Middleware ───────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Thiếu token' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

// ─── GET /api/content — Nội dung trang chủ ────────────────────
app.get('/api/content', async (req, res) => {
  try {
    if (contentCache && Date.now() - cacheTime < CACHE_TTL) {
      return res.json(contentCache);
    }

    const { rows: settingsRows } = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    for (const r of settingsRows) settings[r.key] = r.value;

    const { rows: coursesRows } = await pool.query(
      'SELECT * FROM courses WHERE hidden = false ORDER BY sort_order ASC'
    );

    const data = {
      hero: {
        title: settings.hero_title || '',
        subtitle: settings.hero_subtitle || '',
        statYears: settings.stat_years || '',
        statStudents: settings.stat_students || '',
        statRating: settings.stat_rating || '',
      },
      teacher: {
        name: settings.teacher_name || '',
        bio: settings.teacher_bio || '',
      },
      courses: coursesRows.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        price: c.price,
        dayOfWeek: c.day_of_week,
        timeSlot: c.time_slot,
        status: c.status,
      })),
    };

    contentCache = data;
    cacheTime = Date.now();
    res.json(data);
  } catch (err) {
    console.error('GET /api/content error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── POST /api/register — Đăng ký học ────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { parentName, phone, childName, grade, note } = req.body;
    if (!parentName || !phone || !childName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    await pool.query(
      `INSERT INTO registrations (parent_name, phone, child_name, grade, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [parentName, phone, childName, grade || '', note || '']
    );
    res.json({ ok: true, message: 'Đăng ký thành công' });
  } catch (err) {
    console.error('POST /api/register error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── POST /api/admin/login — Đăng nhập ───────────────────────
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
    }
    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ ok: true, token });
  } catch (err) {
    console.error('POST /api/admin/login error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/courses — Tất cả khóa học (kể cả ẩn) ──────
app.get('/api/admin/courses', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM courses ORDER BY sort_order ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/courses error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/content — Cập nhật nội dung trang chủ ────
app.put('/api/admin/content', auth, async (req, res) => {
  try {
    const { hero, teacher } = req.body;
    const updates = [];
    if (hero) {
      if (hero.title !== undefined) updates.push(['hero_title', hero.title]);
      if (hero.subtitle !== undefined) updates.push(['hero_subtitle', hero.subtitle]);
      if (hero.statYears !== undefined) updates.push(['stat_years', hero.statYears]);
      if (hero.statStudents !== undefined) updates.push(['stat_students', hero.statStudents]);
      if (hero.statRating !== undefined) updates.push(['stat_rating', hero.statRating]);
    }
    if (teacher) {
      if (teacher.name !== undefined) updates.push(['teacher_name', teacher.name]);
      if (teacher.bio !== undefined) updates.push(['teacher_bio', teacher.bio]);
    }

    for (const [key, value] of updates) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }

    invalidateCache();
    res.json({ ok: true, message: 'Đã cập nhật nội dung' });
  } catch (err) {
    console.error('PUT /api/admin/content error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/schedule — Cập nhật lịch học ─────────────
app.put('/api/admin/schedule', auth, async (req, res) => {
  try {
    const { courses } = req.body;
    if (!Array.isArray(courses)) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const c of courses) {
        await client.query(
          `UPDATE courses SET
            name = $1, price = $2, day_of_week = $3,
            time_slot = $4, status = $5, hidden = $6, updated_at = NOW()
           WHERE id = $7`,
          [c.name, c.price, c.dayOfWeek, c.timeSlot, c.status, c.hidden, c.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    invalidateCache();
    res.json({ ok: true, message: 'Đã cập nhật lịch học' });
  } catch (err) {
    console.error('PUT /api/admin/schedule error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/registrations — Danh sách đăng ký ────────
app.get('/api/admin/registrations', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM registrations ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/registrations error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/registrations/:id — Cập nhật trạng thái ──
app.put('/api/admin/registrations/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'contacted'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    await pool.query(
      'UPDATE registrations SET status = $1 WHERE id = $2',
      [status, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/registrations/:id error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── POST /api/admin/change-password — Đổi mật khẩu ──────────
app.post('/api/admin/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Thiếu mật khẩu' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải tối thiểu 6 ký tự' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, req.admin.id]);
    res.json({ ok: true, message: 'Đã đổi mật khẩu' });
  } catch (err) {
    console.error('POST /api/admin/change-password error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── Start ────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  });
});
