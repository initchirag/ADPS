const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/lineage
router.get('/', requireAuth, (req, res) => {
  const relationships = db.prepare('SELECT * FROM lineage_relationships ORDER BY created_at ASC').all();
  res.json(relationships);
});

// GET /api/lineage/transformations
router.get('/transformations', requireAuth, (req, res) => {
  const transforms = db.prepare('SELECT * FROM transformations ORDER BY created_at ASC').all();
  const parsed = transforms.map(t => ({ ...t, parameters: JSON.parse(t.parameters) }));
  res.json(parsed);
});

// POST /api/lineage/transformations
router.post('/transformations', requireAuth, (req, res) => {
  const { dataset_id, version_id, type, description, parameters } = req.body;
  if (!dataset_id || !type) return res.status(400).json({ error: 'dataset_id and type are required' });

  const id  = `t${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`INSERT INTO transformations (id, dataset_id, version_id, type, description, parameters, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, dataset_id, version_id || '', type, description || '', JSON.stringify(parameters || {}), req.user.id, now);

  const transform = db.prepare('SELECT * FROM transformations WHERE id = ?').get(id);
  res.status(201).json({ ...transform, parameters: JSON.parse(transform.parameters) });
});

module.exports = router;
