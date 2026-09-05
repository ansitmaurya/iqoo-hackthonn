// Centralized API client service for TraceGuard Flask + Supabase Backend

import type { Transaction, Alert, SystemMetrics, AlertStatus } from '../types';

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  let base = (envUrl && typeof envUrl === 'string' && envUrl.trim()) 
    ? envUrl.trim() 
    : 'https://traceguard-backend-r1n6.onrender.com/api';

  // Normalize: remove trailing slashes
  base = base.replace(/\/+$/, '');

  // Normalize: append /api if missing
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }

  return base;
}

export const API_BASE_URL = resolveApiBaseUrl();

console.log('[TraceGuard API] Active Base URL:', API_BASE_URL, '| Raw VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

export interface CreateTransactionPayload {
  id?: string;
  sender: string;
  sender_name?: string;
  receiver?: string;
  receiver_name?: string;
  amount: number;
  currency?: string;
  type?: string;
  category?: string;
  location?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    ipAddress: string;
  };
  device?: {
    deviceId: string;
    browser: string;
    os: string;
    isKnownDevice: boolean;
    userAgent: string;
  };
  metadata?: Record<string, any>;
}

export interface NetworkGraphResponse {
  nodes: Array<{
    id: string;
    node_name: string;
    node_type: string;
    risk_score: number;
    metadata: Record<string, any>;
  }>;
  links: Array<{
    id: string;
    source: string;
    target: string;
    transaction_count: number;
    total_amount: number;
    risk_score: number;
  }>;
}

async function fetchWithLogging<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    console.log(`[TraceGuard API] Requesting: ${options?.method || 'GET'} ${url}`);
    const res = await fetch(url, options);
    console.log(`[TraceGuard API] Response: ${res.status} ${res.statusText} from ${url}`);
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (_) {}
      
      const errorMsg = parsedError.error || parsedError.message || `HTTP ${res.status}: ${res.statusText}`;
      console.warn(`[TraceGuard API] HTTP Error on ${url}:`, errorMsg);
      throw new Error(errorMsg);
    }
    
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error(`[TraceGuard API] Network / CORS failure on ${url}:`, err.message || err);
    throw err;
  }
}

export const api = {
  // Check backend health
  async checkHealth(): Promise<{ status: string; service: string }> {
    return await fetchWithLogging('/health');
  },

  // Fetch aggregate dashboard metrics
  async getDashboard(): Promise<SystemMetrics & { riskDistribution?: Record<string, number> }> {
    const json = await fetchWithLogging<{ success: boolean; data: SystemMetrics & { riskDistribution?: Record<string, number> } }>('/dashboard');
    return json.data;
  },

  // Fetch transactions with pagination & filters
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    minRisk?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.minRisk) query.append('min_risk', params.minRisk.toString());
    if (params?.category && params.category !== 'ALL') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await fetchWithLogging(`/transactions${queryString}`);
  },

  // Fetch single transaction
  async getTransactionById(id: string): Promise<Transaction> {
    const json = await fetchWithLogging<{ success: boolean; data: Transaction }>(`/transactions/${id}`);
    return json.data;
  },

  // Create new transaction (triggers risk analysis & auto-alert)
  async createTransaction(payload: CreateTransactionPayload): Promise<{
    transaction: Transaction;
    alert: Alert | null;
  }> {
    const json = await fetchWithLogging<{ success: boolean; data: { transaction: Transaction; alert: Alert | null } }>('/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return json.data;
  },

  // Update transaction status
  async updateTransaction(id: string, payload: { status?: string; flagged?: boolean; metadata?: Record<string, any> }): Promise<Transaction> {
    const json = await fetchWithLogging<{ success: boolean; data: Transaction }>(`/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return json.data;
  },

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    await fetchWithLogging(`/transactions/${id}`, { method: 'DELETE' });
  },

  // Fetch alerts
  async getAlerts(params?: { status?: string; severity?: string; limit?: number }): Promise<{ data: Alert[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.severity && params.severity !== 'ALL') query.append('severity', params.severity);
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return await fetchWithLogging(`/alerts${queryString}`);
  },

  // Update alert status / notes
  async updateAlert(id: string, payload: {
    status?: AlertStatus;
    assignedAnalyst?: string;
    resolutionSummary?: string;
    note?: string;
    author?: string;
  }): Promise<Alert> {
    const json = await fetchWithLogging<{ success: boolean; data: Alert }>(`/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return json.data;
  },

  // Fetch network graph topology
  async getNetworkTopology(): Promise<NetworkGraphResponse> {
    const json = await fetchWithLogging<{ success: boolean; data: NetworkGraphResponse }>('/network');
    return json.data;
  }
};
