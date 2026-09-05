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

export const api = {
  // Check backend health
  async checkHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  // Fetch aggregate dashboard metrics
  async getDashboard(): Promise<SystemMetrics & { riskDistribution?: Record<string, number> }> {
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    if (!res.ok) throw new Error(`Failed to fetch dashboard metrics: ${res.statusText}`);
    const json = await res.json();
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

    const url = `${API_BASE_URL}/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
    return res.json();
  },

  // Fetch single transaction
  async getTransactionById(id: string): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch transaction ${id}: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  // Create new transaction (triggers risk analysis & auto-alert)
  async createTransaction(payload: CreateTransactionPayload): Promise<{
    transaction: Transaction;
    alert: Alert | null;
  }> {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || errorJson.message || `Failed to create transaction: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data;
  },

  // Update transaction status
  async updateTransaction(id: string, payload: { status?: string; flagged?: boolean; metadata?: Record<string, any> }): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to update transaction ${id}: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete transaction ${id}: ${res.statusText}`);
  },

  // Fetch alerts
  async getAlerts(params?: { status?: string; severity?: string; limit?: number }): Promise<{ data: Alert[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.severity && params.severity !== 'ALL') query.append('severity', params.severity);
    if (params?.limit) query.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/alerts${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
    return res.json();
  },

  // Update alert status / notes
  async updateAlert(id: string, payload: {
    status?: AlertStatus;
    assignedAnalyst?: string;
    resolutionSummary?: string;
    note?: string;
    author?: string;
  }): Promise<Alert> {
    const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to update alert ${id}: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  // Fetch network graph topology
  async getNetworkTopology(): Promise<NetworkGraphResponse> {
    const res = await fetch(`${API_BASE_URL}/network`);
    if (!res.ok) throw new Error(`Failed to fetch network topology: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }
};
