import type { 
  Account, 
  Alert, 
  AlertStatus, 
  SystemMetrics, 
  Transaction 
} from '../../types';
import { 
  api, 
  API_BASE_URL, 
  type CreateTransactionPayload, 
  type NetworkGraphResponse 
} from '../api';
import type { 
  IDataProvider, 
  DataProviderHealth, 
  DataSourceMode 
} from './types';

import rawAccounts from '../../data/accounts.json';

export class LiveDataProvider implements IDataProvider {
  public readonly mode: DataSourceMode = 'LIVE';

  async checkHealth(): Promise<DataProviderHealth> {
    try {
      const res = await api.checkHealth();
      return {
        status: res.status === 'online' ? 'online' : 'offline',
        service: res.service || 'TraceGuard Flask Backend',
        database: (res as any).database || 'PostgreSQL / Supabase Connected',
        mode: 'LIVE'
      };
    } catch (err: any) {
      throw new Error(`Live Flask Backend unreachable at ${API_BASE_URL}: ${err.message}`);
    }
  }

  async fetchAccounts(): Promise<Account[]> {
    try {
      const baseAccounts = rawAccounts as Account[];
      const network = await api.getNetworkTopology();
      if (network && network.nodes && network.nodes.length > 0) {
        const nodeMap = new Map(network.nodes.map(n => [n.id, n]));
        return baseAccounts.map(acc => {
          const liveNode = nodeMap.get(acc.id);
          if (liveNode) {
            return {
              ...acc,
              riskScore: liveNode.risk_score ?? acc.riskScore,
              ownerName: liveNode.node_name || acc.ownerName
            };
          }
          return acc;
        });
      }
      return baseAccounts;
    } catch (err) {
      console.warn('Live accounts fallback to cached account directory:', err);
      return rawAccounts as Account[];
    }
  }

  async fetchDashboardMetrics(): Promise<SystemMetrics & { riskDistribution?: Record<string, number> }> {
    return await api.getDashboard();
  }

  async fetchTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    minRisk?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    return await api.getTransactions(params);
  }

  async fetchTransactionById(id: string): Promise<Transaction | null> {
    try {
      return await api.getTransactionById(id);
    } catch {
      return null;
    }
  }

  async createTransaction(payload: CreateTransactionPayload): Promise<{ transaction: Transaction; alert: Alert | null }> {
    return await api.createTransaction(payload);
  }

  async updateTransaction(id: string, payload: { status?: string; flagged?: boolean; metadata?: Record<string, any> }): Promise<Transaction> {
    return await api.updateTransaction(id, payload);
  }

  async deleteTransaction(id: string): Promise<void> {
    return await api.deleteTransaction(id);
  }

  async fetchAlerts(params?: { status?: string; severity?: string; limit?: number }): Promise<{ data: Alert[]; total: number }> {
    try {
      return await api.getAlerts(params);
    } catch (err) {
      console.warn('Live alerts query fallback:', err);
      return { data: [], total: 0 };
    }
  }

  async updateAlert(id: string, payload: {
    status?: AlertStatus;
    assignedAnalyst?: string;
    resolutionSummary?: string;
    note?: string;
    author?: string;
  }): Promise<Alert> {
    return await api.updateAlert(id, payload);
  }

  async fetchNetworkTopology(): Promise<NetworkGraphResponse> {
    try {
      return await api.getNetworkTopology();
    } catch (err) {
      console.warn('Live network topology fallback to local topology generator:', err);
      return { nodes: [], links: [] };
    }
  }
}
