import { User, Dataset, DataVersion, Transformation, LineageRelationship, AuditLog, AccessLog, DashboardStats } from '../types';

// Helper to get current user
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
};

// User session tracking
export const trackUserSession = (userId: string, action: 'login' | 'logout') => {
  const sessions = JSON.parse(localStorage.getItem('user_sessions') || '{}');
  if (!sessions[userId]) {
    sessions[userId] = { loginTime: null, logoutTime: null, totalUptime: 0, sessionCount: 0 };
  }
  
  if (action === 'login') {
    sessions[userId].loginTime = new Date().toISOString();
    sessions[userId].sessionCount = (sessions[userId].sessionCount || 0) + 1;
  } else if (action === 'logout' && sessions[userId].loginTime) {
    sessions[userId].logoutTime = new Date().toISOString();
    const loginTime = new Date(sessions[userId].loginTime).getTime();
    const logoutTime = new Date(sessions[userId].logoutTime).getTime();
    const sessionDuration = (logoutTime - loginTime) / 1000; // in seconds
    sessions[userId].totalUptime = (sessions[userId].totalUptime || 0) + sessionDuration;
  }
  
  localStorage.setItem('user_sessions', JSON.stringify(sessions));
};

export const getUserSessions = () => {
  return JSON.parse(localStorage.getItem('user_sessions') || '{}');
};

// Initialize mock data
const initializeMockData = () => {
  // Check if data already exists
  if (!localStorage.getItem('users')) {
    const users: User[] = [
      {
        id: '1',
        email: 'admin@dataprovenance.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date('2026-01-01').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '2',
        email: 'chirag.singh@company.com',
        name: 'Chirag Singh',
        role: 'user',
        created_at: new Date('2026-01-15T09:30:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '3',
        email: 'danish.verma@company.com',
        name: 'Danish Verma',
        role: 'user',
        created_at: new Date('2026-01-20T10:15:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '4',
        email: 'rahul.sharma@company.com',
        name: 'Rahul Sharma',
        role: 'user',
        created_at: new Date('2026-02-01T08:45:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '5',
        email: 'priya.patel@company.com',
        name: 'Priya Patel',
        role: 'user',
        created_at: new Date('2026-02-05T14:20:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '6',
        email: 'amit.kumar@company.com',
        name: 'Amit Kumar',
        role: 'user',
        created_at: new Date('2026-02-10T11:00:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '7',
        email: 'sneha.reddy@company.com',
        name: 'Sneha Reddy',
        role: 'user',
        created_at: new Date('2026-02-15T13:30:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '8',
        email: 'vikram.singh@company.com',
        name: 'Vikram Singh',
        role: 'user',
        created_at: new Date('2026-02-20T09:00:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '9',
        email: 'anita.desai@company.com',
        name: 'Anita Desai',
        role: 'user',
        created_at: new Date('2026-02-25T10:45:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '10',
        email: 'rohit.mehta@company.com',
        name: 'Rohit Mehta',
        role: 'user',
        created_at: new Date('2026-03-01T15:00:00').toISOString(),
        chatbot_enabled: true,
      },
      {
        id: '11',
        email: 'kavita.joshi@company.com',
        name: 'Kavita Joshi',
        role: 'user',
        created_at: new Date('2026-03-05T12:30:00').toISOString(),
        chatbot_enabled: true,
      },
    ];
    localStorage.setItem('users', JSON.stringify(users));
    
    // Initialize user sessions with realistic data
    const sessions: Record<string, any> = {};
    users.forEach((user, index) => {
      if (user.role !== 'admin') {
        sessions[user.id] = {
          loginTime: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time within last hour
          logoutTime: null,
          totalUptime: 3600 + Math.random() * 18000, // 1-6 hours in seconds
          sessionCount: Math.floor(Math.random() * 20) + 5, // 5-25 sessions
          lastActive: new Date(Date.now() - Math.random() * 1800000).toISOString(), // Within last 30 min
        };
      }
    });
    localStorage.setItem('user_sessions', JSON.stringify(sessions));
  }

  if (!localStorage.getItem('datasets')) {
    const datasets: Dataset[] = [
      {
        id: '1',
        name: 'Financial Transaction Records Q1 2026',
        description: 'Complete financial transaction data with customer payment details and audit trails',
        source_id: 's1',
        source_type: 'file',
        created_by: '2',
        created_at: new Date('2026-03-05T09:30:00').toISOString(),
        updated_at: new Date('2026-03-20T14:22:00').toISOString(),
        current_version: 3,
        row_count: 12850,
        column_count: 15,
        file_type: 'csv',
      },
      {
        id: '2',
        name: 'Customer Identity Verification Database',
        description: 'Verified customer identity records with KYC compliance documentation',
        source_id: 's2',
        source_type: 'api',
        created_by: '3',
        created_at: new Date('2026-03-08T11:15:00').toISOString(),
        updated_at: new Date('2026-03-18T16:45:00').toISOString(),
        current_version: 2,
        row_count: 8420,
        column_count: 12,
        file_type: 'json',
      },
      {
        id: '3',
        name: 'Healthcare Patient Records - Confidential',
        description: 'Anonymized patient healthcare records with treatment history and diagnoses',
        source_id: 's3',
        source_type: 'manual',
        created_by: '4',
        created_at: new Date('2026-03-12T08:00:00').toISOString(),
        updated_at: new Date('2026-03-25T13:30:00').toISOString(),
        current_version: 4,
        row_count: 5230,
        column_count: 22,
        file_type: 'csv',
      },
      {
        id: '4',
        name: 'Supply Chain Logistics Data',
        description: 'Real-time supply chain tracking with vendor information and shipment details',
        source_id: 's4',
        source_type: 'api',
        created_by: '2',
        created_at: new Date('2026-03-15T10:20:00').toISOString(),
        updated_at: new Date('2026-03-22T09:15:00').toISOString(),
        current_version: 2,
        row_count: 15600,
        column_count: 18,
        file_type: 'json',
      },
      {
        id: '5',
        name: 'Employee Payroll System Data',
        description: 'Comprehensive employee salary, benefits, and tax withholding information',
        source_id: 's5',
        source_type: 'file',
        created_by: '3',
        created_at: new Date('2026-03-01T07:45:00').toISOString(),
        updated_at: new Date('2026-03-28T18:20:00').toISOString(),
        current_version: 5,
        row_count: 2840,
        column_count: 28,
        file_type: 'csv',
      },
      {
        id: '6',
        name: 'IoT Sensor Network Telemetry',
        description: 'Real-time IoT device data streams from manufacturing floor sensors',
        source_id: 's6',
        source_type: 'api',
        created_by: '4',
        created_at: new Date('2026-03-10T12:00:00').toISOString(),
        updated_at: new Date('2026-03-29T11:30:00').toISOString(),
        current_version: 3,
        row_count: 45680,
        column_count: 10,
        file_type: 'json',
      },
      {
        id: '7',
        name: 'Cybersecurity Threat Intelligence Feed',
        description: 'Aggregated threat intelligence data with CVE mappings and vulnerability assessments',
        source_id: 's7',
        source_type: 'api',
        created_by: '2',
        created_at: new Date('2026-03-14T15:30:00').toISOString(),
        updated_at: new Date('2026-03-27T10:00:00').toISOString(),
        current_version: 6,
        row_count: 9870,
        column_count: 16,
        file_type: 'json',
      },
      {
        id: '8',
        name: 'Marketing Campaign Analytics',
        description: 'Multi-channel marketing campaign performance metrics and customer engagement data',
        source_id: 's8',
        source_type: 'file',
        created_by: '3',
        created_at: new Date('2026-03-18T09:00:00').toISOString(),
        updated_at: new Date('2026-03-26T14:50:00').toISOString(),
        current_version: 2,
        row_count: 18920,
        column_count: 14,
        file_type: 'csv',
      },
      {
        id: '9',
        name: 'Research Lab Experimental Data',
        description: 'Scientific research experimental results with statistical analysis and peer review notes',
        source_id: 's9',
        source_type: 'manual',
        created_by: '4',
        created_at: new Date('2026-03-20T13:15:00').toISOString(),
        updated_at: new Date('2026-03-28T16:40:00').toISOString(),
        current_version: 3,
        row_count: 3420,
        column_count: 32,
        file_type: 'json',
      },
      {
        id: '10',
        name: 'Regulatory Compliance Audit Logs',
        description: 'Complete audit trail for regulatory compliance with GDPR, HIPAA, and SOC2 requirements',
        source_id: 's10',
        source_type: 'file',
        created_by: '2',
        created_at: new Date('2026-03-22T08:30:00').toISOString(),
        updated_at: new Date('2026-03-29T17:25:00').toISOString(),
        current_version: 4,
        row_count: 22340,
        column_count: 20,
        file_type: 'csv',
      },
    ];
    localStorage.setItem('datasets', JSON.stringify(datasets));
  }

  if (!localStorage.getItem('versions')) {
    const versions: DataVersion[] = [
      {
        id: 'v1',
        dataset_id: '1',
        version_number: 1,
        data: [],
        columns: ['transaction_id', 'customer_id', 'amount', 'currency', 'payment_method', 'timestamp', 'status', 'merchant_id', 'category', 'location', 'ip_address', 'device_type', 'fraud_score', 'verified', 'notes'],
        created_at: new Date('2026-03-05T09:30:00').toISOString(),
        created_by: '2',
        change_summary: 'Initial data import from payment gateway',
      },
      {
        id: 'v2',
        dataset_id: '1',
        version_number: 2,
        data: [],
        columns: ['transaction_id', 'customer_id', 'amount', 'currency', 'payment_method', 'timestamp', 'status', 'merchant_id', 'category', 'location', 'ip_address', 'device_type', 'fraud_score', 'verified', 'notes'],
        created_at: new Date('2026-03-15T11:20:00').toISOString(),
        created_by: '2',
        change_summary: 'Added 3,200 new transactions, updated fraud detection scores',
      },
      {
        id: 'v3',
        dataset_id: '1',
        version_number: 3,
        data: [],
        columns: ['transaction_id', 'customer_id', 'amount', 'currency', 'payment_method', 'timestamp', 'status', 'merchant_id', 'category', 'location', 'ip_address', 'device_type', 'fraud_score', 'verified', 'notes'],
        created_at: new Date('2026-03-20T14:22:00').toISOString(),
        created_by: '2',
        change_summary: 'Critical security patch: Removed PII data, anonymized customer identifiers',
      },
    ];
    localStorage.setItem('versions', JSON.stringify(versions));
  }

  if (!localStorage.getItem('transformations')) {
    const transformations: Transformation[] = [
      {
        id: 't1',
        dataset_id: '2',
        version_id: 'v1',
        type: 'clean',
        description: 'Data cleansing: Remove duplicate customer records and validate KYC documentation',
        parameters: { remove_duplicates: true, validate_kyc: true, standardize_addresses: true },
        created_by: '3',
        created_at: new Date('2026-03-08T12:30:00').toISOString(),
      },
      {
        id: 't2',
        dataset_id: '3',
        version_id: 'v1',
        type: 'filter',
        description: 'Anonymization: Strip PII and apply differential privacy to patient records',
        parameters: { anonymize_pii: true, differential_privacy: true, k_anonymity: 5 },
        created_by: '4',
        created_at: new Date('2026-03-12T14:15:00').toISOString(),
      },
      {
        id: 't3',
        dataset_id: '7',
        version_id: 'v1',
        type: 'aggregate',
        description: 'Threat aggregation: Group vulnerabilities by CVE severity and affected systems',
        parameters: { group_by: ['severity', 'system'], aggregate_type: 'count', include_cve_mapping: true },
        created_by: '2',
        created_at: new Date('2026-03-14T16:00:00').toISOString(),
      },
    ];
    localStorage.setItem('transformations', JSON.stringify(transformations));
  }

  if (!localStorage.getItem('lineage')) {
    const lineage: LineageRelationship[] = [
      {
        id: 'l1',
        parent_dataset_id: '1',
        child_dataset_id: '2',
        transformation_id: 't1',
        created_at: new Date('2026-03-08T12:30:00').toISOString(),
      },
      {
        id: 'l2',
        parent_dataset_id: '2',
        child_dataset_id: '3',
        transformation_id: 't2',
        created_at: new Date('2026-03-12T14:15:00').toISOString(),
      },
    ];
    localStorage.setItem('lineage', JSON.stringify(lineage));
  }

  if (!localStorage.getItem('audit_logs')) {
    const logs: AuditLog[] = [
      {
        id: 'log1',
        user_id: '2',
        user_name: 'Chirag Singh',
        action_type: 'CREATE',
        resource_type: 'dataset',
        resource_id: '1',
        resource_name: 'Financial Transaction Records Q1 2026',
        details: 'Uploaded new dataset with 12,850 transaction records',
        timestamp: new Date('2026-03-05T09:30:00').toISOString(),
      },
      {
        id: 'log2',
        user_id: '3',
        user_name: 'Danish Verma',
        action_type: 'TRANSFORM',
        resource_type: 'dataset',
        resource_id: '2',
        resource_name: 'Customer Identity Verification Database',
        details: 'Applied KYC validation and duplicate removal transformation',
        timestamp: new Date('2026-03-08T12:30:00').toISOString(),
      },
      {
        id: 'log3',
        user_id: '4',
        user_name: 'Rahul Sharma',
        action_type: 'CREATE',
        resource_type: 'dataset',
        resource_id: '3',
        resource_name: 'Healthcare Patient Records - Confidential',
        details: 'Uploaded anonymized healthcare data with 5,230 patient records',
        timestamp: new Date('2026-03-12T08:00:00').toISOString(),
      },
      {
        id: 'log4',
        user_id: '4',
        user_name: 'Rahul Sharma',
        action_type: 'TRANSFORM',
        resource_type: 'dataset',
        resource_id: '3',
        resource_name: 'Healthcare Patient Records - Confidential',
        details: 'Applied differential privacy and PII stripping transformation',
        timestamp: new Date('2026-03-12T14:15:00').toISOString(),
      },
      {
        id: 'log5',
        user_id: '2',
        user_name: 'Chirag Singh',
        action_type: 'UPDATE',
        resource_type: 'dataset',
        resource_id: '1',
        resource_name: 'Financial Transaction Records Q1 2026',
        details: 'Security patch applied: Anonymized customer PII data',
        timestamp: new Date('2026-03-20T14:22:00').toISOString(),
      },
      {
        id: 'log6',
        user_id: '2',
        user_name: 'Chirag Singh',
        action_type: 'CREATE',
        resource_type: 'dataset',
        resource_id: '7',
        resource_name: 'Cybersecurity Threat Intelligence Feed',
        details: 'Imported threat intelligence data with 9,870 vulnerability records',
        timestamp: new Date('2026-03-14T15:30:00').toISOString(),
      },
      {
        id: 'log7',
        user_id: '3',
        user_name: 'Danish Verma',
        action_type: 'VIEW',
        resource_type: 'dataset',
        resource_id: '5',
        resource_name: 'Employee Payroll System Data',
        details: 'Accessed payroll data for Q1 2026 reporting',
        timestamp: new Date('2026-03-25T10:15:00').toISOString(),
      },
      {
        id: 'log8',
        user_id: '4',
        user_name: 'Rahul Sharma',
        action_type: 'EXPORT',
        resource_type: 'dataset',
        resource_id: '9',
        resource_name: 'Research Lab Experimental Data',
        details: 'Exported experimental results for peer review submission',
        timestamp: new Date('2026-03-28T16:40:00').toISOString(),
      },
      {
        id: 'log9',
        user_id: '1',
        user_name: 'Admin User',
        action_type: 'VIEW',
        resource_type: 'dataset',
        resource_id: '10',
        resource_name: 'Regulatory Compliance Audit Logs',
        details: 'Reviewed compliance audit logs for SOC2 certification',
        timestamp: new Date('2026-03-29T09:20:00').toISOString(),
      },
      {
        id: 'log10',
        user_id: '2',
        user_name: 'Chirag Singh',
        action_type: 'UPDATE',
        resource_type: 'dataset',
        resource_id: '7',
        resource_name: 'Cybersecurity Threat Intelligence Feed',
        details: 'Updated CVE mappings with latest security advisories',
        timestamp: new Date('2026-03-29T15:45:00').toISOString(),
      },
    ];
    localStorage.setItem('audit_logs', JSON.stringify(logs));
  }
};

// Initialize data on import
initializeMockData();

// Data access functions
export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('users') || '[]');
};

export const getDatasets = (): Dataset[] => {
  return JSON.parse(localStorage.getItem('datasets') || '[]');
};

export const getDataset = (id: string): Dataset | undefined => {
  const datasets = getDatasets();
  return datasets.find(d => d.id === id);
};

export const createDataset = (dataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>): Dataset => {
  const datasets = getDatasets();
  const newDataset: Dataset = {
    ...dataset,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  datasets.push(newDataset);
  localStorage.setItem('datasets', JSON.stringify(datasets));
  
  // Log the action
  const user = getCurrentUser();
  if (user) {
    logAuditAction({
      user_id: user.id,
      user_name: user.name,
      action_type: 'CREATE',
      resource_type: 'dataset',
      resource_id: newDataset.id,
      resource_name: newDataset.name,
      details: `Created new dataset with ${dataset.row_count} rows`,
    });
  }
  
  return newDataset;
};

export const updateDataset = (id: string, updates: Partial<Dataset>): void => {
  const datasets = getDatasets();
  const index = datasets.findIndex(d => d.id === id);
  if (index !== -1) {
    datasets[index] = { ...datasets[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem('datasets', JSON.stringify(datasets));
    
    // Log the action
    const user = getCurrentUser();
    if (user) {
      logAuditAction({
        user_id: user.id,
        user_name: user.name,
        action_type: 'UPDATE',
        resource_type: 'dataset',
        resource_id: id,
        resource_name: datasets[index].name,
        details: 'Updated dataset information',
      });
    }
  }
};

export const deleteDataset = (id: string): void => {
  const datasets = getDatasets();
  const dataset = datasets.find(d => d.id === id);
  const filtered = datasets.filter(d => d.id !== id);
  localStorage.setItem('datasets', JSON.stringify(filtered));
  
  // Log the action
  const user = getCurrentUser();
  if (user && dataset) {
    logAuditAction({
      user_id: user.id,
      user_name: user.name,
      action_type: 'DELETE',
      resource_type: 'dataset',
      resource_id: id,
      resource_name: dataset.name,
      details: 'Deleted dataset',
    });
  }
};

export const getVersions = (datasetId: string): DataVersion[] => {
  const versions = JSON.parse(localStorage.getItem('versions') || '[]');
  return versions.filter((v: DataVersion) => v.dataset_id === datasetId);
};

export const createVersion = (version: Omit<DataVersion, 'id' | 'created_at'>): DataVersion => {
  const versions = JSON.parse(localStorage.getItem('versions') || '[]');
  const newVersion: DataVersion = {
    ...version,
    id: `v${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  versions.push(newVersion);
  localStorage.setItem('versions', JSON.stringify(versions));
  
  // Update dataset current version
  updateDataset(version.dataset_id, { current_version: version.version_number });
  
  return newVersion;
};

export const getTransformations = (datasetId?: string): Transformation[] => {
  const transformations = JSON.parse(localStorage.getItem('transformations') || '[]');
  if (datasetId) {
    return transformations.filter((t: Transformation) => t.dataset_id === datasetId);
  }
  return transformations;
};

export const createTransformation = (transformation: Omit<Transformation, 'id' | 'created_at'>): Transformation => {
  const transformations = getTransformations();
  const newTransformation: Transformation = {
    ...transformation,
    id: `t${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  transformations.push(newTransformation);
  localStorage.setItem('transformations', JSON.stringify(transformations));
  
  // Log the action
  const user = getCurrentUser();
  const dataset = getDataset(transformation.dataset_id);
  if (user && dataset) {
    logAuditAction({
      user_id: user.id,
      user_name: user.name,
      action_type: 'TRANSFORM',
      resource_type: 'dataset',
      resource_id: transformation.dataset_id,
      resource_name: dataset.name,
      details: `Applied transformation: ${transformation.type} - ${transformation.description}`,
    });
  }
  
  return newTransformation;
};

export const getLineageRelationships = (): LineageRelationship[] => {
  return JSON.parse(localStorage.getItem('lineage') || '[]');
};

export const createLineageRelationship = (relationship: Omit<LineageRelationship, 'id' | 'created_at'>): LineageRelationship => {
  const lineage = getLineageRelationships();
  const newRelationship: LineageRelationship = {
    ...relationship,
    id: `l${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  lineage.push(newRelationship);
  localStorage.setItem('lineage', JSON.stringify(lineage));
  return newRelationship;
};

export const getAuditLogs = (): AuditLog[] => {
  return JSON.parse(localStorage.getItem('audit_logs') || '[]');
};

export const logAuditAction = (log: Omit<AuditLog, 'id' | 'timestamp'>): void => {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: `log${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog); // Add to beginning
  localStorage.setItem('audit_logs', JSON.stringify(logs));
};

export const getDashboardStats = (): DashboardStats => {
  const datasets = getDatasets();
  const versions = JSON.parse(localStorage.getItem('versions') || '[]');
  const transformations = getTransformations();
  const users = getUsers();
  const logs = getAuditLogs();
  
  return {
    total_datasets: datasets.length,
    total_versions: versions.length,
    total_transformations: transformations.length,
    total_users: users.length,
    recent_activity: logs.slice(0, 10),
  };
};

// Authentication functions
export const login = (email: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  // Check admin password or regular user password
  const isValidPassword = (email === 'admin@dataprovenance.com' && password === 'rmf@5864') || 
                          (email !== 'admin@dataprovenance.com' && password === 'password');
  
  if (user && isValidPassword) {
    setCurrentUser(user);
    logAuditAction({
      user_id: user.id,
      user_name: user.name,
      action_type: 'VIEW',
      resource_type: 'user',
      resource_id: user.id,
      resource_name: user.name,
      details: 'User logged in',
    });
    trackUserSession(user.id, 'login');
    return user;
  }
  
  return null;
};

export const logout = (): void => {
  const user = getCurrentUser();
  if (user) {
    logAuditAction({
      user_id: user.id,
      user_name: user.name,
      action_type: 'VIEW',
      resource_type: 'user',
      resource_id: user.id,
      resource_name: user.name,
      details: 'User logged out',
    });
    trackUserSession(user.id, 'logout');
  }
  setCurrentUser(null);
};