// Types for the Data Provenance Tracking System

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  chatbot_enabled?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'file' | 'api' | 'manual';
  description?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source_id: string;
  source_type: 'file' | 'api' | 'manual';
  created_by: string;
  created_at: string;
  updated_at: string;
  current_version: number;
  row_count: number;
  column_count: number;
  file_type?: 'csv' | 'json';
}

export interface DataVersion {
  id: string;
  dataset_id: string;
  version_number: number;
  data: any[];
  columns: string[];
  created_at: string;
  created_by: string;
  change_summary?: string;
}

export interface Transformation {
  id: string;
  dataset_id: string;
  version_id: string;
  type: 'filter' | 'clean' | 'aggregate' | 'merge' | 'sort' | 'custom';
  description: string;
  parameters: Record<string, any>;
  created_by: string;
  created_at: string;
}

export interface LineageRelationship {
  id: string;
  parent_dataset_id: string;
  child_dataset_id: string;
  transformation_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSFORM' | 'VIEW' | 'DOWNLOAD' | 'EXPORT';
  resource_type: 'dataset' | 'version' | 'transformation' | 'user';
  resource_id: string;
  resource_name: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

export interface AccessLog {
  id: string;
  user_id: string;
  user_name: string;
  dataset_id: string;
  dataset_name: string;
  action: 'VIEW' | 'DOWNLOAD' | 'EXPORT';
  timestamp: string;
}

export interface DashboardStats {
  total_datasets: number;
  total_versions: number;
  total_transformations: number;
  total_users: number;
  recent_activity: AuditLog[];
}

// New types for file analysis system
export interface AnalyzedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
  uploaded_by: string;
  hash: string;
  encoding: string;
  line_count: number;
  risk_score: number;
  status: 'safe' | 'moderate' | 'danger';
  analysis: FileAnalysis;
}

export interface FileAnalysis {
  overview: FileOverview;
  content: ContentAnalysis;
  issues: Issue[];
  lineage: LineageNode[];
  risks: RiskBreakdown;
  cves: CVE[];
  history: VersionHistory[];
}

export interface FileOverview {
  parsed_structure: string;
  key_fields: string[];
  schema?: Record<string, string>;
  missing_fields: string[];
  duplicates: number;
}

export interface ContentAnalysis {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  data_quality_score: number;
  anomalies: string[];
}

export interface Issue {
  id: string;
  type: 'misconfiguration' | 'suspicious_pattern' | 'hardcoded_secret' | 'dependency_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

export interface LineageNode {
  id: string;
  type: 'source' | 'transformation' | 'storage' | 'output';
  name: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RiskBreakdown {
  structural: number;
  security: number;
  integrity: number;
  overall: number;
}

export interface CVE {
  id: string;
  cve_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_component: string;
  fix_recommendation: string;
  published_date: string;
}

export interface VersionHistory {
  version: string;
  modified_by: string;
  modified_at: string;
  changes: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatbotSettings {
  enabled: boolean;
  mode: 'normal' | 'restricted' | 'disabled';
  user_id?: string;
}