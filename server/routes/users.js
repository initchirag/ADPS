const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only
router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, role, blocked, chatbot_enabled, created_at, last_login, session_count, total_uptime_minutes
    FROM users ORDER BY created_at ASC
  `).all();
  res.json(users);
});

// GET /api/users/:id — admin or self
router.get('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.prepare('SELECT id, name, email, role, blocked, chatbot_enabled, created_at, last_login, session_count, total_uptime_minutes FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/users/:id/block — admin only
router.put('/:id/block', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot block admin user' });

  const newBlocked = user.blocked ? 0 : 1;
  db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(newBlocked, req.params.id);

  const action = newBlocked ? 'blocked' : 'unblocked';
  db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
              VALUES (lower(hex(randomblob(16))), ?, ?, 'UPDATE', ?, ?, ?, ?)`)
    .run(req.user.id, req.user.name, user.name, user.id, `Admin ${action} user account: ${user.email}`, new Date().toISOString());

  res.json({ id: user.id, blocked: !!newBlocked });
});

// PUT /api/users/:id/chatbot — admin only
router.put('/:id/chatbot', requireAdmin, (req, res) => {
  const { enabled } = req.body;
  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET chatbot_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, req.params.id);
  res.json({ id: user.id, chatbot_enabled: !!enabled });
});

module.exports = router;
