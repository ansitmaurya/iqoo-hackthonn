import type { 
  Account, 
  Alert, 
  AlertStatus, 
  SystemMetrics, 
  Transaction, 
  RiskLevel 
} from '../../types';
import type { 
  CreateTransactionPayload, 
  NetworkGraphResponse 
} from '../api';
import type { 
  IDataProvider, 
  DataProviderHealth, 
  DataSourceMode 
} from './types';

import rawAccounts from '../../data/accounts.json';
import rawTransactions from '../../data/transactions.json';

// Helper to generate seed alerts from transactions
function generatePrototypeAlerts(txs: Transaction[]): Alert[] {
  const flaggedTxs = txs.filter(t => t.flagged || t.riskScore >= 60).slice(0, 45);
  return flaggedTxs.map((tx, idx) => {
    const alertId = `ALT-${6000 + idx * 23}`;
    const statusList: AlertStatus[] = ['OPEN', 'OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'FALSE_POSITIVE'];
    const status = idx < 8 ? 'OPEN' : statusList[idx % statusList.length];
    return {
      id: alertId,
      transactionId: tx.id,
      transaction: tx,
      accountId: tx.accountId,
      accountName: tx.accountName,
      riskScore: tx.riskScore,
      riskLevel: tx.riskLevel,
      status,
      assignedAnalyst: idx % 2 === 0 ? 'Analyst Sarah (SecOps)' : 'Analyst Chen (FinCrime)',
      createdAt: tx.timestamp,
      updatedAt: tx.timestamp,
      triggeredRules: tx.triggeredRules || [],
      notes: [
        {
          id: `NOTE-${idx}-1`,
          author: 'Sentinel AI Engine (Prototype)',
          timestamp: tx.timestamp,
          content: `Automated prototype alert triggered with composite risk score of ${tx.riskScore}/100. Violated rules: ${(tx.triggeredRules || []).map(r => r.ruleName).join('; ') || 'Threshold Outlier'}.`
        }
      ]
    };
  });
}

export class DemoDataProvider implements IDataProvider {
  public readonly mode: DataSourceMode = 'DEMO';
  private accounts: Account[];
  private transactions: Transaction[];
  private alerts: Alert[];

  constructor() {
    this.accounts = JSON.parse(JSON.stringify(rawAccounts)) as Account[];
    this.transactions = JSON.parse(JSON.stringify(rawTransactions)) as Transaction[];
    this.alerts = generatePrototypeAlerts(this.transactions);
  }

  async checkHealth(): Promise<DataProviderHealth> {
    return {
      status: 'online',
      service: 'TraceGuard In-Memory Demo Provider',
      database: 'Prototype In-Memory JSON (Offline Ready)',
      mode: 'DEMO'
    };
  }

  async fetchAccounts(): Promise<Account[]> {
    return [...this.accounts];
  }

  async fetchDashboardMetrics(): Promise<SystemMetrics & { riskDistribution?: Record<string, number> }> {
    const txs = this.transactions;
    const flagged = txs.filter(t => t.flagged || t.riskScore >= 60);
    const blocked = txs.filter(t => t.status === 'BLOCKED');
    const totalVol = txs.reduce((sum, t) => sum + t.amount, 0);
    const atRiskVol = flagged.reduce((sum, t) => sum + t.amount, 0);
    const openAlerts = this.alerts.filter(a => a.status === 'OPEN' || a.status === 'IN_REVIEW');
    const critAlerts = this.alerts.filter(a => a.riskLevel === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE');

    const lowCount = txs.filter(t => t.riskLevel === 'LOW').length;
    const medCount = txs.filter(t => t.riskLevel === 'MEDIUM').length;
    const highCount = txs.filter(t => t.riskLevel === 'HIGH').length;
    const critCount = txs.filter(t => t.riskLevel === 'CRITICAL').length;

    return {
      tps: 1.4,
      totalProcessedCount: txs.length,
      flaggedCount: flagged.length,
      blockedCount: blocked.length,
      fraudRate: txs.length > 0 ? parseFloat(((flagged.length / txs.length) * 100).toFixed(2)) : 0,
      totalVolume: parseFloat(totalVol.toFixed(2)),
      totalAtRiskVolume: parseFloat(atRiskVol.toFixed(2)),
      openAlertsCount: openAlerts.length,
      criticalAlertsCount: critAlerts.length,
      riskDistribution: {
        low: lowCount,
        medium: medCount,
        high: highCount,
        critical: critCount
      }
    };
  }

  async fetchTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    minRisk?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: Transaction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    let filtered = [...this.transactions];

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter(t => t.status === params.status);
    }
    if (params?.minRisk && params.minRisk > 0) {
      filtered = filtered.filter(t => t.riskScore >= params.minRisk!);
    }
    if (params?.category && params.category !== 'ALL') {
      filtered = filtered.filter(t => t.category === params.category);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(s) ||
        t.accountName.toLowerCase().includes(s) ||
        t.accountId.toLowerCase().includes(s) ||
        (t.recipientName && t.recipientName.toLowerCase().includes(s)) ||
        (t.recipientId && t.recipientId.toLowerCase().includes(s))
      );
    }

    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const pagedData = filtered.slice(start, start + limit);

    return {
      data: pagedData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async fetchTransactionById(id: string): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) || null;
  }

  async createTransaction(payload: CreateTransactionPayload): Promise<{ transaction: Transaction; alert: Alert | null }> {
    const isCritical = payload.amount > 50000;
    const isHigh = payload.amount > 10000;
    const riskScore = isCritical ? 88 : isHigh ? 65 : 18;
    const riskLevel: RiskLevel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'LOW';
    const flagged = isHigh || isCritical;
    const status = isCritical ? 'BLOCKED' : (flagged ? 'FLAGGED' : 'SETTLED');

    const newTx: Transaction = {
      id: payload.id || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      accountId: payload.sender,
      accountName: payload.sender_name || payload.sender,
      recipientId: payload.receiver,
      recipientName: payload.receiver_name || payload.receiver,
      amount: payload.amount,
      currency: payload.currency || 'USD',
      type: (payload.type as any) || 'TRANSFER',
      category: (payload.category as any) || 'PEER_TRANSFER',
      timestamp: new Date().toISOString(),
      location: payload.location || {
        city: 'New York',
        country: 'US',
        latitude: 40.7128,
        longitude: -74.006,
        ipAddress: '198.51.100.42'
      },
      device: payload.device || {
        deviceId: 'DEV-MOCK-99',
        browser: 'Chrome',
        os: 'Windows',
        isKnownDevice: true,
        userAgent: 'TraceGuard/2.0'
      },
      riskScore,
      riskLevel,
      triggeredRules: flagged ? [
        {
          ruleId: 'RUL-DEMO-VAL',
          ruleName: isCritical ? 'Critical Value Threshold Outlier' : 'Elevated Amount Anomaly',
          severity: isCritical ? 'CRITICAL' : 'WARNING',
          scoreContribution: isCritical ? 50 : 30,
          description: `Transaction amount $${payload.amount.toLocaleString()} exceeded prototype behavioral threshold.`,
          evidence: { amount: payload.amount, threshold: isCritical ? 50000 : 10000 }
        }
      ] : [],
      flagged,
      status,
      metadata: payload.metadata || { source: 'Demo Data Ingest' }
    };

    this.transactions.unshift(newTx);

    let createdAlert: Alert | null = null;
    if (flagged) {
      createdAlert = {
        id: `ALT-${Math.floor(7000 + Math.random() * 2999)}`,
        transactionId: newTx.id,
        transaction: newTx,
        accountId: newTx.accountId,
        accountName: newTx.accountName,
        riskScore: newTx.riskScore,
        riskLevel: newTx.riskLevel,
        status: 'OPEN',
        assignedAnalyst: 'Unassigned (Demo Triage)',
        createdAt: newTx.timestamp,
        updatedAt: newTx.timestamp,
        triggeredRules: newTx.triggeredRules,
        notes: [
          {
            id: `NOTE-${Date.now()}`,
            author: 'Demo Engine',
            timestamp: newTx.timestamp,
            content: `Demo alert generated for ${riskLevel} risk transaction of $${newTx.amount.toLocaleString()}.`
          }
        ]
      };
      this.alerts.unshift(createdAlert);
    }

    return { transaction: newTx, alert: createdAlert };
  }

  async updateTransaction(id: string, payload: { status?: string; flagged?: boolean; metadata?: Record<string, any> }): Promise<Transaction> {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) throw new Error(`Transaction ${id} not found in Demo dataset`);
    if (payload.status) tx.status = payload.status as any;
    if (payload.flagged !== undefined) tx.flagged = payload.flagged;
    if (payload.metadata) tx.metadata = { ...tx.metadata, ...payload.metadata };
    return { ...tx };
  }

  async fetchAlerts(params?: { status?: string; severity?: string; limit?: number }): Promise<{ data: Alert[]; total: number }> {
    let filtered = [...this.alerts];
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter(a => a.status === params.status);
    }
    if (params?.severity && params.severity !== 'ALL') {
      filtered = filtered.filter(a => a.riskLevel === params.severity);
    }
    const limit = params?.limit || 50;
    return {
      data: filtered.slice(0, limit),
      total: filtered.length
    };
  }

  async updateAlert(id: string, payload: {
    status?: AlertStatus;
    assignedAnalyst?: string;
    resolutionSummary?: string;
    note?: string;
    author?: string;
  }): Promise<Alert> {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found in Demo dataset`);

    if (payload.status) alert.status = payload.status;
    if (payload.assignedAnalyst) alert.assignedAnalyst = payload.assignedAnalyst;
    if (payload.resolutionSummary) alert.resolutionSummary = payload.resolutionSummary;
    if (payload.note) {
      alert.notes.push({
        id: `NOTE-${Date.now()}`,
        author: payload.author || 'Analyst (Demo)',
        timestamp: new Date().toISOString(),
        content: payload.note
      });
    }
    alert.updatedAt = new Date().toISOString();
    return { ...alert };
  }

  async fetchNetworkTopology(): Promise<NetworkGraphResponse> {
    const topAccounts = this.accounts.slice(0, 45);
    const nodes = topAccounts.map(a => ({
      id: a.id,
      node_name: a.ownerName,
      node_type: a.type,
      risk_score: a.riskScore,
      metadata: {
        balance: a.balance,
        accountNumber: a.accountNumber
      }
    }));

    const linkMap = new Map<string, { id: string; source: string; target: string; count: number; total_amount: number; risk_score: number }>();
    this.transactions.slice(0, 250).forEach(tx => {
      if (tx.recipientId) {
        const key = `${tx.accountId}->${tx.recipientId}`;
        if (linkMap.has(key)) {
          const l = linkMap.get(key)!;
          l.count += 1;
          l.total_amount += tx.amount;
          l.risk_score = Math.max(l.risk_score, tx.riskScore);
        } else {
          linkMap.set(key, {
            id: `LNK-${key}`,
            source: tx.accountId,
            target: tx.recipientId,
            count: 1,
            total_amount: tx.amount,
            risk_score: tx.riskScore
          });
        }
      }
    });

    return {
      nodes,
      links: Array.from(linkMap.values()).map(l => ({
        id: l.id,
        source: l.source,
        target: l.target,
        transaction_count: l.count,
        total_amount: parseFloat(l.total_amount.toFixed(2)),
        risk_score: l.risk_score
      }))
    };
  }
}
