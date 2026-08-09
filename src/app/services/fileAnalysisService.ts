import { AnalyzedFile, FileAnalysis, Issue, CVE, LineageNode, VersionHistory } from '../types';
import { getCurrentUser, logAuditAction } from './dataService';

// Helper function to generate mock file hash
const generateHash = (fileName: string): string => {
  return `sha256:${btoa(fileName + Date.now()).substring(0, 64)}`;
};

// Helper function to calculate risk score
const calculateRiskScore = (issues: Issue[]): number => {
  const severityWeights = { low: 10, medium: 25, high: 50, critical: 100 };
  const totalRisk = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);
  return Math.min(100, totalRisk);
};

// Mock file analysis function
export const analyzeFile = (file: File): Promise<AnalyzedFile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Generate mock analysis based on file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      const mockIssues: Issue[] = generateMockIssues(fileExtension);
      const mockCVEs: CVE[] = generateMockCVEs(fileExtension);
      const mockLineage: LineageNode[] = generateMockLineage();
      const mockHistory: VersionHistory[] = generateMockHistory(user.name);

      const riskScore = calculateRiskScore(mockIssues);
      const status: 'safe' | 'moderate' | 'danger' = 
        riskScore < 40 ? 'safe' : riskScore < 70 ? 'moderate' : 'danger';

      const analysis: FileAnalysis = {
        overview: {
          parsed_structure: getFileStructure(fileExtension),
          key_fields: getKeyFields(fileExtension),
          schema: getSchema(fileExtension),
          missing_fields: getMissingFields(fileExtension),
          duplicates: Math.floor(Math.random() * 50),
        },
        content: {
          total_records: Math.floor(Math.random() * 10000) + 1000,
          valid_records: Math.floor(Math.random() * 9000) + 900,
          invalid_records: Math.floor(Math.random() * 100),
          data_quality_score: Math.floor(Math.random() * 30) + 70,
          anomalies: getAnomalies(fileExtension),
        },
        issues: mockIssues,
        lineage: mockLineage,
        risks: {
          structural: Math.floor(Math.random() * 40) + 10,
          security: Math.floor(Math.random() * 60) + 20,
          integrity: Math.floor(Math.random() * 30) + 10,
          overall: riskScore,
        },
        cves: mockCVEs,
        history: mockHistory,
      };

      const analyzedFile: AnalyzedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type || `application/${fileExtension}`,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.name,
        hash: generateHash(file.name),
        encoding: 'UTF-8',
        line_count: Math.floor(Math.random() * 5000) + 500,
        risk_score: riskScore,
        status,
        analysis,
      };

      // Log the file analysis action
      logAuditAction({
        user_id: user.id,
        user_name: user.name,
        action_type: 'VIEW',
        resource_type: 'dataset',
        resource_id: analyzedFile.id,
        resource_name: file.name,
        details: `Analyzed file: ${file.name} (Risk Score: ${riskScore})`,
      });

      // Store in localStorage
      const existingFiles = getAnalyzedFiles();
      existingFiles.unshift(analyzedFile);
      localStorage.setItem('analyzed_files', JSON.stringify(existingFiles));

      resolve(analyzedFile);
    }, 2000); // Simulate processing time
  });
};

// Get all analyzed files
export const getAnalyzedFiles = (): AnalyzedFile[] => {
  const files = localStorage.getItem('analyzed_files');
  return files ? JSON.parse(files) : [];
};

// Get analyzed file by ID
export const getAnalyzedFile = (id: string): AnalyzedFile | undefined => {
  const files = getAnalyzedFiles();
  return files.find(f => f.id === id);
};

// Mock data generators
function generateMockIssues(fileType: string): Issue[] {
  const commonIssues: Issue[] = [
    {
      id: '1',
      type: 'misconfiguration',
      severity: 'medium',
      title: 'Insecure Configuration Detected',
      description: 'Configuration file contains insecure settings that may expose sensitive data.',
      recommendation: 'Update configuration to use secure defaults and enable encryption.',
    },
    {
      id: '2',
      type: 'hardcoded_secret',
      severity: 'high',
      title: 'Hardcoded API Key Found',
      description: 'Found hardcoded API key: "sk-proj-****". This poses a security risk.',
      recommendation: 'Move secrets to environment variables or secure vault.',
    },
  ];

  if (fileType === 'json' || fileType === 'xml') {
    commonIssues.push({
      id: '3',
      type: 'suspicious_pattern',
      severity: 'low',
      title: 'Unusual Data Pattern',
      description: 'Detected unusual nested structure depth that may indicate malformed data.',
      recommendation: 'Validate data structure against schema.',
    });
  }

  if (fileType === 'csv' || fileType === 'txt') {
    commonIssues.push({
      id: '4',
      type: 'dependency_risk',
      severity: 'critical',
      title: 'Data Integrity Issue',
      description: 'Missing required fields in 23% of records.',
      recommendation: 'Implement data validation pipeline before processing.',
    });
  }

  return commonIssues;
}

function generateMockCVEs(fileType: string): CVE[] {
  return [
    {
      id: 'cve1',
      cve_id: 'CVE-2024-1234',
      description: 'Remote code execution vulnerability in data parser library',
      severity: 'high',
      affected_component: 'Parser Module v2.3.1',
      fix_recommendation: 'Upgrade to version 2.4.0 or apply security patch',
      published_date: '2024-01-15',
    },
    {
      id: 'cve2',
      cve_id: 'CVE-2023-9876',
      description: 'SQL injection vulnerability in query builder',
      severity: 'critical',
      affected_component: 'Database Layer',
      fix_recommendation: 'Use parameterized queries and update library to v3.1.0',
      published_date: '2023-12-20',
    },
    {
      id: 'cve3',
      cve_id: 'CVE-2024-5678',
      description: 'Cross-site scripting (XSS) in data visualization component',
      severity: 'medium',
      affected_component: 'Visualization Engine',
      fix_recommendation: 'Sanitize all user inputs and upgrade component',
      published_date: '2024-02-10',
    },
  ];
}

function generateMockLineage(): LineageNode[] {
  return [
    {
      id: 'l1',
      type: 'source',
      name: 'Original Data Source',
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      metadata: { location: 'External API', format: 'JSON' },
    },
    {
      id: 'l2',
      type: 'transformation',
      name: 'Data Cleansing',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      metadata: { operations: ['remove_duplicates', 'normalize_fields'] },
    },
    {
      id: 'l3',
      type: 'transformation',
      name: 'Validation & Enrichment',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      metadata: { rules_applied: 12, records_enriched: 850 },
    },
    {
      id: 'l4',
      type: 'storage',
      name: 'Secure Data Lake',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      metadata: { encrypted: true, backup: 'enabled' },
    },
    {
      id: 'l5',
      type: 'output',
      name: 'Analysis Report',
      timestamp: new Date().toISOString(),
      metadata: { format: 'PDF', recipient: 'Compliance Team' },
    },
  ];
}

function generateMockHistory(userName: string): VersionHistory[] {
  return [
    {
      version: 'v1.0',
      modified_by: userName,
      modified_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      changes: 'Initial file upload and baseline analysis',
    },
    {
      version: 'v1.1',
      modified_by: userName,
      modified_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      changes: 'Applied data cleansing transformations',
    },
    {
      version: 'v1.2',
      modified_by: userName,
      modified_at: new Date().toISOString(),
      changes: 'Updated metadata and recomputed risk scores',
    },
  ];
}

function getFileStructure(fileType: string): string {
  const structures: Record<string, string> = {
    json: 'Nested JSON object with 3 levels of hierarchy',
    csv: 'Tabular structure with headers and 15 columns',
    xml: 'XML document with DTD schema validation',
    txt: 'Plain text with line-delimited records',
    pdf: 'PDF document with embedded metadata and annotations',
    log: 'Structured log file with timestamp and severity levels',
    yaml: 'YAML configuration with key-value pairs',
    ini: 'INI configuration file with sections',
  };
  return structures[fileType] || 'Unknown structure';
}

function getKeyFields(fileType: string): string[] {
  const fields: Record<string, string[]> = {
    json: ['id', 'timestamp', 'user_id', 'action', 'metadata'],
    csv: ['transaction_id', 'date', 'amount', 'status', 'customer_id'],
    xml: ['record_id', 'created_date', 'status', 'category'],
    log: ['timestamp', 'level', 'message', 'source'],
  };
  return fields[fileType] || ['field1', 'field2', 'field3'];
}

function getSchema(fileType: string): Record<string, string> | undefined {
  if (fileType === 'json' || fileType === 'xml') {
    return {
      id: 'string',
      timestamp: 'datetime',
      value: 'number',
      status: 'enum',
      metadata: 'object',
    };
  }
  return undefined;
}

function getMissingFields(fileType: string): string[] {
  return Math.random() > 0.5 ? ['optional_field_1', 'optional_field_2'] : [];
}

function getAnomalies(fileType: string): string[] {
  return [
    'Found 12 records with timestamps in the future',
    'Detected unusual spike in data volume on 2026-03-25',
    '5 records contain non-standard character encoding',
  ];
}
