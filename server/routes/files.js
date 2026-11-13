const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/files — analyzed files for current user
router.get('/', requireAuth, (req, res) => {
  const files = db.prepare('SELECT * FROM analyzed_files WHERE uploaded_by = ? ORDER BY uploaded_at DESC').all(req.user.id);
  const parsed = files.map(f => ({
    ...f,
    issues:          JSON.parse(f.issues),
    cves:            JSON.parse(f.cves),
    lineage:         JSON.parse(f.lineage),
    anomalies:       JSON.parse(f.anomalies),
    version_history: JSON.parse(f.version_history),
    content_summary: JSON.parse(f.content_summary),
  }));
  res.json(parsed);
});

// GET /api/files/:id
router.get('/:id', requireAuth, (req, res) => {
  const file = db.prepare('SELECT * FROM analyzed_files WHERE id = ? AND uploaded_by = ?').get(req.params.id, req.user.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  res.json({
    ...file,
    issues:          JSON.parse(file.issues),
    cves:            JSON.parse(file.cves),
    lineage:         JSON.parse(file.lineage),
    anomalies:       JSON.parse(file.anomalies),
    version_history: JSON.parse(file.version_history),
    content_summary: JSON.parse(file.content_summary),
  });
});

// POST /api/files — save analysis result
router.post('/', requireAuth, (req, res) => {
  const { id, name, size, type, hash, risk_score, status, issues, cves, lineage, anomalies, version_history, content_summary, uploaded_at } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });

  db.prepare(`
    INSERT OR REPLACE INTO analyzed_files
      (id, name, size, type, hash, risk_score, status, issues, cves, lineage, anomalies, version_history, content_summary, uploaded_at, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, size || 0, type || '', hash || '', risk_score || 0, status || 'safe',
    JSON.stringify(issues || []),
    JSON.stringify(cves || []),
    JSON.stringify(lineage || []),
    JSON.stringify(anomalies || []),
    JSON.stringify(version_history || []),
    JSON.stringify(content_summary || {}),
    uploaded_at || new Date().toISOString(),
    req.user.id,
  );

  db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
              VALUES (lower(hex(randomblob(16))), ?, ?, 'CREATE', ?, ?, ?, ?)`)
    .run(req.user.id, req.user.name, name, id, `Analyzed file: ${name} — risk score ${risk_score}, status: ${status}`, new Date().toISOString());

  res.status(201).json({ id });
});

// DELETE /api/files/:id
router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM analyzed_files WHERE id = ? AND uploaded_by = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
