import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  ServerCog,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Play,
  FileText,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── types ────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ExportFmt = 'json' | 'csv' | 'txt';

interface Finding {
  severity: Severity;
  category: string;
  message: string;
  line?: number;
  snippet?: string;
  recommendation: string;
}

interface AuditReport {
  filename: string;
  filesize: number;
  auditType: string;
  scannedAt: string;
  linesAnalyzed: number;
  riskScore: number;
  riskLevel: 'safe' | 'moderate' | 'critical';
  findings: Finding[];
  stats: { tables: number; views: number; triggers: number; procedures: number; grants: number };
}

// ─── real SQL pattern analysis ─────────────────────────────────────────────────

interface RuleSet {
  regex: RegExp;
  severity: Severity;
  category: string;
  message: string;
  recommendation: string;
}

const ALL_RULES: RuleSet[] = [
  // Critical
  {
    regex: /IDENTIFIED\s+BY\s+'[^']{1,40}'/gi,
    severity: 'critical', category: 'Hardcoded Credentials',
    message: 'Plaintext password in IDENTIFIED BY clause',
    recommendation: 'Use password hashing functions (e.g., SHA2) and avoid committing SQL files with credentials',
  },
  {
    regex: /PASSWORD\s*=\s*'[^']{1,40}'/gi,
    severity: 'critical', category: 'Hardcoded Credentials',
    message: 'Hardcoded password assignment found',
    recommendation: 'Store credentials in secrets management tools (Vault, AWS Secrets Manager), never in SQL files',
  },
  {
    regex: /IDENTIFIED\s+BY\s*''\s*|PASSWORD\s*\(\s*''\s*\)/gi,
    severity: 'critical', category: 'Empty Password',
    message: 'User account created with empty password',
    recommendation: 'Enforce non-empty passwords via MySQL validate_password plugin or equivalent',
  },
  {
    regex: /SET\s+GLOBAL\s+\w+\s*=\s*(?:OFF|0|'off')/gi,
    severity: 'critical', category: 'Security Feature Disabled',
    message: 'Security-relevant global setting disabled',
    recommendation: 'Audit all SET GLOBAL statements — disabling security features can expose the server',
  },

  // High
  {
    regex: /GRANT\s+ALL\s+(?:PRIVILEGES\s+)?ON/gi,
    severity: 'high', category: 'Overprivileged Account',
    message: 'GRANT ALL PRIVILEGES — violates principle of least privilege',
    recommendation: 'Grant only specific permissions (SELECT, INSERT, UPDATE) per role',
  },
  {
    regex: /@\s*'%'/g,
    severity: 'high', category: 'Wildcard Host Access',
    message: "User granted access from any host ('%')",
    recommendation: "Restrict host to specific IPs or subnets instead of using wildcard '%'",
  },
  {
    regex: /DROP\s+TABLE\s+(?!IF\s+EXISTS\b)/gi,
    severity: 'high', category: 'Destructive Operation',
    message: 'DROP TABLE without IF EXISTS guard',
    recommendation: 'Use DROP TABLE IF EXISTS to prevent silent failures; ensure this is intentional',
  },
  {
    regex: /TRUNCATE\s+TABLE\s+\w+/gi,
    severity: 'high', category: 'Destructive Operation',
    message: 'TRUNCATE TABLE — irreversible bulk deletion',
    recommendation: 'Confirm this is intentional; consider using DELETE with conditions and transaction wrapping',
  },
  {
    regex: /DELETE\s+FROM\s+\w+\s*(?:;|\n|$)/gi,
    severity: 'high', category: 'Unguarded Delete',
    message: 'DELETE FROM table without WHERE clause — deletes all rows',
    recommendation: 'Always include a WHERE clause; use SELECT first to verify scope',
  },
  {
    regex: /WITH\s+GRANT\s+OPTION/gi,
    severity: 'high', category: 'Grant Escalation',
    message: 'WITH GRANT OPTION allows the user to grant their privileges to others',
    recommendation: 'Remove WITH GRANT OPTION unless delegation is explicitly required',
  },

  // Medium
  {
    regex: /(?:email|phone|ssn|passport|dob|birth_date|credit_card|card_number|national_id)\s+(?:VARCHAR|TEXT|CHAR)/gi,
    severity: 'medium', category: 'PII Without Encryption',
    message: 'PII column stored as plaintext string without encryption annotation',
    recommendation: 'Encrypt PII columns at rest using column-level encryption or application-layer encryption',
  },
  {
    regex: /\bMD5\s*\(/gi,
    severity: 'medium', category: 'Weak Cryptography',
    message: 'MD5 hash function — cryptographically broken, vulnerable to collision and rainbow table attacks',
    recommendation: 'Replace with bcrypt, argon2, or SHA-256 with appropriate salt',
  },
  {
    regex: /\bSHA1\s*\(/gi,
    severity: 'medium', category: 'Weak Cryptography',
    message: 'SHA-1 hash function — deprecated for security purposes (NIST 2015)',
    recommendation: 'Use SHA-256, SHA-3, or dedicated password hashing (bcrypt/argon2)',
  },
  {
    regex: /(?:password|passwd|secret|api_key|token)\s+(?:VARCHAR|TEXT|CHAR)\s*\(\s*(?:[1-9]|[1-2]\d|3[0-2])\s*\)/gi,
    severity: 'medium', category: 'Short Credential Column',
    message: 'Short credential column suggests plaintext password storage (≤32 chars is not a hash)',
    recommendation: 'Password columns should be at least 60 chars to hold bcrypt hashes',
  },
  {
    regex: /INT\s+(?:NOT\s+NULL\s+)?AUTO_INCREMENT\s+PRIMARY\s+KEY/gi,
    severity: 'medium', category: 'Enumerable ID',
    message: 'Sequential auto-increment primary key — IDs are predictable and enumerable',
    recommendation: 'For sensitive resources use UUIDs (CHAR(36) / uuid_generate_v4()) to prevent enumeration attacks',
  },
  {
    regex: /CREATE\s+TABLE\s+\w+\s*\([^)]*\)\s*(?:ENGINE\s*=\s*\w+)?\s*;/gi,
    severity: 'medium', category: 'Missing Audit Timestamp',
    message: 'Table definition appears to lack created_at / updated_at tracking columns',
    recommendation: 'Add created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP and updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP for full audit trails',
  },

  // Low
  {
    regex: /NULL\s+DEFAULT\s+NULL/gi,
    severity: 'low', category: 'Data Integrity',
    message: 'Column is nullable with NULL default — unintentional NULLs may cause data quality issues',
    recommendation: 'Consider whether NOT NULL with an explicit default is more appropriate',
  },
  {
    regex: /ENGINE\s*=\s*MyISAM/gi,
    severity: 'low', category: 'Legacy Storage Engine',
    message: 'MyISAM engine used — no foreign key support, no transactions, no crash recovery',
    recommendation: 'Migrate to InnoDB for ACID compliance, foreign keys, and row-level locking',
  },
  {
    regex: /CHARSET\s*=\s*latin1/gi,
    severity: 'low', category: 'Legacy Encoding',
    message: 'latin1 character set — cannot store multi-byte Unicode characters',
    recommendation: 'Migrate to CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  },
  {
    regex: /COMMENT\s*=\s*'[^']*(?:password|secret|key|token|auth)[^']*'/gi,
    severity: 'low', category: 'Sensitive Comment',
    message: 'Sensitive keyword found in table/column comment',
    recommendation: 'Remove sensitive information from schema comments',
  },

  // Info
  {
    regex: /CREATE\s+INDEX/gi,
    severity: 'info', category: 'Schema Note',
    message: 'Custom index defined — verify index covers required query patterns',
    recommendation: 'Use EXPLAIN to validate index usage; remove unused indexes to reduce write overhead',
  },
  {
    regex: /ALTER\s+TABLE/gi,
    severity: 'info', category: 'Schema Migration',
    message: 'ALTER TABLE found — may lock table during migration on large datasets',
    recommendation: 'Use online DDL tools (pt-online-schema-change) for large production tables',
  },
];

const RULES_BY_TYPE: Record<string, string[]> = {
  full: ALL_RULES.map((_, i) => String(i)),
  security: ['critical', 'high', 'medium'].flatMap(s => ALL_RULES.map((_, i) => i).filter(i => ALL_RULES[i].severity === s).map(String)),
  schema: ALL_RULES.map((r, i) => (['Schema Note', 'Schema Migration', 'Legacy Storage Engine', 'Legacy Encoding', 'Missing Audit Timestamp', 'Data Integrity', 'Enumerable ID'].includes(r.category) ? String(i) : null)).filter(Boolean) as string[],
  permissions: ALL_RULES.map((r, i) => (['Overprivileged Account', 'Wildcard Host Access', 'Grant Escalation', 'Hardcoded Credentials', 'Empty Password'].includes(r.category) ? String(i) : null)).filter(Boolean) as string[],
  compliance: ALL_RULES.map((r, i) => (['PII Without Encryption', 'Weak Cryptography', 'Short Credential Column', 'Security Feature Disabled', 'Missing Audit Timestamp'].includes(r.category) ? String(i) : null)).filter(Boolean) as string[],
};

function analyzeSQL(content: string, auditType: string): { findings: Finding[]; stats: AuditReport['stats'] } {
  const lines = content.split('\n');
  const findings: Finding[] = [];
  const seenMessages = new Set<string>();

  const activeIndices = RULES_BY_TYPE[auditType] ?? RULES_BY_TYPE['full'];
  const activeRules = activeIndices.map(i => ALL_RULES[Number(i)]).filter(Boolean);

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    for (const rule of activeRules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(line)) {
        // Deduplicate same message appearing many times
        const dedupeKey = `${rule.category}:${rule.message}`;
        if (seenMessages.has(dedupeKey)) continue;
        seenMessages.add(dedupeKey);

        const snippet = line.trim().slice(0, 120);
        findings.push({
          severity: rule.severity,
          category: rule.category,
          message: rule.message,
          line: lineIdx + 1,
          snippet: snippet || undefined,
          recommendation: rule.recommendation,
        });
      }
    }
  }

  // Count schema objects
  const countMatches = (re: RegExp) => (content.match(re) ?? []).length;
  const stats = {
    tables: countMatches(/CREATE\s+TABLE/gi),
    views: countMatches(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW/gi),
    triggers: countMatches(/CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?TRIGGER/gi),
    procedures: countMatches(/CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?(?:PROCEDURE|FUNCTION)/gi),
    grants: countMatches(/GRANT\s+/gi),
  };

  // Sort by severity
  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return { findings, stats };
}

function calcRisk(findings: Finding[]) {
  const weights: Record<Severity, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 0 };
  const raw = findings.reduce((s, f) => s + weights[f.severity], 0);
  return Math.min(100, raw);
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<Severity, { label: string; cls: string; iconCls: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', iconCls: 'text-red-500' },
  high: { label: 'High', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', iconCls: 'text-orange-500' },
  medium: { label: 'Medium', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', iconCls: 'text-yellow-500' },
  low: { label: 'Low', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', iconCls: 'text-blue-500' },
  info: { label: 'Info', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', iconCls: 'text-slate-400' },
};

function SevIcon({ s }: { s: Severity }) {
  if (s === 'critical') return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
  if (s === 'high') return <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />;
  if (s === 'medium') return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />;
  if (s === 'low') return <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
  return <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />;
}

function fmtBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

const AUDIT_TYPES = [
  { value: 'full', label: 'Full Audit', desc: 'All rules — security, schema, compliance' },
  { value: 'security', label: 'Security Only', desc: 'Credentials, permissions, injection risks' },
  { value: 'schema', label: 'Schema Analysis', desc: 'Structure, indexes, engine, encoding' },
  { value: 'permissions', label: 'Permission Audit', desc: 'Grants, privileges, user access' },
  { value: 'compliance', label: 'Compliance', desc: 'GDPR/HIPAA — PII, encryption, retention' },
];

const EXPORT_FMTS: { value: ExportFmt; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'txt', label: 'TXT' },
];

// ─── component ────────────────────────────────────────────────────────────────

export function DatabaseAudit() {
  const [file, setFile] = useState<File | null>(null);
  const [auditType, setAuditType] = useState('full');
  const [exportFmt, setExportFmt] = useState<ExportFmt>('json');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['critical', 'high']));
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    setFile(f);
    setReport(null);
  };

  const toggleGroup = (sev: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(sev) ? next.delete(sev) : next.add(sev);
      return next;
    });
  };

  const runAudit = async () => {
    if (!file) return;
    setRunning(true);
    setProgress(0);
    setReport(null);

    // Progress simulation while reading
    const tick = setInterval(() => setProgress(p => Math.min(p + 12, 85)), 150);

    try {
      const text = await file.text();
      clearInterval(tick);
      setProgress(95);

      const { findings, stats } = analyzeSQL(text, auditType);
      const riskScore = calcRisk(findings);
      const riskLevel: AuditReport['riskLevel'] = riskScore >= 60 ? 'critical' : riskScore >= 25 ? 'moderate' : 'safe';

      setProgress(100);
      setReport({
        filename: file.name,
        filesize: file.size,
        auditType: AUDIT_TYPES.find(t => t.value === auditType)?.label ?? auditType,
        scannedAt: new Date().toLocaleString(),
        linesAnalyzed: text.split('\n').length,
        riskScore,
        riskLevel,
        findings,
        stats,
      });

      // Auto-open groups with findings
      const groups = new Set(findings.map(f => f.severity));
      setOpenGroups(groups);

      toast.success(`Audit complete — ${findings.length} finding${findings.length !== 1 ? 's' : ''} detected`);
    } catch {
      clearInterval(tick);
      toast.error('Failed to read file. Ensure it is a valid SQL text file.');
    }
    setRunning(false);
  };

  const downloadReport = (fmt: ExportFmt) => {
    if (!report) return;
    let content = '';
    let mime = 'text/plain';
    let ext = fmt;

    if (fmt === 'json') {
      content = JSON.stringify(report, null, 2);
      mime = 'application/json';
    } else if (fmt === 'csv') {
      content = 'Severity,Category,Message,Line,Snippet,Recommendation\n'
        + report.findings.map(f =>
          `${f.severity},"${f.category}","${f.message}",${f.line ?? ''},"${(f.snippet ?? '').replace(/"/g, '""')}","${f.recommendation.replace(/"/g, '""')}"`
        ).join('\n');
      mime = 'text/csv';
    } else {
      content = [
        'DATABASE AUDIT REPORT',
        '='.repeat(60),
        `File: ${report.filename}`,
        `Audit Type: ${report.auditType}`,
        `Scanned: ${report.scannedAt}`,
        `Risk Score: ${report.riskScore}/100 (${report.riskLevel.toUpperCase()})`,
        `Lines Analyzed: ${report.linesAnalyzed.toLocaleString()}`,
        `Total Findings: ${report.findings.length}`,
        '',
        'SCHEMA STATS',
        '-'.repeat(40),
        `Tables: ${report.stats.tables}  Views: ${report.stats.views}  Triggers: ${report.stats.triggers}`,
        `Procedures/Functions: ${report.stats.procedures}  GRANT statements: ${report.stats.grants}`,
        '',
        'FINDINGS',
        '-'.repeat(60),
        ...report.findings.map((f, i) =>
          `\n[${i + 1}] [${f.severity.toUpperCase()}] ${f.category}\n`
          + `    ${f.message}\n`
          + (f.line ? `    Line: ${f.line}\n` : '')
          + (f.snippet ? `    SQL:  ${f.snippet}\n` : '')
          + `    Fix:  ${f.recommendation}`
        ),
      ].join('\n');
    }

    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `db_audit_${report.filename.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${ext}`;
    a.click();
    toast.success(`Report exported as ${fmt.toUpperCase()}`);
  };

  const reset = () => { setFile(null); setReport(null); setProgress(0); };

  const riskBadgeCls = report
    ? report.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    : report.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
    : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    : '';

  const severityGroups = (['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map(sev => ({
    sev,
    findings: report?.findings.filter(f => f.severity === sev) ?? [],
  })).filter(g => g.findings.length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ServerCog className="h-6 w-6 text-red-600" />
            Audit Database
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real SQL analysis — credentials, permissions, PII, schema, compliance
          </p>
        </div>
        {report && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Audit
            </Button>
          </div>
        )}
      </div>

      {/* Configure + Upload */}
      {!report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Drop zone */}
          <div className="md:col-span-2">
            <div
              className={`border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                drag ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-border hover:border-red-400'
              } ${file ? 'p-4' : 'p-12'}`}
              onDragEnter={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={e => { e.preventDefault(); setDrag(false); }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
              onClick={() => !file && fileRef.current?.click()}
            >
              {running ? (
                <div className="space-y-3 text-center py-4">
                  <div className="h-8 w-8 mx-auto border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium">Analyzing SQL…</p>
                  <Progress value={progress} className="max-w-xs mx-auto" />
                </div>
              ) : file ? (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 border border-red-200 dark:border-red-900">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtBytes(file.size)}</p>
                    <button className="text-xs text-red-600 hover:underline mt-1"
                      onClick={e => { e.stopPropagation(); reset(); fileRef.current?.click(); }}>
                      Change file
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Drop SQL file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">.sql · .dump · .txt</p>
                </div>
              )}
              <input ref={fileRef} type="file" className="hidden" accept=".sql,.dump,.txt"
                onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
            </div>
          </div>

          {/* Config panel */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold block mb-1.5">Audit Type</label>
              <div className="space-y-1.5">
                {AUDIT_TYPES.map(t => (
                  <label key={t.value} className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                    auditType === t.value ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-border hover:bg-muted/50'
                  }`}>
                    <input type="radio" name="auditType" value={t.value} checked={auditType === t.value}
                      onChange={() => setAuditType(t.value)} className="mt-0.5 accent-red-600" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{t.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">Export Format</label>
              <div className="flex gap-1.5">
                {EXPORT_FMTS.map(f => (
                  <button key={f.value} onClick={() => setExportFmt(f.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border uppercase transition-colors ${
                      exportFmt === f.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-border hover:bg-muted text-foreground'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              onClick={runAudit}
              disabled={!file || running}
            >
              <Play className="h-4 w-4 mr-2" />
              {running ? 'Analyzing…' : 'Run Audit'}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {report && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-900">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{report.filename}</p>
                    <p className="text-xs text-muted-foreground">{fmtBytes(report.filesize)} · {report.linesAnalyzed.toLocaleString()} lines · {report.auditType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{report.riskScore}<span className="text-sm text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{report.findings.length}</p>
                    <p className="text-xs text-muted-foreground">Findings</p>
                  </div>
                  <Badge className={`${riskBadgeCls} font-semibold capitalize`}>{report.riskLevel}</Badge>
                </div>
              </div>
              <Progress value={report.riskScore} className="mt-3 h-2" />
            </CardContent>
          </Card>

          {/* Schema stats */}
          <div className="grid grid-cols-5 gap-2">
            {[
              ['Tables', report.stats.tables],
              ['Views', report.stats.views],
              ['Triggers', report.stats.triggers],
              ['Procedures', report.stats.procedures],
              ['GRANTs', report.stats.grants],
            ].map(([label, val]) => (
              <Card key={String(label)}>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className="text-xl font-bold">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All-clear */}
          {report.findings.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center gap-3 py-10 text-green-600 dark:text-green-400">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">No issues found — this SQL file passed all {report.auditType} checks.</span>
              </CardContent>
            </Card>
          )}

          {/* Grouped findings */}
          {severityGroups.map(({ sev, findings }) => {
            const cfg = SEVERITY_CFG[sev];
            const open = openGroups.has(sev);
            return (
              <div key={sev} className="border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => toggleGroup(sev)}
                >
                  <div className="flex items-center gap-2">
                    <SevIcon s={sev} />
                    <span className="font-semibold text-sm">{cfg.label}</span>
                    <Badge className={`${cfg.cls} text-xs`}>{findings.length}</Badge>
                  </div>
                  {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {open && (
                  <div className="border-t border-border divide-y divide-border/60">
                    {findings.map((f, i) => (
                      <div key={i} className="px-4 py-3 space-y-1.5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-2 justify-between flex-wrap">
                          <div className="flex items-start gap-2">
                            <SevIcon s={f.severity} />
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{f.category}</span>
                              {f.line && <span className="ml-2 text-xs text-muted-foreground">Line {f.line}</span>}
                              <p className="text-sm font-medium mt-0.5">{f.message}</p>
                            </div>
                          </div>
                        </div>
                        {f.snippet && (
                          <pre className="text-xs bg-muted rounded px-3 py-2 overflow-x-auto font-mono text-foreground/80 border border-border/50">
                            {f.snippet}
                          </pre>
                        )}
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                          <span><span className="font-medium text-foreground">Fix: </span>{f.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Download */}
          {report.findings.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Download Report</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 pb-4">
                {EXPORT_FMTS.map(f => (
                  <Button key={f.value} size="sm" variant="outline" onClick={() => downloadReport(f.value)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    {f.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
