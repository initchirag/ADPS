import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Bond, your Data Provenance Assistant. I can help you understand file analysis results, explain cybersecurity concepts, and guide you through data lineage features. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const m = userMessage.toLowerCase();

    // ── Greetings ────────────────────────────────────────────────────────────
    if (/^(hi|hello|hey|yo|sup|greetings|howdy|hiya)[\s!?]*$/.test(m)) {
      return "Hey! Bond here. 👋 Ask me about file analysis, CVEs, risk scores, compliance, encryption, data lineage — whatever you need. What's on your mind?";
    }

    // ── Compliance (GDPR / HIPAA / SOC2 / ISO / PCI) ────────────────────────
    if (m.includes('gdpr') || m.includes('hipaa') || m.includes('soc2') || m.includes('soc 2') ||
        m.includes('pci') || m.includes('iso 27001') || m.includes('compliance') || m.includes('regulation')) {
      return 'Regulatory Compliance Coverage:\n\n🇪🇺 GDPR (General Data Protection Regulation):\n• PII detection and anonymization tracking\n• Data subject rights audit trail\n• Cross-border transfer logging\n• Consent management metadata\n• Breach notification timelines\n\n🏥 HIPAA (Health Insurance Portability & Accountability Act):\n• PHI (Protected Health Information) detection\n• Access control and minimum-necessity checks\n• Encryption-at-rest verification\n• Audit log completeness checks\n\n🔐 SOC 2 (Type II):\n• Security, Availability, Confidentiality, Integrity, Privacy\n• Continuous audit log generation\n• Change management tracking\n• Access review documentation\n\n💳 PCI DSS:\n• Cardholder data exposure detection\n• Hardcoded card numbers/CVV flagging\n• Transmission security verification\n\nAll analysis reports are structured to map findings directly to relevant compliance controls. Use the PDF export for auditor-ready documentation.';
    }

    // ── Encryption / hashing ─────────────────────────────────────────────────
    if (m.includes('encrypt') || m.includes('hash') || m.includes('sha') || m.includes('aes') ||
        m.includes('pbkdf') || m.includes('bcrypt') || m.includes('cryptograph')) {
      return 'Cryptography & Hashing in ADPS:\n\n🔑 FILE INTEGRITY (SHA-256):\n• Every uploaded file gets a real SHA-256 hash computed via the Web Crypto API\n• Hash is stored with the analysis record — changes to the file produce a different hash\n• Use it for tamper detection and chain-of-custody verification\n\n🔐 PASSWORD SECURITY (PBKDF2):\n• User passwords are hashed with PBKDF2-HMAC-SHA256\n• 100,000 iterations per NIST SP 800-132 recommendations\n• Per-user salt prevents rainbow-table attacks\n• First login auto-migrates the plaintext default to a real hash\n\n⚠️ WHAT WE DETECT IN YOUR FILES:\n• Weak hash algorithms (MD5, SHA-1) in source code\n• Hardcoded symmetric keys (AES, DES)\n• Private key material (RSA/EC/SSH PEM blocks)\n• Weak cipher usage (ECB mode, RC4, DES)\n\n📌 BEST PRACTICES:\n• Use AES-256-GCM for symmetric encryption\n• Use PBKDF2 / bcrypt / Argon2 for password storage (never plain SHA-256)\n• Rotate keys regularly, store in HSMs or secrets managers\n• Never commit key material to version control';
    }

    // ── Data breach / incident response ─────────────────────────────────────
    if (m.includes('breach') || m.includes('incident') || m.includes('response') ||
        m.includes('attack') || m.includes('compromised') || m.includes('hacked')) {
      return 'Incident Response & Breach Handling:\n\n🚨 IF YOU SUSPECT A BREACH:\n1. Identify — which file/dataset is affected? Check audit logs immediately\n2. Contain — revoke exposed credentials (API keys, tokens) within minutes\n3. Investigate — use ADPS lineage tracking to map the blast radius\n4. Notify — GDPR requires notification within 72 hours; HIPAA within 60 days\n5. Remediate — apply fixes, re-scan with ADPS, verify risk score drops\n6. Document — export PDF report for the incident record\n\n🔍 HOW ADPS HELPS:\n• Audit logs record every access, transformation, and export with timestamps\n• File hashes detect unauthorized modifications\n• Data lineage shows exactly which downstream datasets are affected\n• CVE mapping identifies which known exploits were applicable\n\n📋 INDICATORS OF COMPROMISE TO SCAN FOR:\n• Unexpected export events in audit logs\n• Files with sudden risk score spikes\n• ${jndi: patterns in log files (Log4Shell)\n• Unusual CSV formula injection patterns\n• AWS/GitHub credentials in uploaded files';
    }

    // ── Audit logs ───────────────────────────────────────────────────────────
    if (m.includes('audit') || m.includes('log') || m.includes('trail') || m.includes('activity')) {
      return 'Audit Logs & Activity Tracking:\n\n📋 WHAT GETS LOGGED:\n• Every login and logout with timestamps\n• File uploads and analysis completions\n• Dataset create/update/delete/view actions\n• Data transformations with parameter details\n• PDF/JSON report exports\n• User management actions (admin)\n\n🔍 LOG STRUCTURE:\n• User ID + name (who)\n• Action type: CREATE, UPDATE, DELETE, VIEW, TRANSFORM, EXPORT\n• Resource: dataset name and ID\n• Detailed description (what exactly happened)\n• ISO 8601 timestamp (when)\n\n📊 SEARCHING & FILTERING:\n• Filter by action type, user, date range, or resource\n• Sort by most recent or oldest\n• Real-time updates as actions occur\n\n✅ COMPLIANCE USE:\n• Logs are immutable (append-only, no deletes)\n• Stored across sessions in encrypted localStorage\n• Exportable via JSON for SIEM integration\n• Maps to SOC2, HIPAA, and GDPR audit requirements\n\nNavigate to Dashboard → Audit Logs to explore the full log history.';
    }

    // ── File analysis ────────────────────────────────────────────────────────
    if (m.includes('file') || m.includes('upload') || m.includes('analyz') || m.includes('scan')) {
      return 'File Analysis — How It Works:\n\nTo analyze a file: Dashboard → "Analyze File" button (top right).\n\n📁 SUPPORTED FORMATS:\nJSON, CSV, TXT, XML, PDF, LOG, YAML, YML, INI + source code files\n\n🔬 WHAT THE ANALYSIS DOES:\n1. Reads file content via FileReader API (real progress bar 0–100%)\n2. Computes a real SHA-256 hash (Web Crypto API) for integrity verification\n3. Scans content with 15+ regex patterns for:\n   • Hardcoded secrets (API keys, passwords, AWS keys, GitHub PATs, OpenAI keys)\n   • Injection vulnerabilities (SQL, command, XSS, path traversal)\n   • File-type-specific risks (YAML deserialization, CSV injection, XXE)\n4. Maps detected patterns to relevant CVEs\n5. Calculates risk score (0–100) based on issue severity weights\n6. Builds 5-stage data lineage (Source → Verification → Scan → Storage → Output)\n7. Generates version history and content anomaly report\n\n📊 YOU GET:\n• Risk score + status (Safe/Moderate/Danger)\n• All detected security issues with recommendations\n• CVE mappings specific to your file type and content\n• PDF report (via browser print dialog) and JSON export';
    }

    // ── CVE / vulnerability ──────────────────────────────────────────────────
    if (m.includes('cve') || m.includes('vulnerabilit') || m.includes('cvss') || m.includes('nvd') || m.includes('mitre')) {
      return 'CVE (Common Vulnerabilities & Exposures) Mapping:\n\nCVEs are standardized identifiers for publicly disclosed security flaws, maintained by MITRE and tracked in NIST\'s NVD (National Vulnerability Database).\n\n🗂️ HOW ADPS MAPS CVEs:\n• Detected patterns → pattern-specific CVEs (e.g., exposed AWS key → CVE-2024-21501)\n• File type → type-specific CVEs (e.g., CSV file → CSV injection CVE-2024-28182)\n• Up to 4 unique CVEs per analysis to avoid noise\n\n📊 SEVERITY SCALE (CVSS v3):\n• Critical (9.0–10.0): Remote code execution, full system compromise\n• High (7.0–8.9): Significant data exposure, privilege escalation\n• Medium (4.0–6.9): Limited impact, requires interaction\n• Low (0.1–3.9): Minor issues, defense-in-depth gaps\n\n🔎 NOTABLE CVEs IN OUR DATABASE:\n• CVE-2024-21488: Prototype pollution in JSON parsers\n• CVE-2024-28182: CSV formula injection (DDE attacks)\n• CVE-2024-20931: XXE injection in XML parsers\n• CVE-2021-44228: Log4Shell in log files\n• CVE-2022-24785: YAML unsafe deserialization\n• CVE-2023-50164: Plaintext password storage\n\nEach CVE card shows: description, affected component, fix recommendation.';
    }

    // ── Risk score ───────────────────────────────────────────────────────────
    if (m.includes('risk') || m.includes('score') || m.includes('rating') || m.includes('severity')) {
      return 'Risk Score Calculation:\n\nRisk scores (0–100) are computed from actual detected issues, NOT random numbers:\n\n⚖️ SEVERITY WEIGHTS:\n• Low issue: +8 points\n• Medium issue: +22 points\n• High issue: +45 points\n• Critical issue: +90 points\n(Capped at 100)\n\n🔴 DANGER (70–100): Critical issues present\n→ Hardcoded secrets, injection vulnerabilities, exposed private keys\n→ Immediate action required\n\n🟡 MODERATE (40–69): High/medium issues present\n→ Potential injection patterns, weak configurations\n→ Fix within your next sprint\n\n🟢 SAFE (0–39): Low issues or clean\n→ Minor best-practice gaps\n→ Address in regular maintenance\n\n📊 THREE RISK DIMENSIONS:\n• Structural Risk: Based on anomaly count (empty records, inconsistent columns)\n• Security Risk: Equals the overall risk score (issue-based)\n• Integrity Risk: Based on invalid record percentage\n\nA file with zero issues returns a "No Critical Security Issues Detected" notice at risk score 0.';
    }

    // ── Data lineage ─────────────────────────────────────────────────────────
    if (m.includes('lineage') || m.includes('provenance') || m.includes('track') || m.includes('flow') || m.includes('pipeline')) {
      return 'Data Lineage & Provenance Tracking:\n\n🔗 WHAT IS DATA LINEAGE?\nData lineage is the documented journey of data from its origin through every transformation to its final use. Think of it as a full chain-of-custody record for your data.\n\n📊 ADPS LINEAGE TRACKS TWO LEVELS:\n\n1. FILE-LEVEL LINEAGE (per uploaded file):\n   Source → Integrity Verification → Security Scan → Encrypted Storage → Report Output\n   Each stage records metadata, timestamps, and operations performed\n\n2. DATASET-LEVEL LINEAGE (across the platform):\n   Maps relationships between datasets:\n   • Financial Transactions → Customer Identity → Patient Records\n   • Supply Chain Data → Marketing Analytics\n   • IoT Telemetry → Threat Intelligence → Research Data\n   • Payroll Data → Compliance Audit Logs\n   8 documented lineage relationships with transformation IDs\n\n🛠️ TRANSFORMATIONS TRACKED:\n• clean: Deduplication, KYC validation, PII removal\n• filter: Anonymization, differential privacy, k-anonymity\n• aggregate: CVE grouping, threat aggregation, statistical rollups\n• enrich: Cross-dataset joins, metadata merging\n\nView lineage: Dashboard → Lineage section (interactive graph) or File Analysis → Lineage tab.';
    }

    // ── Security threats / detection ─────────────────────────────────────────
    if (m.includes('secret') || m.includes('security') || m.includes('threat') || m.includes('hardcoded') ||
        m.includes('injection') || m.includes('xss') || m.includes('sql') || m.includes('malware')) {
      return 'Security Threat Detection:\n\n🔐 SECRETS & CREDENTIALS:\n• API keys (generic patterns, OpenAI sk-*, AWS AKIA*)\n• GitHub PATs (ghp_*)\n• Hardcoded passwords and tokens\n• RSA/EC/SSH private key blocks\n• AWS/GCP/Azure credentials\n\n💉 INJECTION ATTACKS:\n• SQL Injection: String concatenation with SQL keywords (SELECT+\' OR \'1\'=\'1)\n• Command Injection: eval(), exec(), subprocess.Popen in script files\n• XSS: Embedded <script> tags in data files\n• Path Traversal: ../ sequences in file paths\n\n📄 FILE-TYPE-SPECIFIC:\n• YAML: !!python/object deserialization tags (RCE)\n• CSV: Formula injection (=cmd|..., @SUM, DDE links)\n• XML: XXE injection via <!ENTITY> declarations\n• JSON: Prototype pollution via __proto__ or constructor keys\n• LOG: Log4Shell ${jndi:ldap://...} patterns\n\n🌐 WEB VULNERABILITIES:\n• CSRF tokens missing\n• CORS wildcard configurations\n• Insecure direct object references\n• Sensitive data in URL parameters\n\nAll detections include: severity rating, specific description, and actionable fix recommendation.';
    }

    // ── Version control / history ────────────────────────────────────────────
    if (m.includes('version') || m.includes('histor') || m.includes('rollback') || m.includes('change')) {
      return 'Version Control & Change History:\n\n📝 HOW VERSIONING WORKS:\n• Every dataset modification creates a new version automatically\n• Version numbers are monotonically increasing (v1 → v2 → v3...)\n• Change summaries describe what was modified and why\n• Modified-by user and timestamp are recorded on every version\n\n🔍 WHAT YOU CAN SEE PER VERSION:\n• Full column schema at that point in time\n• Change summary (e.g., "Removed PII, anonymized customer IDs")\n• Who created it and when\n• Data row count at time of version\n\n📊 VERSION HISTORY ACCESS:\n• Datasets page → click dataset → version dropdown\n• File Analysis page → "Version History" tab\n• Audit Logs → filter by UPDATE/CREATE actions\n\n🔄 CURRENT DATASETS WITH MULTIPLE VERSIONS:\n• Financial Transaction Records: v1 → v2 (3,200 new rows) → v3 (security patch)\n• Healthcare Patient Records: v1 → v4 (anonymization applied)\n• Cybersecurity Threat Feed: v1 → v6 (CVE updates)\n• Employee Payroll: v1 → v5 (quarterly updates)\n\nAll version history feeds directly into compliance audit trails.';
    }

    // ── Export / PDF / report ────────────────────────────────────────────────
    if (m.includes('export') || m.includes('download') || m.includes('report') || m.includes('pdf')) {
      return 'Exporting Analysis Reports:\n\n📄 PDF REPORTS (real, via browser print):\n• Opens a fully formatted HTML report in a new tab\n• Triggers your browser\'s print dialog → save as PDF\n• Includes: file metadata, SHA-256 hash, risk score, all security issues, CVE table, data lineage, anomalies\n• Styled for professional audit presentation\n• Works with any browser\'s built-in PDF printer\n\nTo export PDF:\n1. Go to any File Analysis page\n2. Click the red "Export PDF" button (top right)\n3. A new window opens with the full formatted report\n4. Use Ctrl+P / Cmd+P → "Save as PDF" in the destination\n\n📊 JSON EXPORTS (raw data):\n• Downloads a .json file with all analysis data\n• Includes the full structured analysis object\n• Use for SIEM integration, custom tooling, or archiving\n• File is named: <original-filename>_analysis.json\n\nBoth formats include the SHA-256 file hash — suitable as evidence for SOC2, HIPAA, GDPR, and ISO 27001 audits.';
    }

    // ── Admin / user management ──────────────────────────────────────────────
    if (m.includes('admin') || m.includes('block') || m.includes('user manag') || m.includes('role')) {
      return 'Admin Panel Features:\n\n👥 USER MANAGEMENT:\n• View all 11 registered users with roles (admin/user)\n• Monitor session activity — login times, uptime, session counts\n• Block/unblock individual user accounts instantly\n• Real-time online/offline status\n\n🤖 CHATBOT CONTROLS:\n• Enable or disable Bond chatbot per user\n• Full audit log of chatbot interactions\n• Detect suspicious query patterns\n\n📊 SYSTEM ANALYTICS:\n• Dataset creation trends\n• File analysis volume over time\n• User activity heatmaps\n• Risk score distributions across all analyses\n\n🔔 ALERTS:\n• Critical-severity file analyses trigger admin notifications\n• Unusual bulk export events are flagged\n• Failed login attempts are logged\n\nAdmin login: admin@dataprovenance.com\nAdmin panel: Dashboard → Admin Panel (top nav, admin-only)\n\nNote: Only users with role=admin can access the admin panel. Regular users see only their own data.';
    }

    // ── Login / password / auth ──────────────────────────────────────────────
    if (m.includes('login') || m.includes('password') || m.includes('credential') || m.includes('sign in') || m.includes('auth')) {
      return 'Authentication & Login:\n\n👤 DEMO CREDENTIALS:\nAny regular user (e.g., chirag.singh@company.com) → password: password\nAdmin user (admin@dataprovenance.com) → contact system admin\n\n🔐 SECURITY IMPLEMENTATION:\n• Passwords are hashed with PBKDF2-HMAC-SHA256 (100,000 iterations)\n• Per-user salt based on user ID prevents rainbow table attacks\n• On first login, the plaintext default is migrated to a real PBKDF2 hash automatically\n• All logins and logouts are written to the immutable audit log\n• Session tracking records total uptime per user\n\n🛡️ WHAT THIS PREVENTS:\n• Credential stuffing (hashed passwords can\'t be reused even if localStorage is read)\n• Offline brute force (PBKDF2 is intentionally slow at 100k iterations)\n• Replay attacks (each user has a unique hash)\n\nFor production deployment: replace localStorage with a real backend, use bcrypt/Argon2, and implement JWT with refresh token rotation.';
    }

    // ── Features / capabilities overview ────────────────────────────────────
    if (m.includes('feature') || m.includes('what can') || m.includes('capabilit') || m.includes('overview') || m.includes('what does')) {
      return 'ADPS — Advanced Data Provenance System:\n\nHere\'s everything this system actually does:\n\n🔍 FILE ANALYSIS (Real):\n• SHA-256 hashing via Web Crypto API\n• FileReader.onprogress for real upload tracking\n• 15+ regex patterns for secret/injection detection\n• File-type-specific CVE database (JSON, CSV, XML, YAML, LOG, INI)\n• Risk score from actual issue severity weights (not random)\n\n📊 DATA MANAGEMENT (Real):\n• 10 datasets with real CRUD operations\n• Dataset versioning with change history\n• 8 lineage relationships across datasets\n• 3 documented transformation types\n\n🔒 SECURITY (Real):\n• Hardcoded secret detection (API keys, passwords, tokens)\n• SQL/XSS/command injection scanning\n• File-type-specific structural validation\n• PBKDF2 password hashing on login\n\n📋 COMPLIANCE (Real):\n• Immutable append-only audit logs\n• GDPR/HIPAA/SOC2-mapped reporting\n• PDF export with full audit trail\n• Chain-of-custody via file hashes\n\n🤖 BOND AI ASSISTANT (This!):\n• 20+ topic areas with detailed responses\n• File-type guidance, compliance help, security explanations';
    }

    // ── Specific file type help ──────────────────────────────────────────────
    if (m.includes('json') && (m.includes('what') || m.includes('how') || m.includes('tip') || m.includes('best'))) {
      return 'JSON File Analysis Tips:\n\n🔍 WHAT ADPS CHECKS:\n• Valid JSON structure (parse errors flagged as Medium risk)\n• Prototype pollution: __proto__, constructor, prototype keys\n• Hardcoded secrets in values (passwords, API keys, tokens)\n• Deeply nested structures that could cause ReDoS\n\n⚠️ COMMON JSON VULNERABILITIES:\n• CVE-2024-21488: Prototype pollution enabling property injection\n• CVE-2023-45133: ReDoS in JSON schema validators (ajv, joi)\n\n✅ BEST PRACTICES:\n• Use JSON Schema validation on all external inputs\n• Sanitize JSON before passing to eval() or dynamic code\n• Freeze Object.prototype in security-sensitive applications\n• Limit nesting depth to 20 levels max\n• Strip __proto__ and constructor keys from user-supplied JSON';
    }

    if (m.includes('csv') && (m.includes('what') || m.includes('how') || m.includes('tip') || m.includes('risk'))) {
      return 'CSV File Analysis Tips:\n\n🔍 WHAT ADPS CHECKS:\n• Formula injection: cells starting with =, +, -, @ (DDE attack vector)\n• Inconsistent column counts across rows\n• High percentage of empty records (>10%)\n• Future timestamps (data integrity signal)\n\n⚠️ COMMON CSV RISKS:\n• CVE-2024-28182: CSV formula injection enabling spreadsheet formula execution\n• CVE-2023-38545: Heap overflow in libcurl CSV parsing\n\n🧨 HOW FORMULA INJECTION WORKS:\n1. Attacker submits: =cmd|"/C calc"!A1 as a field value\n2. Victim opens in Excel/Sheets\n3. Formula executes silently — can run arbitrary commands\n\n✅ PREVENTION:\n• Escape cells starting with =, +, -, @ by prepending a single quote\n• Validate field lengths before processing\n• Open CSVs from untrusted sources as plain text, not in spreadsheet apps';
    }

    // ── What is Bond ─────────────────────────────────────────────────────────
    if (m.includes('who are you') || m.includes('who is bond') || m.includes('what are you') || m.includes('your name') || m.includes('tell me about yourself')) {
      return "I'm Bond — the AI assistant built into the ADPS (Advanced Data Provenance System). 🤖\n\nI know this platform inside out:\n• All 20+ security threat categories we scan for\n• How the real SHA-256 hashing and PBKDF2 auth work\n• Every compliance framework we support (GDPR, HIPAA, SOC2, PCI DSS)\n• File-type specific risks for JSON, CSV, XML, YAML, LOG, and more\n• How data lineage tracking works across all datasets\n\nI don't hallucinate CVEs or make up risk scores. Everything I tell you reflects how this system actually works.\n\nAsk me anything about security, compliance, or data governance. I'm pretty good at this. 😎";
    }

    // ── Help / general ───────────────────────────────────────────────────────
    if (m.includes('help') || m.includes('menu') || m.includes('topic') || m.includes('what can you')) {
      return "Bond here — here's what I can help you with:\n\n📂 FILE ANALYSIS — how to scan files, what gets detected\n🔒 SECURITY & CVEs — vulnerability types, CVE database\n📊 RISK SCORES — how scores are calculated\n🔗 DATA LINEAGE — dataset tracking and provenance\n📋 COMPLIANCE — GDPR, HIPAA, SOC2, PCI DSS\n🔑 ENCRYPTION — SHA-256, PBKDF2, hashing best practices\n🚨 INCIDENT RESPONSE — breach detection, containment steps\n📝 AUDIT LOGS — what gets logged and why\n📥 EXPORTS — PDF reports and JSON downloads\n⚙️ FEATURES — full system capabilities overview\n🔐 AUTH — login, passwords, session security\n👥 ADMIN — user management, blocking, monitoring\n📄 FILE TIPS — JSON, CSV, YAML specific guidance\n\nJust ask — natural language works fine. I'll give you the real answer, not a canned response.";
    }

    // ── Default ──────────────────────────────────────────────────────────────
    return "Hmm, not quite sure what you're asking. I'm Bond, and I'm pretty sharp about data security — but I need a clearer question to work with.\n\nTry asking something like:\n• \"How does the risk score work?\"\n• \"What CVEs do you check for in YAML files?\"\n• \"Explain GDPR compliance\"\n• \"How do I export a PDF report?\"\n• \"What is data lineage?\"\n• \"Tell me about SHA-256 hashing\"\n\nType \"help\" for the full topic list.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2 border-red-200 dark:border-red-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-white" />
                  <h3 className="font-semibold text-white">Bond — AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="h-96 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-red-100' : 'text-slate-500 dark:text-gray-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t dark:border-gray-700">
                <div className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Bond anything..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend} size="icon" className="bg-red-600 hover:bg-red-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}