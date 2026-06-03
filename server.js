const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const DEFAULT_PASSWORD = 'admin123';

// ===== RATE LIMITING =====
const loginAttempts = new Map(); // ip → { count, resetTime }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 phút

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

// Clean up old entries every 10 phút
setInterval(function() {
  const now = Date.now();
  for (const [ip, rec] of loginAttempts) {
    if (now > rec.resetTime) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000);

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Simple CSRF-like check: require X-Requested-With header for admin API
function requireAjax(req, res, next) {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'forbidden' });
  }
  next;
}

// ===== DATA HELPERS =====
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Check if password is still the default plaintext
function isDefaultPassword(data) {
  return data.adminPassword === DEFAULT_PASSWORD;
}

// ===== API: INIT — merge default content into data.json if empty =====
app.post('/api/init', async (req, res) => {
  const data = readData();
  // If data.json has no content fields (only password or empty), merge defaults
  if (!data.siteName && !data.courses) {
    try {
      const defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, 'default-data.json'), 'utf8'));
      // Merge: keep existing password, fill in everything else from defaults
      const merged = { ...defaultData, ...data };
      writeData(merged);
      res.json({ ok: true, message: 'Initialized with default content. Default password: admin123' });
    } catch(e) {
      const fallback = { adminPassword: DEFAULT_PASSWORD };
      writeData(fallback);
      res.json({ ok: true, message: 'Initialized with fallback. Default password: admin123' });
    }
  } else {
    res.json({ ok: false, message: 'Already has content, skipping init' });
  }
});
app.get('/api/data', (req, res) => {
  const data = readData();
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

  const data = readData();
  const hash = data.adminPassword;

  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = (password === hash);
  }

  if (valid) {
    const mustChangePassword = isDefaultPassword(data);
    res.json({ ok: true, mustChangePassword });
  } else {
    res.status(401).json({ error: 'wrong_password' });
  }
});

// ===== API: SAVE all data (admin only) =====
app.post('/api/admin/save', async (req, res) => {
  const { password, data: newData } = req.body;
  if (!password) return res.status(401).json({ error: 'missing_password' });

  const data = readData();
  const hash = data.adminPassword;

  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = (password === hash);
  }

  if (!valid) return res.status(401).json({ error: 'wrong_password' });

  // Preserve sensitive fields that shouldn't be overwritten by save
  newData.adminPassword = data.adminPassword;
  writeData(newData);
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

  const data = readData();
  const hash = data.adminPassword;

  let valid = false;
  if (hash && hash.startsWith('$2')) {
    valid = await bcrypt.compare(currentPassword, hash);
  } else {
    valid = (currentPassword === hash);
  }

  if (!valid) return res.status(401).json({ error: 'wrong_password' });

  data.adminPassword = await bcrypt.hash(newPassword, 10);
  writeData(data);
  res.json({ ok: true });
});

// ===== API: FORM SUBMISSION (public) =====
app.post('/api/register', (req, res) => {
  const { parentName, phone, studentName, class: className, note } = req.body;
  if (!parentName || !phone || !studentName || !className) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const data = readData();
  const url = data.appsScriptUrl;

  if (!url || url.includes('YOUR_SCRIPT_ID') || url.includes('YOUR_APPS_SCRIPT')) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  // Forward to Google Apps Script
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

// ===== AUTO-INIT on startup =====
// If data.json doesn't exist or has no content, merge defaults
(function autoInit() {
  const data = readData();
  if (!data.siteName && !data.courses) {
    try {
      const defaultData = JSON.parse(fs.readFileSync(path.join(__dirname, 'default-data.json'), 'utf8'));
      const merged = { ...defaultData, ...data };
      writeData(merged);
      console.log('✅ Auto-initialized data.json from default-data.json');
    } catch(e) {
      console.log('⚠️ Could not auto-init:', e.message);
    }
  } else {
    console.log('✅ data.json already has content, skipping auto-init');
  }
})();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`data.json loaded: ${path.basename(DATA_FILE)}`);
});
