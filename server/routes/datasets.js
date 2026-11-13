const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const logAction = (userId, userName, actionType, resourceName, resourceId, details) => {
  db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
              VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?)`)
    .run(userId, userName, actionType, resourceName, resourceId, details, new Date().toISOString());
};

// GET /api/datasets
router.get('/', requireAuth, (req, res) => {
  const datasets = db.prepare('SELECT * FROM datasets ORDER BY created_at DESC').all();
  res.json(datasets);
});

// GET /api/datasets/:id
router.get('/:id', requireAuth, (req, res) => {
  const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

  const versions = db.prepare('SELECT * FROM dataset_versions WHERE dataset_id = ? ORDER BY version_number ASC').all(req.params.id);
  const versionsWithCols = versions.map(v => ({ ...v, columns: JSON.parse(v.columns) }));

  logAction(req.user.id, req.user.name, 'VIEW', dataset.name, dataset.id, `Viewed dataset details`);
  res.json({ ...dataset, versions: versionsWithCols });
});

// POST /api/datasets
router.post('/', requireAuth, (req, res) => {
  const { name, description, source_type, file_type, row_count, column_count } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const id = String(Date.now());
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO datasets (id, name, description, source_id, source_type, created_by, created_at, updated_at, current_version, row_count, column_count, file_type)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
    .run(id, name, description || '', `s${id}`, source_type || 'manual', req.user.id, now, now, row_count || 0, column_count || 0, file_type || 'csv');

  db.prepare(`INSERT INTO dataset_versions (id, dataset_id, version_number, columns, created_by, created_at, change_summary)
              VALUES (?, ?, 1, ?, ?, ?, ?)`)
    .run(`v${id}`, id, '[]', req.user.id, now, 'Initial dataset creation');

  logAction(req.user.id, req.user.name, 'CREATE', name, id, `Created new dataset: ${name}`);

  const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(id);
  res.status(201).json(dataset);
});

// PUT /api/datasets/:id
router.put('/:id', requireAuth, (req, res) => {
  const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

  const { name, description, change_summary } = req.body;
  const now = new Date().toISOString();
  const newVersion = dataset.current_version + 1;

  db.prepare('UPDATE datasets SET name = ?, description = ?, updated_at = ?, current_version = ? WHERE id = ?')
    .run(name || dataset.name, description || dataset.description, now, newVersion, req.params.id);

  db.prepare(`INSERT INTO dataset_versions (id, dataset_id, version_number, columns, created_by, created_at, change_summary)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(`v${Date.now()}`, req.params.id, newVersion, '[]', req.user.id, now, change_summary || `Updated to v${newVersion}`);

  logAction(req.user.id, req.user.name, 'UPDATE', name || dataset.name, req.params.id, change_summary || `Updated dataset to v${newVersion}`);

  const updated = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// POST /api/datasets/:id/versions  — explicitly bump version
router.post('/:id/versions', requireAuth, (req, res) => {
  const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

  const { change_summary, columns } = req.body;
  const now        = new Date().toISOString();
  const newVersion = dataset.current_version + 1;

  db.prepare('UPDATE datasets SET updated_at = ?, current_version = ? WHERE id = ?')
    .run(now, newVersion, req.params.id);

  const vId = `v${Date.now()}`;
  db.prepare(`INSERT INTO dataset_versions (id, dataset_id, version_number, columns, created_by, created_at, change_summary)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(vId, req.params.id, newVersion, JSON.stringify(columns || []), req.user.id, now,
        change_summary || `v${newVersion}`);

  logAction(req.user.id, req.user.name, 'UPDATE', dataset.name, req.params.id,
            change_summary || `Created version ${newVersion}`);

  const version = db.prepare('SELECT * FROM dataset_versions WHERE id = ?').get(vId);
  res.status(201).json({ ...version, columns: JSON.parse(version.columns) });
});

// DELETE /api/datasets/:id
router.delete('/:id', requireAuth, (req, res) => {
  const dataset = db.prepare('SELECT * FROM datasets WHERE id = ?').get(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

  db.prepare('DELETE FROM datasets WHERE id = ?').run(req.params.id);
  logAction(req.user.id, req.user.name, 'DELETE', dataset.name, req.params.id, `Deleted dataset and all versions`);
  res.json({ message: 'Deleted' });
});

module.exports = router;
