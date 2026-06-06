const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool, initDB } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── JWT Secret — auto-generate if missing ───
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  const crypto = require('crypto');
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️  JWT_SECRET was missing or too weak. A random secret has been generated for this session.');
  console.warn('⚠️  Set a permanent JWT_SECRET in .env for production to avoid token invalidation on restart.');
}

// ─── XSS Sanitizer — strip all HTML tags from string values ───
function sanitizeStr(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/<[^>]*>/g, '').trim();
}

// Whitelist of allowed settings keys to prevent DB pollution
const ALLOWED_SETTINGS_KEYS = new Set([
  'site_name','site_name_accent','hero_badge','hero_title1','hero_title2','hero_desc',
  'hero_stat1_value','hero_stat1_label','hero_stat2_value','hero_stat2_label',
  'hero_stat3_value','hero_stat3_label','teacher_name','teacher_label','teacher_photo',
  'teacher_photo_alt','teacher_bio','satisfaction_value','satisfaction_label',
  'courses_section_title','courses_section_desc','schedule_section_title','schedule_section_desc',
  'form_section_title','form_section_desc','footer_brand','footer_brand_accent',
  'footer_desc','footer_hotline','footer_address','footer_map','zalo_url','hotline_number',
  'title_styles',
]);

// ─── Trust proxy (Railway/reverse proxy) ───
app.set('trust proxy', 1);

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
    if (contentCache !== null && Date.now() - cacheTime < CACHE_TTL) {
      return res.json(contentCache);
    }

    // Settings key-value
    const { rows: settingsRows } = await pool.query('SELECT key, value FROM settings');
    const S = {};
    for (const r of settingsRows) S[r.key] = r.value;

    // Courses (chỉ hiện hidden=false)
    const { rows: coursesRows } = await pool.query(
      'SELECT * FROM courses WHERE hidden = false ORDER BY sort_order ASC'
    );
    const courseIds = coursesRows.map(c => c.id);

    // Schedule (chỉ hiện hidden=false VÀ thuộc course không bị ẩn)
    let scheduleRows = [];
    if (courseIds.length > 0) {
      const { rows } = await pool.query(
        'SELECT * FROM schedule WHERE hidden = false AND course_id = ANY($1::int[]) ORDER BY sort_order ASC',
        [courseIds]
      );
      scheduleRows = rows;
    }

    // Approach
    const { rows: approachRows } = await pool.query(
      'SELECT * FROM approach ORDER BY sort_order ASC'
    );

    // Why
    const { rows: whyRows } = await pool.query(
      'SELECT * FROM why_items ORDER BY sort_order ASC'
    );

    // Title styles
    let titleStyles = {};
    try {
      const { rows: tsRows } = await pool.query("SELECT value FROM settings WHERE key = 'title_styles'");
      if (tsRows.length > 0) titleStyles = JSON.parse(tsRows[0].value);
    } catch(e) { titleStyles = {}; }

    const data = {
      // Site
      siteName: S.site_name || 'Ngữ Văn',
      siteNameAccent: S.site_name_accent || 'THCS',

      // Hero
      heroBadge: S.hero_badge || 'Đang nhận học viên mới',
      heroTitle1: S.hero_title1 || 'Khơi nguồn tư duy',
      heroTitle2: S.hero_title2 || 'Bứt phá điểm số',
      heroDesc: S.hero_desc || '',
      heroStat1Value: S.hero_stat1_value || '10+',
      heroStat1Label: S.hero_stat1_label || 'Năm kinh nghiệm',
      heroStat2Value: S.hero_stat2_value || '500+',
      heroStat2Label: S.hero_stat2_label || 'Học sinh',
      heroStat3Value: S.hero_stat3_value || '4.9/5',
      heroStat3Label: S.hero_stat3_label || 'Đánh giá',

      // Teacher
      teacherName: S.teacher_name || 'Thầy/Cô [Tên]',
      teacherLabel: S.teacher_label || 'Giáo viên Ngữ Văn THCS',
      teacherPhoto: S.teacher_photo || '',
      teacherPhotoAlt: S.teacher_photo_alt || 'Giáo viên Ngữ Văn THCS',
      teacherBio: S.teacher_bio || '',
      satisfactionValue: S.satisfaction_value || '98%',
      satisfactionLabel: S.satisfaction_label || 'Học sinh hài lòng',

      // Courses section
      coursesSectionTitle: S.courses_section_title || 'Chọn lớp phù hợp',
      coursesSectionDesc: S.courses_section_desc || '',

      // Schedule section
      scheduleSectionTitle: S.schedule_section_title || 'Lịch học tuần này',
      scheduleSectionDesc: S.schedule_section_desc || '',

      // Form
      formSectionTitle: S.form_section_title || 'Đăng ký ngay hôm nay',
      formSectionDesc: S.form_section_desc || 'Điền thông tin bên dưới, chúng tôi sẽ liên hệ trong 24h',

      // Footer
      footerBrand: S.footer_brand || 'Ngữ Văn',
      footerBrandAccent: S.footer_brand_accent || 'THCS',
      footerDesc: S.footer_desc || '',
      footerHotline: S.footer_hotline || '0xxx.xxx.xxx',
      footerAddress: S.footer_address || '[Địa chỉ cụ thể của lớp học]',
      footerMap: S.footer_map || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5!2d106.7!3d10.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDAJzQ4JzAwLjAiTiAxMDbKwDQyJzAwLjAiRQ!5e0!3m2!1svi!2s!4v1234567890',

      // FABs
      zaloUrl: S.zalo_url || '#',
      hotlineNumber: S.hotline_number || '+84123456789',

      // Data arrays
      courses: coursesRows.map(c => ({
        id: c.id,
        name: c.name,
        shortName: c.short_name || c.name,
        emoji: c.emoji || '📖',
        color: c.color || 'blue',
        sub: c.sub || '',
        description: c.description || '',
        features: c.features ? (Array.isArray(c.features) ? c.features : JSON.parse(c.features)) : [],
        duration: c.duration || '2h/buổi',
        maxStudents: c.max_students || 'Tối đa 10',
        sessions: c.sessions || '2 buổi/tuần',
        status: c.status || 'available',
        price: c.price || '',
      })),

      schedule: scheduleRows.map(s => ({
        id: s.id,
        class: s.class_name || s.name || '',
        time: s.time_slot || '',
        days: s.days || '',
        status: s.status || 'available',
        statusText: s.status_text || '🟢 Còn chỗ',
      })),

      approach: approachRows.map(a => ({
        id: a.id,
        title: a.title || '',
        description: a.description || a.desc || '',
      })),

      why: whyRows.map(w => ({
        id: w.id,
        icon: w.icon || '🏆',
        title: w.title || '',
        description: w.description || w.desc || '',
      })),

      // Title styles
      titleStyles: titleStyles,
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
    // Validate phone format (10 digits, starts with 0)
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 0)' });
    }
    // Limit input length
    if (parentName.length > 200 || childName.length > 200) {
      return res.status(400).json({ error: 'Tên không được vượt quá 200 ký tự' });
    }
    if (grade && grade.length > 20) {
      return res.status(400).json({ error: 'Lớp không được vượt quá 20 ký tự' });
    }
    if (note && note.length > 1000) {
      return res.status(400).json({ error: 'Ghi chú không được vượt quá 1000 ký tự' });
    }
    await pool.query(
      `INSERT INTO registrations (parent_name, phone, child_name, grade, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [sanitizeStr(parentName.trim()), cleanPhone, sanitizeStr(childName.trim()), sanitizeStr((grade || '').trim()), sanitizeStr((note || '').trim())]
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
    const updates = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'string') {
          // Whitelist keys + sanitize value
          if (!ALLOWED_SETTINGS_KEYS.has(key)) continue;
          const clean = sanitizeStr(value);
          await client.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            [key, clean]
          );
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    invalidateCache();
    res.json({ ok: true, message: 'Đã cập nhật nội dung' });
  } catch (err) {
    console.error('PUT /api/admin/content error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/settings — Tất cả settings ────────────────
app.get('/api/admin/settings', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (err) {
    console.error('GET /api/admin/settings error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/schedule — Tất cả lịch học ────────────────
app.get('/api/admin/schedule', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM schedule ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/schedule error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/schedule — Cập nhật lịch học ─────────────
app.put('/api/admin/schedule/:id', auth, async (req, res) => {
  try {
    const { class_name, className, time_slot, timeSlot, days, status, status_text, statusText, hidden, course_id } = req.body;
    await pool.query(
      `UPDATE schedule SET course_id = $1, class_name = $2, time_slot = $3, days = $4, status = $5, status_text = $6, hidden = $7, updated_at = NOW() WHERE id = $8`,
      [course_id || null, class_name || className, time_slot || timeSlot, days, status, status_text || statusText, hidden, req.params.id]
    );
    invalidateCache();
    res.json({ ok: true, message: 'Đã cập nhật lịch học' });
  } catch (err) {
    console.error('PUT /api/admin/schedule/:id error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/approach — Tất cả phương pháp ─────────────
app.get('/api/admin/approach', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM approach ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/approach error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/approach — Cập nhật phương pháp ───────────
app.put('/api/admin/approach', auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const a of items) {
        await client.query(
          `UPDATE approach SET title = $1, description = $2, updated_at = NOW() WHERE id = $3`,
          [sanitizeStr(a.title), sanitizeStr(a.description || a.desc), a.id]
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
    res.json({ ok: true, message: 'Đã cập nhật phương pháp' });
  } catch (err) {
    console.error('PUT /api/admin/approach error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/why — Tất cả why items ────────────────────
app.get('/api/admin/why', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM why_items ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/why error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/why — Cập nhật why items ──────────────────
app.put('/api/admin/why', auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const w of items) {
        await client.query(
          `UPDATE why_items SET icon = $1, title = $2, description = $3, updated_at = NOW() WHERE id = $4`,
          [sanitizeStr(w.icon), sanitizeStr(w.title), sanitizeStr(w.description || w.desc), w.id]
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
    res.json({ ok: true, message: 'Đã cập nhật' });
  } catch (err) {
    console.error('PUT /api/admin/why error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── GET /api/admin/title-styles — Lấy style tiêu đề ──────────
app.get('/api/admin/title-styles', auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'title_styles'");
    if (rows.length > 0) {
      res.json(JSON.parse(rows[0].value));
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('GET /api/admin/title-styles error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/title-styles — Lưu style tiêu đề ──────────
app.put('/api/admin/title-styles', auth, async (req, res) => {
  try {
    const styles = req.body;
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ('title_styles', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(styles)]
    );
    invalidateCache();
    res.json({ ok: true, message: 'Đã lưu style tiêu đề' });
  } catch (err) {
    console.error('PUT /api/admin/title-styles error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── PUT /api/admin/courses/:id — Cập nhật 1 khóa học ────────
app.put('/api/admin/courses/:id', auth, async (req, res) => {
  try {
    const { name, short_name, shortName, emoji, color, sub, description, features, duration, max_students, maxStudents, sessions, price, status, hidden, sort_order } = req.body;
    console.log('PUT /api/admin/courses/:id body:', JSON.stringify({ id: req.params.id, name, hidden, status, sort_order }));
    await pool.query(
      `UPDATE courses SET
        name = $1, short_name = $2, emoji = $3, color = $4,
        sub = $5, description = $6, features = $7::jsonb,
        duration = $8, max_students = $9, sessions = $10,
        price = $11, status = $12, hidden = $13, sort_order = $14, updated_at = NOW()
       WHERE id = $15`,
      [sanitizeStr(name), sanitizeStr(short_name || shortName), sanitizeStr(emoji), color,
       sanitizeStr(sub), sanitizeStr(description),
       JSON.stringify(features || []), sanitizeStr(duration), sanitizeStr(max_students || maxStudents),
       sanitizeStr(sessions), sanitizeStr(price), status, hidden || false, sort_order || 0, req.params.id]
    );
    invalidateCache();
    res.json({ ok: true, message: 'Đã cập nhật khóa học' });
  } catch (err) {
    console.error('PUT /api/admin/courses/:id error:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
});

// ─── POST /api/admin/courses — Thêm khóa học mới ──────────────
app.post('/api/admin/courses', auth, async (req, res) => {
  try {
    const { name, short_name, shortName, emoji, color, sub, description, desc, features, duration, max_students, maxStudents, sessions, price, status, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên khóa học là bắt buộc' });
    }
    console.log('POST /api/admin/courses body:', JSON.stringify({ name, status, sort_order }));
    const { rows } = await pool.query(
      `INSERT INTO courses (name, short_name, emoji, color, sub, description, features, duration, max_students, sessions, price, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [sanitizeStr(name), sanitizeStr(short_name || shortName || ''), sanitizeStr(emoji || '📖'), color || 'blue',
       sanitizeStr(sub || ''), sanitizeStr(description || desc || ''),
       JSON.stringify(features || []), sanitizeStr(duration || '2h/buổi'), sanitizeStr(max_students || maxStudents || 'Tối đa 10'),
       sanitizeStr(sessions || '2 buổi/tuần'), sanitizeStr(price || ''), status || 'available', sort_order || 0]
    );
    invalidateCache();
    res.json({ ok: true, message: 'Đã thêm khóa học mới', course: rows[0] });
  } catch (err) {
    console.error('POST /api/admin/courses error:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
});

// ─── POST /api/admin/schedule — Thêm lịch học mới ─────────────
app.post('/api/admin/schedule', auth, async (req, res) => {
  try {
    const { class_name, className, time_slot, timeSlot, days, status, status_text, statusText, sort_order, course_id } = req.body;
    if (!class_name && !className) {
      return res.status(400).json({ error: 'Tên lớp là bắt buộc' });
    }
    const { rows } = await pool.query(
      `INSERT INTO schedule (course_id, class_name, time_slot, days, status, status_text, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [course_id || null, class_name || className, time_slot || timeSlot || '', days || '', status || 'available',
       status_text || statusText || '🟢 Còn chỗ', sort_order || 0]
    );
    invalidateCache();
    res.json({ ok: true, message: 'Đã thêm lịch học mới', schedule: rows[0] });
  } catch (err) {
    console.error('POST /api/admin/schedule error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── DELETE /api/admin/courses/:id — Xóa khóa học (cascade xóa schedule) ──
app.delete('/api/admin/courses/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    invalidateCache();
    res.json({ ok: true, message: 'Đã xóa khóa học' });
  } catch (err) {
    console.error('DELETE /api/admin/courses/:id error:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── DELETE /api/admin/schedule/:id — Xóa lịch học ────────────
app.delete('/api/admin/schedule/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM schedule WHERE id = $1', [req.params.id]);
    invalidateCache();
    res.json({ ok: true, message: 'Đã xóa lịch học' });
  } catch (err) {
    console.error('DELETE /api/admin/schedule/:id error:', err.message);
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
    // Do NOT sanitize passwords — sanitizeStr strips special chars like < > which may be intentional in passwords

    console.log('CHANGE PASSWORD: adminId=', req.admin.id, 'username=', req.admin.username);
    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    console.log('CHANGE PASSWORD: found rows=', rows.length);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Admin not found' });
    }
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    console.log('CHANGE PASSWORD: currentPassword match=', match);
    if (!match) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const updateResult = await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, req.admin.id]);
    console.log('CHANGE PASSWORD: update result rowCount=', updateResult.rowCount);
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
