'use strict';
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'adps.db');

// ─── Parameter normaliser ─────────────────────────────────────────────────────
// better-sqlite3 supports run(val,val,...), run([val,val]), run({key:val})
// sql.js needs an array for ? params or {'@key': val} for @key named params
function normalizeParams(args) {
  if (args.length === 0) return [];
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object') {
    // Named param object {key: val} → {'@key': val} for sql.js
    const out = {};
    for (const [k, v] of Object.entries(args[0])) out[`@${k}`] = v;
    return out;
  }
  return args; // positional values as plain array
}

// ─── Compat wrapper (makes sql.js look like better-sqlite3) ───────────────────
function wrapDb(sqlJs) {
  const save = () => {
    const data = sqlJs.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  return {
    prepare(sql) {
      return {
        run(...args) {
          sqlJs.run(sql, normalizeParams(args));
          save();
          return { changes: 1, lastInsertRowid: 0 };
        },
        get(...args) {
          const stmt = sqlJs.prepare(sql);
          stmt.bind(normalizeParams(args));
          if (!stmt.step()) { stmt.free(); return undefined; }
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        },
        all(...args) {
          const stmt = sqlJs.prepare(sql);
          stmt.bind(normalizeParams(args));
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
      };
    },

    exec(sql) {
      sqlJs.exec(sql);
      save();
    },

    pragma(str) {
      try { sqlJs.run(`PRAGMA ${str}`); } catch {}
    },

    _save: save,
  };
}

// ─── Lazy proxy ───────────────────────────────────────────────────────────────
// Routes require('../db') and get this proxy; db.prepare() etc. work once
// init() has resolved and _inner is set (which happens before app.listen()).
let _inner = null;

const dbProxy = new Proxy({}, {
  get(_, prop) {
    if (prop === 'init') return init;
    if (!_inner) throw new Error('DB not ready — init() must resolve before first use');
    return _inner[prop];
  },
});

// ─── Schema ───────────────────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    blocked INTEGER NOT NULL DEFAULT 0,
    chatbot_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_login TEXT,
    session_count INTEGER NOT NULL DEFAULT 0,
    total_uptime_minutes REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    source_id TEXT,
    source_type TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    row_count INTEGER,
    column_count INTEGER,
    file_type TEXT
  );

  CREATE TABLE IF NOT EXISTS dataset_versions (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    columns TEXT NOT NULL DEFAULT '[]',
    created_by TEXT,
    created_at TEXT NOT NULL,
    change_summary TEXT,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transformations (
    id TEXT PRIMARY KEY,
    dataset_id TEXT,
    version_id TEXT,
    type TEXT NOT NULL,
    description TEXT,
    parameters TEXT NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lineage_relationships (
    id TEXT PRIMARY KEY,
    parent_dataset_id TEXT NOT NULL,
    child_dataset_id TEXT NOT NULL,
    transformation_id TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analyzed_files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    size INTEGER,
    type TEXT,
    hash TEXT,
    risk_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'safe',
    issues TEXT NOT NULL DEFAULT '[]',
    cves TEXT NOT NULL DEFAULT '[]',
    lineage TEXT NOT NULL DEFAULT '[]',
    anomalies TEXT NOT NULL DEFAULT '[]',
    version_history TEXT NOT NULL DEFAULT '[]',
    content_summary TEXT NOT NULL DEFAULT '{}',
    uploaded_at TEXT NOT NULL,
    uploaded_by TEXT
  );
`;

// ─── Seed ─────────────────────────────────────────────────────────────────────
function seedIfEmpty(db) {
  const row = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (row && row.c > 0) return;

  console.log('Seeding database...');

  const adminHash = bcrypt.hashSync('rmf@5864', 10);
  const userHash  = bcrypt.hashSync('password', 10);

  // ── Users ──
  const insertUser = db.prepare(`
    INSERT INTO users
      (id, name, email, password_hash, role, blocked, chatbot_enabled, created_at, session_count, total_uptime_minutes)
    VALUES (@id, @name, @email, @password_hash, @role, 0, 1, @created_at, @session_count, @total_uptime_minutes)
  `);

  [
    { id: '1',  name: 'Admin User',   email: 'admin@dataprovenance.com', password_hash: adminHash, role: 'admin', created_at: '2026-01-01T00:00:00.000Z', session_count: 42, total_uptime_minutes: 1800 },
    { id: '2',  name: 'Chirag Singh', email: 'chirag.singh@company.com', password_hash: userHash,  role: 'user',  created_at: '2026-01-15T09:30:00.000Z', session_count: 18, total_uptime_minutes: 320  },
    { id: '3',  name: 'Danish Verma', email: 'danish.verma@company.com', password_hash: userHash,  role: 'user',  created_at: '2026-01-20T10:15:00.000Z', session_count: 12, total_uptime_minutes: 210  },
    { id: '4',  name: 'Rahul Sharma', email: 'rahul.sharma@company.com', password_hash: userHash,  role: 'user',  created_at: '2026-02-01T08:45:00.000Z', session_count: 22, total_uptime_minutes: 440  },
    { id: '5',  name: 'Priya Patel',  email: 'priya.patel@company.com',  password_hash: userHash,  role: 'user',  created_at: '2026-02-05T14:20:00.000Z', session_count: 9,  total_uptime_minutes: 150  },
    { id: '6',  name: 'Amit Kumar',   email: 'amit.kumar@company.com',   password_hash: userHash,  role: 'user',  created_at: '2026-02-10T11:00:00.000Z', session_count: 15, total_uptime_minutes: 290  },
    { id: '7',  name: 'Sneha Reddy',  email: 'sneha.reddy@company.com',  password_hash: userHash,  role: 'user',  created_at: '2026-02-15T13:30:00.000Z', session_count: 7,  total_uptime_minutes: 125  },
    { id: '8',  name: 'Vikram Singh', email: 'vikram.singh@company.com', password_hash: userHash,  role: 'user',  created_at: '2026-02-20T09:00:00.000Z', session_count: 20, total_uptime_minutes: 380  },
    { id: '9',  name: 'Anita Desai',  email: 'anita.desai@company.com',  password_hash: userHash,  role: 'user',  created_at: '2026-02-25T10:45:00.000Z', session_count: 11, total_uptime_minutes: 200  },
    { id: '10', name: 'Rohit Mehta',  email: 'rohit.mehta@company.com',  password_hash: userHash,  role: 'user',  created_at: '2026-03-01T15:00:00.000Z', session_count: 6,  total_uptime_minutes: 95   },
    { id: '11', name: 'Kavita Joshi', email: 'kavita.joshi@company.com', password_hash: userHash,  role: 'user',  created_at: '2026-03-05T12:30:00.000Z', session_count: 14, total_uptime_minutes: 265  },
  ].forEach(u => insertUser.run(u));

  // ── Datasets ──
  const insertDataset = db.prepare(`
    INSERT INTO datasets
      (id, name, description, source_id, source_type, created_by, created_at, updated_at, current_version, row_count, column_count, file_type)
    VALUES (@id, @name, @description, @source_id, @source_type, @created_by, @created_at, @updated_at, @current_version, @row_count, @column_count, @file_type)
  `);

  [
    { id: '1',  name: 'Financial Transaction Records Q1 2026',    description: 'Complete financial transaction data with customer payment details and audit trails',        source_id: 's1',  source_type: 'file',   created_by: '2',  created_at: '2026-03-05T09:30:00.000Z', updated_at: '2026-03-20T14:22:00.000Z', current_version: 3, row_count: 12850, column_count: 15, file_type: 'csv'  },
    { id: '2',  name: 'Customer Identity Verification Database',   description: 'Verified customer identity records with KYC compliance documentation',                     source_id: 's2',  source_type: 'api',    created_by: '3',  created_at: '2026-03-08T11:15:00.000Z', updated_at: '2026-03-18T16:45:00.000Z', current_version: 2, row_count: 8420,  column_count: 12, file_type: 'json' },
    { id: '3',  name: 'Healthcare Patient Records - Confidential', description: 'Anonymized patient healthcare records with treatment history and diagnoses',               source_id: 's3',  source_type: 'manual', created_by: '4',  created_at: '2026-03-12T08:00:00.000Z', updated_at: '2026-03-25T13:30:00.000Z', current_version: 4, row_count: 5230,  column_count: 22, file_type: 'csv'  },
    { id: '4',  name: 'Supply Chain Logistics Data',               description: 'Real-time supply chain tracking with vendor information and shipment details',              source_id: 's4',  source_type: 'api',    created_by: '2',  created_at: '2026-03-15T10:20:00.000Z', updated_at: '2026-03-22T09:15:00.000Z', current_version: 2, row_count: 15600, column_count: 18, file_type: 'json' },
    { id: '5',  name: 'Employee Payroll System Data',              description: 'Comprehensive employee salary, benefits, and tax withholding information',                 source_id: 's5',  source_type: 'file',   created_by: '3',  created_at: '2026-03-01T07:45:00.000Z', updated_at: '2026-03-28T18:20:00.000Z', current_version: 5, row_count: 2840,  column_count: 28, file_type: 'csv'  },
    { id: '6',  name: 'IoT Sensor Network Telemetry',              description: 'Real-time IoT device data streams from manufacturing floor sensors',                       source_id: 's6',  source_type: 'api',    created_by: '4',  created_at: '2026-03-10T12:00:00.000Z', updated_at: '2026-03-29T11:30:00.000Z', current_version: 3, row_count: 45680, column_count: 10, file_type: 'json' },
    { id: '7',  name: 'Cybersecurity Threat Intelligence Feed',    description: 'Aggregated threat intelligence data with CVE mappings and vulnerability assessments',      source_id: 's7',  source_type: 'api',    created_by: '2',  created_at: '2026-03-14T15:30:00.000Z', updated_at: '2026-03-27T10:00:00.000Z', current_version: 6, row_count: 9870,  column_count: 16, file_type: 'json' },
    { id: '8',  name: 'Marketing Campaign Analytics',              description: 'Multi-channel marketing campaign performance metrics and customer engagement data',         source_id: 's8',  source_type: 'file',   created_by: '3',  created_at: '2026-03-18T09:00:00.000Z', updated_at: '2026-03-26T14:50:00.000Z', current_version: 2, row_count: 18920, column_count: 14, file_type: 'csv'  },
    { id: '9',  name: 'Research Lab Experimental Data',            description: 'Scientific research experimental results with statistical analysis and peer review notes', source_id: 's9',  source_type: 'manual', created_by: '4',  created_at: '2026-03-20T13:15:00.000Z', updated_at: '2026-03-28T16:40:00.000Z', current_version: 3, row_count: 3420,  column_count: 32, file_type: 'json' },
    { id: '10', name: 'Regulatory Compliance Audit Logs',          description: 'Complete audit trail for regulatory compliance with GDPR, HIPAA, and SOC2 requirements',  source_id: 's10', source_type: 'file',   created_by: '2',  created_at: '2026-03-22T08:30:00.000Z', updated_at: '2026-03-29T17:25:00.000Z', current_version: 4, row_count: 22340, column_count: 20, file_type: 'csv'  },
  ].forEach(d => insertDataset.run(d));

  // ── Dataset versions ──
  const insertVersion = db.prepare(`
    INSERT INTO dataset_versions (id, dataset_id, version_number, columns, created_by, created_at, change_summary)
    VALUES (@id, @dataset_id, @version_number, @columns, @created_by, @created_at, @change_summary)
  `);

  const cols = JSON.stringify(['transaction_id','customer_id','amount','currency','payment_method','timestamp','status','merchant_id','category','location','ip_address','device_type','fraud_score','verified','notes']);
  [
    { id: 'v1', dataset_id: '1', version_number: 1, columns: cols, created_by: '2', created_at: '2026-03-05T09:30:00.000Z', change_summary: 'Initial data import from payment gateway' },
    { id: 'v2', dataset_id: '1', version_number: 2, columns: cols, created_by: '2', created_at: '2026-03-15T11:20:00.000Z', change_summary: 'Added 3,200 new transactions, updated fraud detection scores' },
    { id: 'v3', dataset_id: '1', version_number: 3, columns: cols, created_by: '2', created_at: '2026-03-20T14:22:00.000Z', change_summary: 'Critical security patch: Removed PII data, anonymized customer identifiers' },
  ].forEach(v => insertVersion.run(v));

  // ── Transformations ──
  const insertTransform = db.prepare(`
    INSERT INTO transformations (id, dataset_id, version_id, type, description, parameters, created_by, created_at)
    VALUES (@id, @dataset_id, @version_id, @type, @description, @parameters, @created_by, @created_at)
  `);

  [
    { id: 't1', dataset_id: '2',  version_id: 'v1', type: 'clean',     description: 'Data cleansing: Remove duplicate customer records and validate KYC documentation',  parameters: JSON.stringify({ remove_duplicates: true, validate_kyc: true, standardize_addresses: true }),            created_by: '3', created_at: '2026-03-08T12:30:00.000Z' },
    { id: 't2', dataset_id: '3',  version_id: 'v1', type: 'filter',    description: 'Anonymization: Strip PII and apply differential privacy to patient records',        parameters: JSON.stringify({ anonymize_pii: true, differential_privacy: true, k_anonymity: 5 }),               created_by: '4', created_at: '2026-03-12T14:15:00.000Z' },
    { id: 't3', dataset_id: '7',  version_id: 'v1', type: 'aggregate', description: 'Threat aggregation: Group vulnerabilities by CVE severity and affected systems',    parameters: JSON.stringify({ group_by: ['severity','system'], aggregate_type: 'count', include_cve_mapping: true }), created_by: '2', created_at: '2026-03-14T16:00:00.000Z' },
    { id: 't4', dataset_id: '8',  version_id: 'v1', type: 'enrich',    description: 'Supply chain enrichment: Merge logistics metrics with marketing attribution data',  parameters: JSON.stringify({ join_key: 'product_id', attribution_window_days: 30 }),                          created_by: '3', created_at: '2026-03-18T09:30:00.000Z' },
    { id: 't5', dataset_id: '10', version_id: 'v1', type: 'aggregate', description: 'Compliance aggregation: Consolidate payroll events into audit log entries',          parameters: JSON.stringify({ event_types: ['salary_change','termination','hire'], include_tax_records: true }),  created_by: '2', created_at: '2026-03-22T10:00:00.000Z' },
    { id: 't6', dataset_id: '7',  version_id: 'v2', type: 'enrich',    description: 'IoT threat correlation: Enrich threat feed with sensor anomaly data',                parameters: JSON.stringify({ correlation_window_minutes: 15, anomaly_threshold: 0.85 }),                     created_by: '4', created_at: '2026-03-23T14:45:00.000Z' },
    { id: 't7', dataset_id: '10', version_id: 'v2', type: 'filter',    description: 'Transaction audit filter: Extract compliance-relevant financial events',              parameters: JSON.stringify({ min_amount: 10000, flag_international: true, include_reversals: true }),         created_by: '2', created_at: '2026-03-24T08:15:00.000Z' },
    { id: 't8', dataset_id: '9',  version_id: 'v1', type: 'aggregate', description: 'Threat intelligence research: Aggregate CVE data into research datasets',            parameters: JSON.stringify({ group_by: 'cve_severity', include_poc: true }),                                 created_by: '4', created_at: '2026-03-26T11:30:00.000Z' },
  ].forEach(t => insertTransform.run(t));

  // ── Lineage relationships ──
  const insertLineage = db.prepare(`
    INSERT INTO lineage_relationships (id, parent_dataset_id, child_dataset_id, transformation_id, created_at)
    VALUES (@id, @parent_dataset_id, @child_dataset_id, @transformation_id, @created_at)
  `);

  [
    { id: 'l1', parent_dataset_id: '1', child_dataset_id: '2',  transformation_id: 't1', created_at: '2026-03-08T12:30:00.000Z' },
    { id: 'l2', parent_dataset_id: '2', child_dataset_id: '3',  transformation_id: 't2', created_at: '2026-03-12T14:15:00.000Z' },
    { id: 'l3', parent_dataset_id: '3', child_dataset_id: '7',  transformation_id: 't3', created_at: '2026-03-14T16:00:00.000Z' },
    { id: 'l4', parent_dataset_id: '4', child_dataset_id: '8',  transformation_id: 't4', created_at: '2026-03-18T09:30:00.000Z' },
    { id: 'l5', parent_dataset_id: '5', child_dataset_id: '10', transformation_id: 't5', created_at: '2026-03-22T10:00:00.000Z' },
    { id: 'l6', parent_dataset_id: '6', child_dataset_id: '7',  transformation_id: 't6', created_at: '2026-03-23T14:45:00.000Z' },
    { id: 'l7', parent_dataset_id: '1', child_dataset_id: '10', transformation_id: 't7', created_at: '2026-03-24T08:15:00.000Z' },
    { id: 'l8', parent_dataset_id: '7', child_dataset_id: '9',  transformation_id: 't8', created_at: '2026-03-26T11:30:00.000Z' },
  ].forEach(l => insertLineage.run(l));

  // ── Audit logs ──
  const insertLog = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action_type, resource_name, resource_id, details, timestamp)
    VALUES (@id, @user_id, @user_name, @action_type, @resource_name, @resource_id, @details, @timestamp)
  `);

  [
    { id: uuidv4(), user_id: '2', user_name: 'Chirag Singh', action_type: 'CREATE',    resource_name: 'Financial Transaction Records Q1 2026',    resource_id: '1',  details: 'Imported 12,850 transaction records from payment gateway CSV export',                             timestamp: '2026-03-05T09:30:00.000Z' },
    { id: uuidv4(), user_id: '3', user_name: 'Danish Verma', action_type: 'CREATE',    resource_name: 'Customer Identity Verification Database',    resource_id: '2',  details: 'Created KYC dataset with 8,420 verified customer identity records via API integration',          timestamp: '2026-03-08T11:15:00.000Z' },
    { id: uuidv4(), user_id: '3', user_name: 'Danish Verma', action_type: 'TRANSFORM', resource_name: 'Customer Identity Verification Database',    resource_id: '2',  details: 'Applied clean transformation: removed duplicates, validated KYC docs, standardized addresses',  timestamp: '2026-03-08T12:30:00.000Z' },
    { id: uuidv4(), user_id: '4', user_name: 'Rahul Sharma', action_type: 'CREATE',    resource_name: 'Healthcare Patient Records - Confidential',  resource_id: '3',  details: 'Uploaded 5,230 anonymized patient records with treatment history',                               timestamp: '2026-03-12T08:00:00.000Z' },
    { id: uuidv4(), user_id: '4', user_name: 'Rahul Sharma', action_type: 'TRANSFORM', resource_name: 'Healthcare Patient Records - Confidential',  resource_id: '3',  details: 'Applied differential privacy filter with k-anonymity=5, stripped all PII fields',               timestamp: '2026-03-12T14:15:00.000Z' },
    { id: uuidv4(), user_id: '2', user_name: 'Chirag Singh', action_type: 'UPDATE',    resource_name: 'Financial Transaction Records Q1 2026',    resource_id: '1',  details: 'Added 3,200 new transactions; updated fraud detection scores for all records (v2)',              timestamp: '2026-03-15T11:20:00.000Z' },
    { id: uuidv4(), user_id: '2', user_name: 'Chirag Singh', action_type: 'CREATE',    resource_name: 'Cybersecurity Threat Intelligence Feed',    resource_id: '7',  details: 'Integrated threat intelligence API feed with 9,870 CVE-mapped vulnerability records',           timestamp: '2026-03-14T15:30:00.000Z' },
    { id: uuidv4(), user_id: '2', user_name: 'Chirag Singh', action_type: 'UPDATE',    resource_name: 'Financial Transaction Records Q1 2026',    resource_id: '1',  details: 'Security patch v3: anonymized customer identifiers, removed raw PII from transaction records',  timestamp: '2026-03-20T14:22:00.000Z' },
    { id: uuidv4(), user_id: '1', user_name: 'Admin User',   action_type: 'VIEW',      resource_name: 'Regulatory Compliance Audit Logs',          resource_id: '10', details: 'Admin audit review of full compliance log for quarterly SOC2 assessment',                        timestamp: '2026-03-25T10:00:00.000Z' },
    { id: uuidv4(), user_id: '3', user_name: 'Danish Verma', action_type: 'EXPORT',    resource_name: 'Healthcare Patient Records - Confidential',  resource_id: '3',  details: 'Exported anonymized subset as JSON for external research collaboration',                         timestamp: '2026-03-28T14:30:00.000Z' },
  ].forEach(l => insertLog.run(l));

  // Force a save with all seed data
  _inner._save();
  console.log('Database seeded successfully.');
}

// ─── Init (async — awaited in index.js before server starts) ──────────────────
async function init() {
  if (_inner) return dbProxy; // already initialized

  const initSqlJs = require('sql.js');
  // Locate the WASM file next to sql.js's own JS entry point
  const sqlJsDir = path.dirname(require.resolve('sql.js'));
  const SQL = await initSqlJs({
    locateFile: file => path.join(sqlJsDir, file),
  });

  let sqlJs;
  if (fs.existsSync(DB_PATH)) {
    // Load existing database from disk
    sqlJs = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('Loaded existing database from', DB_PATH);
  } else {
    // Fresh database
    sqlJs = new SQL.Database();
    console.log('Created new database at', DB_PATH);
  }

  _inner = wrapDb(sqlJs);

  // Create tables if they don't exist
  sqlJs.exec(SCHEMA);

  // Enable foreign keys (sql.js supports this pragma)
  sqlJs.run('PRAGMA foreign_keys = ON');

  // Seed if empty
  seedIfEmpty(_inner);

  return dbProxy;
}

module.exports = dbProxy;
