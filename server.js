const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'admin123';
const RESET_SECRET = process.env.RESET_SECRET || 'reset123';
const DATA_FILE = path.join(__dirname, 'data.json');

// ===== DATABASE SETUP =====
let db = null;
let useDb = false;

if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    useDb = true;
    console.log('✅ Using PostgreSQL database');
  } catch(e) {
    console.log('⚠️ pg not available, falling back to file:', e.message);
  }
} else {
  console.log('⚠️ No DATABASE_URL, using file-based storage');
}

// ===== DB HELPERS =====
async function dbInit() {
  if (!useDb) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        short_name TEXT NOT NULL DEFAULT '',
        emoji TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT 'blue',
        visible BOOLEAN NOT NULL DEFAULT true,
        sub TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        features TEXT NOT NULL DEFAULT '',
        duration TEXT NOT NULL DEFAULT '',
        max_students TEXT NOT NULL DEFAULT '',
        sessions TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS schedule (
        id SERIAL PRIMARY KEY,
        class TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        days TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'available',
        status_text TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('✅ Database tables ready');
  } catch(e) {
    console.error('⚠️ DB init error:', e.message);
  }
}

async function dbGetAll() {
  if (!useDb) return null;
  try {
    const settings = await db.query('SELECT key, value FROM settings');
    const courses = await db.query('SELECT * FROM courses ORDER BY sort_order, id');
    const schedule = await db.query('SELECT * FROM schedule ORDER BY sort_order, id');
    
    const data = {};
    settings.rows.forEach(r => {
      // Try to parse JSON for array/object fields
      if (r.key === 'approach' || r.key === 'why') {
        try { data[r.key] = JSON.parse(r.value); } catch(e) { data[r.key] = r.value; }
      } else {
        data[r.key] = r.value;
      }
    });
    
    data.courses = courses.rows.map(r => ({
      id: r.id,
      name: r.name,
      shortName: r.short_name,
      emoji: r.emoji,
      color: r.color,
      visible: r.visible,
      sub: r.sub || '',
      desc: r.description,
      features: r.features ? r.features.split('\n').filter(Boolean) : [],
      duration: r.duration,
      maxStudents: r.max_students,
      sessions: r.sessions
    }));
    
    data.schedule = schedule.rows.map(r => ({
      id: r.id,
      class: r.class,
      time: r.time,
      days: r.days,
      status: r.status,
      statusText: r.status_text
    }));
    
    // Ensure approach and why are always arrays
    if (!data.approach || !Array.isArray(data.approach)) data.approach = [];
    if (!data.why || !Array.isArray(data.why)) data.why = [];
    
    return data;
  } catch(e) {
    console.error('⚠️ DB getAll error:', e.message);
    return null;
  }
}

async function dbSetSetting(key, value) {
  if (!useDb) return;
  try {
    await db.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, String(value)]
    );
  } catch(e) {
    console.error('⚠️ DB setSetting error:', e.message);
  }
}

async function dbInsertCourse(c, sortOrder) {
  if (!useDb) return;
  await db.query(
    `INSERT INTO courses (name, short_name, emoji, color, visible, sub, description, features, duration, max_students, sessions, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [c.name, c.shortName, c.emoji, c.color, c.visible !== false, c.sub||'', c.desc||'', (c.features||[]).join('\n'), c.duration||'', c.maxStudents||'', c.sessions||'', sortOrder]
  );
}

async function dbInsertSchedule(r, sortOrder) {
  if (!useDb) return;
  await db.query(
    `INSERT INTO schedule (class, time, days, status, status_text, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [r.class, r.time, r.days, r.status, r.statusText, sortOrder]
  );
}

// ===== FILE HELPERS (fallback) =====
function readDataFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch(e) {
    return {};
  }
}

function writeDataFile(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== DATA ACCESS LAYER (DB or file) =====
async function getData() {
  if (useDb) {
    const dbData = await dbGetAll();
    if (dbData) return dbData;
  }
  return readDataFile();
}

async function saveData(data) {
  if (useDb) {
    try {
      // Use transaction for atomicity
      await db.query('BEGIN');
      try {
        // BATCH: Save ALL settings in a single statement
        const skipKeys = ['adminPassword', 'courses', 'schedule'];
        const settingsArr = [];
        for (const key of Object.keys(data)) {
          if (!skipKeys.includes(key)) {
            const val = (typeof data[key] === 'object') ? JSON.stringify(data[key]) : String(data[key]);
            settingsArr.push([key, val]);
          }
        }
        if (settingsArr.length > 0) {
          const placeholders = settingsArr.map((_,i) => `($${i*2+1}, $${i*2+2})`).join(',');
          const flatVals = settingsArr.flat();
          await db.query(
            `INSERT INTO settings (key, value) VALUES ${placeholders} ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            flatVals
          );
        }
        // Save courses (delete + reinsert in parallel)
        await db.query('DELETE FROM courses');
        await Promise.all((data.courses||[]).map((c, i) => dbInsertCourse(c, i)));
        // Save schedule (delete + reinsert in parallel)
        await db.query('DELETE FROM schedule');
        await Promise.all((data.schedule||[]).map((r, i) => dbInsertSchedule(r, i)));
        await db.query('COMMIT');
        return;
      } catch(innerErr) {
        await db.query('ROLLBACK');
        throw innerErr;
      }
    } catch(e) {
      console.error('⚠️ DB save error, falling back to file:', e.message);
    }
  }
  writeDataFile(data);
}

async function getAdminPassword() {
  if (useDb) {
    try {
      const res = await db.query("SELECT value FROM settings WHERE key = 'adminPassword'");
      if (res.rows.length > 0) return res.rows[0].value;
    } catch(e) {}
  }
  const data = readDataFile();
  return data.adminPassword || '';
}

async function setAdminPassword(hash) {
  if (useDb) {
    try {
      await dbSetSetting('adminPassword', hash);
      return;
    } catch(e) {}
  }
  const data = readDataFile();
  data.adminPassword = hash;
  writeDataFile(data);
}

// ===== AUTO-INIT =====
// Chỉ chạy khi DB/file HOÀN TOÀN trống (fresh deploy, chưa có gì)
// KHÔNG bao giờ reset password hay ghi đè dữ liệu đã có
async function autoInit() {
  const data = await getData();
  // Check if DB/file has ANY content at all
  const hasContent = data.siteName || data.courses || data.approach || data.schedule || data.heroTitle1;
  
  if (!hasContent) {
    // Truly fresh deploy — seed from default-data.json
    try {
      const defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, 'default-data.json'), 'utf8'));
      // Use adminPassword from default, nothing else to preserve (empty DB)
      await saveData(defaultData);
      console.log('✅ Fresh deploy: auto-initialized from default-data.json');
    } catch(e) {
      console.log('⚠️ Could not auto-init:', e.message);
    }
  } else {
    // DB already has data — DO NOT touch anything
    console.log('✅ Data already exists, skipping auto-init (no overwrite)');
  }
}

// ===== RATE LIMITING =====
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function rateLimitCheck(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + LOCKOUT_MS });
    return { allowed: true };
  }
  if (rec.count >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((rec.resetTime - now) / 1000);
    return { allowed: false, waitSec };
  }
  rec.count++;
  return { allowed: true };
}

// ===== RATE LIMITING: SAVE =====
const saveAttempts = new Map();
const SAVE_MAX_ATTEMPTS = 10;
const SAVE_LOCKOUT_MS = 60 * 1000; // 1 minute

function saveRateLimitCheck(ip) {
  const now = Date.now();
  const rec = saveAttempts.get(ip);
  if (!rec || now > rec.resetTime) {
    saveAttempts.set(ip, { count: 1, resetTime: now + SAVE_LOCKOUT_MS });
    return { allowed: true };
  }
  if (rec.count >= SAVE_MAX_ATTEMPTS) {
    const waitSec = Math.ceil((rec.resetTime - now) / 1000);
    return { allowed: false, waitSec };
  }
  rec.count++;
  return { allowed: true };
}

setInterval(function() {
  const now = Date.now();
  for (const [ip, rec] of loginAttempts) {
    if (now > rec.resetTime) loginAttempts.delete(ip);
  }
  for (const [ip, rec] of saveAttempts) {
    if (now > rec.resetTime) saveAttempts.delete(ip);
  }
}, 10 * 60 * 1000);

// ===== MIDDLEWARE =====
// HTTPS redirect (production only)
if (process.env.NODE_ENV === 'production') {
  app.use(function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.get('host') + req.url);
    }
    next();
  });
}

app.use(express.json({ limit: '2mb' }));
app.use(validateCsrf);
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders: function(res) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  }
}));

function requireAjax(req, res, next) {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

// ===== CSRF PROTECTION =====
// Simple double-submit cookie pattern
var csrfTokens = new Map(); // session → token
var CSRF_MAX_AGE = 3600000; // 1 hour

// Cleanup expired tokens
setInterval(function() {
  var now = Date.now();
  for (const [sid, rec] of csrfTokens) {
    if (now > rec.expires) csrfTokens.delete(sid);
  }
}, 30 * 60 * 1000);

function generateCsrfToken(sessionId) {
  var token = require('crypto').randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, { token: token, expires: Date.now() + CSRF_MAX_AGE });
  return token;
}

function validateCsrf(req, res, next) {
  // Skip for GET and login
  if (req.method === 'GET' || req.path === '/api/admin/login') return next();
  var sid = req.headers['x-csrf-session'] || req.ip;
  var token = req.headers['x-csrf-token'];
  var rec = csrfTokens.get(sid);
  if (!rec || rec.token !== token || Date.now() > rec.expires) {
    return res.status(403).json({ error: 'invalid_csrf' });
  }
  next();
}

// ===== API: CSRF TOKEN =====
app.get('/api/csrf-token', function(req, res) {
  var sid = req.ip;
  var token = generateCsrfToken(sid);
  res.json({ token: token, session: sid });
});

// ===== API: PUBLIC DATA =====
app.get('/api/data', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  const data = await getData();
  const safe = { ...data };
  delete safe.adminPassword;
  res.json(safe);
});

// ===== API: ADMIN AUTH =====
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  const rl = rateLimitCheck(ip);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'too_many_attempts', waitSec: rl.waitSec });
  }

  const hash = await getAdminPassword();
  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = (password === hash);
  }

  if (valid) {
    const pw = await getAdminPassword();
    const mustChange = !pw || pw === DEFAULT_PASSWORD || !pw.startsWith('$2');
    res.json({ ok: true, mustChangePassword: mustChange });
  } else {
    res.status(401).json({ error: 'wrong_password' });
  }
});

// ===== API: SAVE =====
app.post('/api/admin/save', async (req, res) => {
  const { password, data: newData } = req.body;
  if (!password) return res.status(401).json({ error: 'missing_password' });

  // Rate limit save requests
  const saveIp = req.ip || req.connection.remoteAddress;
  const saveRl = saveRateLimitCheck(saveIp);
  if (!saveRl.allowed) {
    return res.status(429).json({ error: 'too_many_saves', waitSec: saveRl.waitSec });
  }

  const hash = await getAdminPassword();
  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = (password === hash);
  }

  if (!valid) return res.status(401).json({ error: 'wrong_password' });

  // Validate data structure
  if (!newData || typeof newData !== 'object') {
    return res.status(400).json({ error: 'invalid_data' });
  }

  // Whitelist allowed keys to prevent injection of unexpected fields
  const allowedKeys = [
    'siteName','siteNameAccent','heroBadge','heroTitle1','heroTitle2','heroDesc',
    'heroStat1Value','heroStat1Label','heroStat2Value','heroStat2Label',
    'heroStat3Value','heroStat3Label','teacherLabel','teacherName','teacherPhoto',
    'teacherPhotoAlt','teacherBio','satisfactionValue','satisfactionLabel',
    'coursesSectionTitle','coursesSectionDesc','courses',
    'approach','why','scheduleSectionTitle','scheduleSectionDesc','schedule',
    'formSectionTitle','formSectionDesc','appsScriptUrl',
    'footerBrand','footerBrandAccent','footerDesc','footerHotline','footerAddress','footerMap',
    'zaloUrl','hotlineNumber','adminPassword'
  ];
  const sanitized = {};
  for (const key of allowedKeys) {
    if (newData[key] !== undefined) sanitized[key] = newData[key];
  }

  // Validate courses array structure
  if (sanitized.courses) {
    if (!Array.isArray(sanitized.courses)) {
      return res.status(400).json({ error: 'invalid_courses_format' });
    }
    sanitized.courses = sanitized.courses.map(function(c) {
      return {
        name: String(c.name||'').substring(0, 200),
        shortName: String(c.shortName||'').substring(0, 50),
        emoji: String(c.emoji||'').substring(0, 10),
        color: ['blue','green','purple','orange'].indexOf(c.color) !== -1 ? c.color : 'blue',
        visible: !!c.visible,
        sub: String(c.sub||'').substring(0, 200),
        desc: String(c.desc||'').substring(0, 2000),
        features: Array.isArray(c.features) ? c.features.map(function(f){ return String(f).substring(0,200); }) : [],
        duration: String(c.duration||'').substring(0, 50),
        maxStudents: String(c.maxStudents||'').substring(0, 50),
        sessions: String(c.sessions||'').substring(0, 50)
      };
    });
  }

  // Validate schedule array structure
  if (sanitized.schedule) {
    if (!Array.isArray(sanitized.schedule)) {
      return res.status(400).json({ error: 'invalid_schedule_format' });
    }
    sanitized.schedule = sanitized.schedule.map(function(s) {
      return {
        class: String(s.class||'').substring(0, 100),
        time: String(s.time||'').substring(0, 100),
        days: String(s.days||'').substring(0, 100),
        status: ['available','almost_full','full'].indexOf(s.status) !== -1 ? s.status : 'available',
        statusText: String(s.statusText||'').substring(0, 100)
      };
    });
  }

  // Preserve adminPassword from current data (never overwrite from client)
  const currentData = await getData();
  sanitized.adminPassword = currentData.adminPassword;
  await saveData(sanitized);
  res.json({ ok: true });
});

// ===== API: CHANGE PASSWORD =====
app.post('/api/admin/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'password_too_short' });
  }
  if (newPassword === DEFAULT_PASSWORD) {
    return res.status(400).json({ error: 'password_too_common' });
  }

  const hash = await getAdminPassword();
  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(currentPassword, hash);
  } else {
    valid = (currentPassword === hash);
  }

  if (!valid) return res.status(401).json({ error: 'wrong_password' });

  const newHash = await bcrypt.hash(newPassword, 10);
  await setAdminPassword(newHash);
  res.json({ ok: true });
});

// ===== API: UPDATE COURSE VISIBLE (fast — single query) =====
app.post('/api/admin/update-course-visible', async (req, res) => {
  const { password, courseId, visible } = req.body;
  if (!password || courseId === undefined || visible === undefined) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const hash = await getAdminPassword();
  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = (password === hash);
  }
  if (!valid) return res.status(401).json({ error: 'wrong_password' });

  if (useDb) {
    try {
      await db.query('UPDATE courses SET visible = $1 WHERE id = $2', [visible, courseId]);
      return res.json({ ok: true });
    } catch(e) {
      console.error('⚠️ DB update visible error:', e.message);
    }
  }
  // File fallback
  const data = readDataFile();
  const course = data.courses.find(c => c.id === courseId || data.courses.indexOf(c) === courseId);
  if (course) {
    course.visible = visible;
    writeDataFile(data);
  }
  res.json({ ok: true });
});
app.post('/api/admin/reset-password', async (req, res) => {
  const { secret } = req.body;
  // Use a simple secret to prevent unauthorized resets
  if (secret !== RESET_SECRET) {
    return res.status(403).json({ error: 'invalid_secret' });
  }
  await setAdminPassword(DEFAULT_PASSWORD);
  res.json({ ok: true, message: 'Password reset to admin123' });
});

// ===== API: SEED DATA (manual reset — use with caution) =====
// This OVERWRITES all data from default-data.json. Password is preserved.
app.post('/api/seed', async (req, res) => {
  try {
    const defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, 'default-data.json'), 'utf8'));
    // Preserve current adminPassword — never overwrite it
    const currentData = await getData();
    const savedPassword = currentData ? currentData.adminPassword : null;
    defaultData.adminPassword = savedPassword || defaultData.adminPassword;
    await saveData(defaultData);
    res.json({ ok: true, message: 'Data seeded successfully (password preserved)' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== API: FORM SUBMISSION =====
app.post('/api/register', async (req, res) => {
  const { parentName, phone, studentName, class: className, note } = req.body;
  if (!parentName || !phone || !studentName || !className) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const data = await getData();
  const url = data.appsScriptUrl;

  if (!url || url.includes('YOUR_SCRIPT_ID') || url.includes('YOUR_APPS_SCRIPT')) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parentName, phone, studentName, class: className, note: note || '' })
  })
    .then(r => {
      if (!r.ok) throw new Error('Apps Script error: ' + r.status);
      res.json({ ok: true });
    })
    .catch(err => {
      console.error('Form forward error:', err.message);
      res.status(502).json({ error: 'forward_failed' });
    });
});

// ===== STARTUP =====
(async function() {
  await dbInit();
  await autoInit();
  
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Storage: ${useDb ? 'PostgreSQL' : 'File (data.json)'}`);
  });
})();
