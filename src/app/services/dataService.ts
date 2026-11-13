import { User, Dataset, DataVersion, Transformation, LineageRelationship, AuditLog, DashboardStats } from '../types';

// ─── API Client ───────────────────────────────────────────────────────────────

const API_BASE = '/api';

const getToken = (): string | null => localStorage.getItem('adps_token');

const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    // Token expired — clear and redirect to login
    localStorage.removeItem('adps_token');
    localStorage.removeItem('adps_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  return res;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string): Promise<User | null> => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return null;

  const { token, user } = await res.json();
  localStorage.setItem('adps_token', token);
  localStorage.setItem('adps_user', JSON.stringify(user));
  return user as User;
};

export const logout = async (): Promise<void> => {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors on logout
  }
  localStorage.removeItem('adps_token');
  localStorage.removeItem('adps_user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('adps_user');
  return userStr ? JSON.parse(userStr) : null;
};

// Keep setCurrentUser for compatibility (login now handles this)
export const setCurrentUser = (user: User | null): void => {
  if (user) localStorage.setItem('adps_user', JSON.stringify(user));
  else localStorage.removeItem('adps_user');
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  const res = await apiFetch('/users');
  if (!res.ok) return [];
  return res.json();
};

export const blockUser = async (userId: string): Promise<void> => {
  await apiFetch(`/users/${userId}/block`, { method: 'PUT' });
};

export const unblockUser = async (userId: string): Promise<void> => {
  await apiFetch(`/users/${userId}/block`, { method: 'PUT' });
};

export const setChatbotEnabled = async (userId: string, enabled: boolean): Promise<void> => {
  await apiFetch(`/users/${userId}/chatbot`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
};

// Stub kept for compatibility — session tracking is now server-side
export const trackUserSession = (_userId: string, _action: 'login' | 'logout'): void => {};
export const getUserSessions = (): Record<string, unknown> => ({});

// ─── Datasets ─────────────────────────────────────────────────────────────────

export const getDatasets = async (): Promise<Dataset[]> => {
  const res = await apiFetch('/datasets');
  if (!res.ok) return [];
  return res.json();
};

export const getDataset = async (id: string): Promise<(Dataset & { versions: DataVersion[] }) | null> => {
  const res = await apiFetch(`/datasets/${id}`);
  if (!res.ok) return null;
  return res.json();
};

export const createDataset = async (data: Partial<Dataset>): Promise<Dataset | null> => {
  const res = await apiFetch('/datasets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
};

export const updateDataset = async (id: string, data: Partial<Dataset> & { change_summary?: string }): Promise<Dataset | null> => {
  const res = await apiFetch(`/datasets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
};

export const deleteDataset = async (id: string): Promise<void> => {
  await apiFetch(`/datasets/${id}`, { method: 'DELETE' });
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await apiFetch('/audit-logs');
  if (!res.ok) return [];
  return res.json();
};

export const logAction = async (
  actionType: string,
  resourceName: string,
  resourceId?: string,
  details?: string,
): Promise<void> => {
  try {
    await apiFetch('/audit-logs', {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType, resource_name: resourceName, resource_id: resourceId, details }),
    });
  } catch {
    // Best-effort — don't crash if logging fails
  }
};

// ─── Lineage & Transformations ────────────────────────────────────────────────

export const getLineageRelationships = async (): Promise<LineageRelationship[]> => {
  const res = await apiFetch('/lineage');
  if (!res.ok) return [];
  return res.json();
};

export const getTransformations = async (datasetId?: string): Promise<Transformation[]> => {
  try {
    const res = await apiFetch('/lineage/transformations');
    if (!res.ok) return [];
    const all: Transformation[] = await res.json();
    return datasetId ? all.filter(t => t.dataset_id === datasetId) : all;
  } catch { return []; }
};

export const getVersions = async (datasetId: string): Promise<DataVersion[]> => {
  const dataset = await getDataset(datasetId);
  return dataset?.versions ?? [];
};

export const createVersion = async (data: {
  dataset_id: string;
  version_number?: number;
  columns?: string[];
  created_by?: string;
  change_summary?: string;
  data?: unknown[];
}): Promise<DataVersion | null> => {
  try {
    const res = await apiFetch(`/datasets/${data.dataset_id}/versions`, {
      method: 'POST',
      body: JSON.stringify({ change_summary: data.change_summary, columns: data.columns }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

export const createTransformation = async (data: {
  dataset_id: string;
  version_id?: string;
  type?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  created_by?: string;
}): Promise<Transformation | null> => {
  try {
    const res = await apiFetch('/lineage/transformations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = async (): Promise<DashboardStats | null> => {
  const res = await apiFetch('/dashboard/stats');
  if (!res.ok) return null;
  return res.json();
};
