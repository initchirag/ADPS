const express = require('express');
const cors    = require('cors');
const db      = require('./db'); // lazy proxy — not ready until db.init() resolves

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

// Mount routes (they require db lazily — no calls happen until requests arrive)
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/datasets',   require('./routes/datasets'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/lineage',    require('./routes/lineage'));
app.use('/api/files',      require('./routes/files'));
app.use('/api/dashboard',  require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Initialize DB first, then open the server for traffic
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ADPS backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Fatal: could not initialize database:', err);
    process.exit(1);
  });
