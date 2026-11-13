const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.blocked) return res.status(403).json({ error: 'Account is blocked. Contact admin.' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // Update last login + session count
  db.prepare('UPDATE users SET last_login = ?, session_count = session_count + 1 WHERE id = ?')
    .run(new Date().toISOString(), user.id);

  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  // Log the action
  db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
              VALUES (lower(hex(randomblob(16))), ?, ?, 'VIEW', 'Session', ?, ?, ?)`)
    .run(user.id, user.name, user.id, `User logged in from session`, new Date().toISOString());

  res.json({ token, user: payload });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  // Update uptime (rough estimate: 1 minute per logout call, real tracking would use login time)
  const loginUser = db.prepare('SELECT last_login FROM users WHERE id = ?').get(req.user.id);
  if (loginUser?.last_login) {
    const minutes = (Date.now() - new Date(loginUser.last_login).getTime()) / 60000;
    db.prepare('UPDATE users SET total_uptime_minutes = total_uptime_minutes + ? WHERE id = ?')
      .run(Math.round(minutes), req.user.id);
  }

  db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
              VALUES (lower(hex(randomblob(16))), ?, ?, 'VIEW', 'Session', ?, ?, ?)`)
    .run(req.user.id, req.user.name, req.user.id, `User logged out`, new Date().toISOString());

  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, blocked, chatbot_enabled, created_at, last_login, session_count, total_uptime_minutes FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
