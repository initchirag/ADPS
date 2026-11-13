const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, (req, res) => {
  const total_datasets  = db.prepare('SELECT COUNT(*) as c FROM datasets').get().c;
  const total_users     = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const total_versions  = db.prepare('SELECT SUM(current_version) as s FROM datasets').get().s || 0;
  const files_analyzed  = db.prepare('SELECT COUNT(*) as c FROM analyzed_files WHERE uploaded_by = ?').get(req.user.id).c;

  const recent_activity = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10').all();

  res.json({
    total_datasets,
    total_users,
    total_versions,
    files_analyzed,
    recent_activity,
  });
});

module.exports = router;
