const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit-logs
router.get('/', requireAuth, (req, res) => {
  const { action_type, user_id, limit = 100 } = req.query;
  let query = 'SELECT * FROM audit_logs';
  const params = [];
  const conditions = [];

  if (action_type) { conditions.push('action_type = ?'); params.push(action_type); }
  if (user_id)     { conditions.push('user_id = ?');     params.push(user_id); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(Number(limit));

  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

// POST /api/audit-logs
router.post('/', requireAuth, (req, res) => {
  const { action_type, resource_name, resource_id, details } = req.body;
  if (!action_type || !resource_name) return res.status(400).json({ error: 'action_type and resource_name required' });

  db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
              VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, req.user.name, action_type, resource_name, resource_id || null, details || null, new Date().toISOString());

  res.status(201).json({ message: 'Logged' });
});

module.exports = router;
