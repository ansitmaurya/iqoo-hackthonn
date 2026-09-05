import type { Account, Alert, AlertStatus, SystemMetrics, Transaction } from '../../types';
import type { CreateTransactionPayload, NetworkGraphResponse } from '../api';

export type DataSourceMode = 'DEMO' | 'LIVE';

export interface DataProviderHealth {
  status: 'online' | 'offline';
  service: string;
  database?: string;
  mode: DataSourceMode;
}

export interface IDataProvider {
  mode: DataSourceMode;
  
  // Health / Connection Check
  checkHealth(): Promise<DataProviderHealth>;

  // Dashboard Metrics
  fetchDashboardMetrics(): Promise<SystemMetrics & { riskDistribution?: Record<string, number> }>;

  // Transactions
  fetchTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    minRisk?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>;

  fetchTransactionById(id: string): Promise<Transaction | null>;
  createTransaction(payload: CreateTransactionPayload): Promise<{ transaction: Transaction; alert: Alert | null }>;
  updateTransaction(id: string, payload: { status?: string; flagged?: boolean; metadata?: Record<string, any> }): Promise<Transaction>;
  deleteTransaction?(id: string): Promise<void>;

  // Alerts
  fetchAlerts(params?: { status?: string; severity?: string; limit?: number }): Promise<{ data: Alert[]; total: number }>;
  updateAlert(id: string, payload: {
    status?: AlertStatus;
    assignedAnalyst?: string;
    resolutionSummary?: string;
    note?: string;
    author?: string;
  }): Promise<Alert>;

  // Network Topology Graph
  fetchNetworkTopology(): Promise<NetworkGraphResponse>;

  // Accounts
  fetchAccounts(): Promise<Account[]>;
}
