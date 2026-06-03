const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const DEFAULT_PASSWORD = 'admin123';
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
    settings.rows.forEach(r => { data[r.key] = r.value; });
    
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

async function dbDeleteAllCourses() {
  if (!useDb) return;
  await db.query('DELETE FROM courses');
}

async function dbInsertCourse(c, sortOrder) {
  if (!useDb) return;
  await db.query(
    `INSERT INTO courses (name, short_name, emoji, color, visible, sub, description, features, duration, max_students, sessions, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [c.name, c.shortName, c.emoji, c.color, c.visible !== false, c.sub||'', c.desc||'', (c.features||[]).join('\n'), c.duration||'', c.maxStudents||'', c.sessions||'', sortOrder]
  );
}

async function dbDeleteAllSchedule() {
  if (!useDb) return;
  await db.query('DELETE FROM schedule');
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

function isDefaultPassword(data) {
  return data.adminPassword === DEFAULT_PASSWORD;
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
      // Save settings
      const skipKeys = ['adminPassword', 'courses', 'schedule'];
      for (const key of Object.keys(data)) {
        if (!skipKeys.includes(key)) {
          await dbSetSetting(key, data[key]);
        }
      }
      // Save courses (delete + reinsert)
      await dbDeleteAllCourses();
      for (let i = 0; i < (data.courses||[]).length; i++) {
        await dbInsertCourse(data.courses[i], i);
      }
      // Save schedule
      await dbDeleteAllSchedule();
      for (let i = 0; i < (data.schedule||[]).length; i++) {
        await dbInsertSchedule(data.schedule[i], i);
      }
      return;
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
async function autoInit() {
  const data = await getData();
  if (!data.siteName && !data.courses) {
    try {
      const defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, 'default-data.json'), 'utf8'));
      const merged = { ...defaultData, ...data };
      await saveData(merged);
      console.log('✅ Auto-initialized from default-data.json');
    } catch(e) {
      console.log('⚠️ Could not auto-init:', e.message);
    }
  } else {
    console.log('✅ Data already exists, skipping auto-init');
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

setInterval(function() {
  const now = Date.now();
  for (const [ip, rec] of loginAttempts) {
    if (now > rec.resetTime) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000);

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

function requireAjax(req, res, next) {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

// ===== API: PUBLIC DATA =====
app.get('/api/data', async (req, res) => {
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

  const hash = await getAdminPassword();
  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = (password === hash);
  }

  if (!valid) return res.status(401).json({ error: 'wrong_password' });

  // Preserve adminPassword from current data
  const currentData = await getData();
  newData.adminPassword = currentData.adminPassword;
  await saveData(newData);
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
