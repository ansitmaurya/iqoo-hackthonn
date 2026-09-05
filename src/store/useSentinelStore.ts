import { create } from 'zustand';
import type { 
  Account, 
  Alert, 
  AlertNote, 
  AlertStatus, 
  AuditLogEntry, 
  Investigation, 
  SuspiciousActivityReport, 
  SystemMetrics, 
  Transaction 
} from '../types';
import rawAccounts from '../data/accounts.json';
import rawTransactions from '../data/transactions.json';
import { TransactionSimulator } from '../engine/simulator';
import type { ForceScenario } from '../engine/simulator';
import { api, type CreateTransactionPayload } from '../services/api';

const STORAGE_KEY = 'SENTINEL_FLOW_V1_STORE';

interface SentinelStoreState {
  // Core Entities
  accounts: Account[];
  transactions: Transaction[];
  alerts: Alert[];
  investigations: Investigation[];
  auditLogs: AuditLogEntry[];

  // API Backend State
  isApiConnected: boolean;
  apiLoading: boolean;
  apiError: string | null;
  isIngestModalOpen: boolean;

  // Real-time & Simulator state
  isSimulating: boolean;
  simulationSpeed: number; // 1, 2, 5
  recentNewTxIds: string[]; // For highlight animations
  recentNewAlertIds: string[];

  // Selected item drawers & modals
  selectedAlertId: string | null;
  selectedTxId: string | null;
  selectedAccountId: string | null;
  selectedInvestigationId: string | null;
  activeTab: 'live' | 'alerts' | 'transactions' | 'network' | 'global' | 'analytics' | 'investigations' | 'audit';

  // Audio Alerts Enabled
  audioEnabled: boolean;

  // Backend Sync & Mutation Actions
  syncWithBackend: () => Promise<void>;
  submitTransactionApi: (payload: CreateTransactionPayload) => Promise<{ transaction: Transaction; alert: Alert | null }>;
  setIsIngestModalOpen: (open: boolean) => void;

  // Actions
  startSimulation: () => void;
  stopSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  triggerForcedScenario: (scenario: ForceScenario, targetAccountId?: string) => void;
  ingestTransaction: (tx: Transaction) => void;

  // Alert Actions
  updateAlertStatus: (alertId: string, status: AlertStatus, resolutionSummary?: string) => void;
  assignAlertAnalyst: (alertId: string, analystName: string) => void;
  addAlertNote: (alertId: string, author: string, content: string) => void;
  bulkUpdateAlerts: (alertIds: string[], status: AlertStatus) => void;

  // Account Actions
  updateAccountStatus: (accountId: string, status: Account['status'], reason?: string) => void;
  addAccountRiskFactor: (accountId: string, factor: string) => void;

  // Investigation Actions
  createInvestigation: (title: string, targetAccountId: string, relatedAlertIds?: string[], relatedTxIds?: string[]) => Investigation;
  updateInvestigationStatus: (id: string, status: Investigation['status']) => void;
  toggleEvidenceCheck: (invId: string, evidenceId: string) => void;
  updateInvestigationFindings: (invId: string, findings: string) => void;
  generateSAR: (invId: string, report: SuspiciousActivityReport) => void;

  // Navigation & Selection
  setActiveTab: (tab: SentinelStoreState['activeTab']) => void;
  setSelectedAlertId: (id: string | null) => void;
  setSelectedTxId: (id: string | null) => void;
  setSelectedAccountId: (id: string | null) => void;
  setSelectedInvestigationId: (id: string | null) => void;
  toggleAudio: () => void;

  // Reset Data to Clean Seed
  resetToDefaultSeeds: () => void;

  // Metrics helper
  getMetrics: () => SystemMetrics;
}

// Singleton simulator instance holder
let simulatorInstance: TransactionSimulator | null = null;

// Helper to initialize seed alerts and investigations
function generateInitialAlerts(txs: Transaction[]): Alert[] {
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
      triggeredRules: tx.triggeredRules,
      notes: [
        {
          id: `NOTE-${idx}-1`,
          author: 'Sentinel AI Engine',
          timestamp: tx.timestamp,
          content: `Automated alert triggered with composite risk score of ${tx.riskScore}/100. Violated rules: ${tx.triggeredRules.map(r => r.ruleName).join('; ')}.`
        }
      ]
    };
  });
}

function generateInitialInvestigations(accounts: Account[], alerts: Alert[], txs: Transaction[]): Investigation[] {
  const muleAccounts = accounts.filter(a => a.type === 'MULE_SUSPECT');
  
  return muleAccounts.slice(0, 3).map((acc, idx) => {
    const relatedAlerts = alerts.filter(a => a.accountId === acc.id).map(a => a.id);
    const relatedTxs = txs.filter(t => t.accountId === acc.id).map(t => t.id);
    const atRisk = txs.filter(t => t.accountId === acc.id).reduce((sum, t) => sum + t.amount, 0);

    return {
      id: `INV-2026-${(101 + idx).toString()}`,
      title: `Syndicate Cash-Out & Structuring Ring: ${acc.ownerName}`,
      targetAccountId: acc.id,
      targetAccountName: acc.ownerName,
      relatedAlertIds: relatedAlerts.length > 0 ? relatedAlerts : [alerts[idx]?.id || 'ALT-6000'],
      relatedTransactionIds: relatedTxs.slice(0, 10),
      leadAnalyst: 'Analyst Sarah (SecOps)',
      status: idx === 0 ? 'INVESTIGATING' : idx === 1 ? 'ESCALATED_LEGAL' : 'OPEN',
      severity: 'CRITICAL',
      totalAtRiskAmount: parseFloat(atRisk.toFixed(2)),
      createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      findings: `Preliminary telemetry correlates multiple rapid wire transfers just below $10,000 threshold with known Tor exit nodes and sudden IP hops to Singapore/Frankfurt. Account shows classic smurfing mule profile.`,
      evidenceChecklist: [
        { id: 'ev-1', label: 'Verify IP geolocation jump (>800 km/h speed threshold)', checked: true },
        { id: 'ev-2', label: 'Cross-reference recipient accounts with SAR syndicate blacklist', checked: true },
        { id: 'ev-3', label: 'Evaluate device fingerprint consistency and browser user-agent', checked: true },
        { id: 'ev-4', label: 'Draft and submit FinCEN Suspicious Activity Report (SAR)', checked: idx > 0 }
      ]
    };
  });
}

function generateInitialAuditLogs(): AuditLogEntry[] {
  return [
    {
      id: 'AUD-901',
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      actor: 'System Risk Engine v2.4',
      action: 'SYSTEM_BOOT',
      targetId: 'SYS-GLOBAL',
      details: 'Sentinel Flow automated detection pipeline initialized. 7 deterministic rule modules active.'
    },
    {
      id: 'AUD-902',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      actor: 'Analyst Sarah (SecOps)',
      action: 'ACCOUNT_FROZEN',
      targetId: 'ACC-12604',
      details: 'Account frozen due to recurring structuring triggers and impossible travel anomalies.'
    },
    {
      id: 'AUD-903',
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      actor: 'Analyst Chen (FinCrime)',
      action: 'SAR_GENERATED',
      targetId: 'INV-2026-102',
      details: 'Suspicious Activity Report draft generated for FinCEN BSA compliance.'
    }
  ];
}

// Load saved state or default seeds
function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.accounts && parsed.transactions && parsed.alerts) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load saved Sentinel state:', e);
  }

  const accounts = rawAccounts as Account[];
  const transactions = rawTransactions as Transaction[];
  const alerts = generateInitialAlerts(transactions);
  const investigations = generateInitialInvestigations(accounts, alerts, transactions);
  const auditLogs = generateInitialAuditLogs();

  return {
    accounts,
    transactions,
    alerts,
    investigations,
    auditLogs
  };
}

const initialData = loadInitialState();

export const useSentinelStore = create<SentinelStoreState>((set, get) => ({
  accounts: initialData.accounts,
  transactions: initialData.transactions,
  alerts: initialData.alerts,
  investigations: initialData.investigations,
  auditLogs: initialData.auditLogs,

  isApiConnected: false,
  apiLoading: false,
  apiError: null,
  isIngestModalOpen: false,

  isSimulating: true,
  simulationSpeed: 1,
  recentNewTxIds: [],
  recentNewAlertIds: [],

  selectedAlertId: null,
  selectedTxId: null,
  selectedAccountId: null,
  selectedInvestigationId: null,
  activeTab: 'live',
  audioEnabled: false,

  setIsIngestModalOpen: (open: boolean) => set({ isIngestModalOpen: open }),

  // Hydrate store from live Flask + Supabase REST API
  syncWithBackend: async () => {
    set({ apiLoading: true, apiError: null });
    try {
      const health = await api.checkHealth();
      if (health.status === 'online') {
        const [txsRes, alertsRes] = await Promise.all([
          api.getTransactions({ limit: 100 }),
          api.getAlerts({ limit: 50 })
        ]);

        if (txsRes?.data && txsRes.data.length > 0) {
          set((state) => ({
            transactions: txsRes.data,
            alerts: alertsRes?.data && alertsRes.data.length > 0 ? alertsRes.data : state.alerts,
            isApiConnected: true,
            apiLoading: false,
            apiError: null
          }));
          return;
        }
      }
      set({ isApiConnected: true, apiLoading: false });
    } catch (err: any) {
      // Backend not running yet or unreachable -> keep fallback in-memory state smoothly
      set({ isApiConnected: false, apiLoading: false, apiError: err.message });
    }
  },

  // Submit transaction to live backend, evaluate risk, persist and update store
  submitTransactionApi: async (payload: CreateTransactionPayload) => {
    try {
      const result = await api.createTransaction(payload);
      const { transaction: tx, alert } = result;

      // Ingest into local store and state
      get().ingestTransaction(tx);

      if (alert) {
        set((state) => ({
          alerts: [alert, ...state.alerts.filter(a => a.id !== alert.id)],
          recentNewAlertIds: [alert.id, ...state.recentNewAlertIds.slice(0, 4)]
        }));
      }

      return result;
    } catch (err) {
      console.warn('Backend offline or unreachable, falling back to local simulation:', err);
      // If offline, fallback to in-memory evaluation
      const mockTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
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
          deviceId: 'DEV-OFFLINE',
          browser: 'Chrome',
          os: 'Windows',
          isKnownDevice: true,
          userAgent: 'TraceGuard/2.0'
        },
        riskScore: payload.amount > 50000 ? 88 : payload.amount > 10000 ? 65 : 15,
        riskLevel: payload.amount > 50000 ? 'CRITICAL' : payload.amount > 10000 ? 'HIGH' : 'LOW',
        triggeredRules: [],
        flagged: payload.amount > 10000,
        status: payload.amount > 50000 ? 'BLOCKED' : 'SETTLED'
      };
      get().ingestTransaction(mockTx);
      return { transaction: mockTx, alert: null };
    }
  },

  startSimulation: () => {
    if (!simulatorInstance) {
      simulatorInstance = new TransactionSimulator(
        () => get().accounts,
        () => get().transactions,
        {
          speedMultiplier: get().simulationSpeed,
          onTransactionGenerated: (tx) => get().ingestTransaction(tx)
        }
      );
    }
    simulatorInstance.setSpeed(get().simulationSpeed);
    simulatorInstance.start();
    set({ isSimulating: true });
  },

  stopSimulation: () => {
    if (simulatorInstance) {
      simulatorInstance.stop();
    }
    set({ isSimulating: false });
  },

  setSimulationSpeed: (speed: number) => {
    if (simulatorInstance) {
      simulatorInstance.setSpeed(speed);
    }
    set({ simulationSpeed: speed });
  },

  triggerForcedScenario: (scenario: ForceScenario, targetAccountId?: string) => {
    if (!simulatorInstance) {
      simulatorInstance = new TransactionSimulator(
        () => get().accounts,
        () => get().transactions,
        {
          speedMultiplier: get().simulationSpeed,
          onTransactionGenerated: (tx) => get().ingestTransaction(tx)
        }
      );
    }

    if (scenario === 'VELOCITY_BURST') {
      simulatorInstance.triggerVelocityBurst(targetAccountId);
    } else {
      simulatorInstance.generateOne(scenario);
    }
  },

  ingestTransaction: (tx: Transaction) => {
    set((state) => {
      const updatedTxs = [tx, ...state.transactions].slice(0, 1000); // keep 1000 max in memory
      let updatedAlerts = [...state.alerts];
      let updatedAudit = [...state.auditLogs];
      const newAlertIds: string[] = [];

      // Update account metrics
      const updatedAccounts = state.accounts.map(acc => {
        if (acc.id === tx.accountId) {
          const newAlertCount = acc.totalAlertsCount + (tx.flagged ? 1 : 0);
          const newRisk = Math.max(acc.riskScore, Math.round(tx.riskScore * 0.9));
          return {
            ...acc,
            balance: Math.max(0, parseFloat((acc.balance - tx.amount).toFixed(2))),
            riskScore: newRisk,
            totalAlertsCount: newAlertCount,
            lastKnownLocation: tx.location,
            status: tx.riskLevel === 'CRITICAL' && acc.status === 'ACTIVE' ? 'FLAGGED' : acc.status
          };
        }
        if (acc.id === tx.recipientId && tx.amount) {
          return {
            ...acc,
            balance: parseFloat((acc.balance + tx.amount).toFixed(2))
          };
        }
        return acc;
      });

      // Pipeline: Auto-create Alert if transaction is flagged or riskScore >= 60 and not already exists
      if ((tx.flagged || tx.riskScore >= 60) && !updatedAlerts.some(a => a.transactionId === tx.id)) {
        const alertId = `ALT-${7000 + Math.floor(Math.random() * 8999)}`;
        newAlertIds.push(alertId);

        const newAlert: Alert = {
          id: alertId,
          transactionId: tx.id,
          transaction: tx,
          accountId: tx.accountId,
          accountName: tx.accountName,
          riskScore: tx.riskScore,
          riskLevel: tx.riskLevel,
          status: 'OPEN',
          assignedAnalyst: 'Unassigned (Auto-Triage)',
          createdAt: tx.timestamp,
          updatedAt: tx.timestamp,
          triggeredRules: tx.triggeredRules,
          notes: [
            {
              id: `NOTE-${Date.now()}`,
              author: 'Sentinel Real-Time Engine',
              timestamp: tx.timestamp,
              content: `Automated alert created for ${tx.riskLevel} risk transaction ($${tx.amount.toLocaleString()}). Rules: ${tx.triggeredRules.map(r => r.ruleName).join(', ')}.`
            }
          ]
        };

        updatedAlerts = [newAlert, ...updatedAlerts];

        // Add audit log
        updatedAudit = [
          {
            id: `AUD-${Date.now()}`,
            timestamp: tx.timestamp,
            actor: 'Engine Pipeline',
            action: 'ALERT_GENERATED',
            targetId: alertId,
            details: `Alert ${alertId} created for TX ${tx.id} (${tx.accountName}) with risk score ${tx.riskScore}/100.`
          },
          ...updatedAudit
        ];
      }

      // Audio notification if enabled and alert created
      if (newAlertIds.length > 0 && state.audioEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.16);
        } catch (_) {}
      }

      // Persist to local storage asynchronously
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          accounts: updatedAccounts,
          transactions: updatedTxs.slice(0, 500),
          alerts: updatedAlerts.slice(0, 100),
          investigations: state.investigations,
          auditLogs: updatedAudit.slice(0, 150)
        }));
      } catch (_) {}

      return {
        transactions: updatedTxs,
        accounts: updatedAccounts,
        alerts: updatedAlerts,
        auditLogs: updatedAudit,
        recentNewTxIds: [tx.id, ...state.recentNewTxIds.slice(0, 5)],
        recentNewAlertIds: [...newAlertIds, ...state.recentNewAlertIds.slice(0, 5)]
      };
    });
  },

  updateAlertStatus: (alertId: string, status: AlertStatus, resolutionSummary?: string) => {
    // Optionally fire API update in background
    if (get().isApiConnected) {
      api.updateAlert(alertId, { status, resolutionSummary }).catch(() => {});
    }

    set((state) => {
      const updatedAlerts = state.alerts.map(a => {
        if (a.id === alertId) {
          return {
            ...a,
            status,
            resolutionSummary: resolutionSummary || a.resolutionSummary,
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });

      const updatedAudit = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Security Analyst',
          action: 'ALERT_STATUS_UPDATE',
          targetId: alertId,
          details: `Status transitioned to ${status}${resolutionSummary ? ` (${resolutionSummary})` : ''}.`
        },
        ...state.auditLogs
      ];

      return { alerts: updatedAlerts, auditLogs: updatedAudit };
    });
  },

  assignAlertAnalyst: (alertId: string, analystName: string) => {
    if (get().isApiConnected) {
      api.updateAlert(alertId, { assignedAnalyst: analystName }).catch(() => {});
    }

    set((state) => {
      const updatedAlerts = state.alerts.map(a => 
        a.id === alertId ? { ...a, assignedAnalyst: analystName, updatedAt: new Date().toISOString() } : a
      );
      return { alerts: updatedAlerts };
    });
  },

  addAlertNote: (alertId: string, author: string, content: string) => {
    if (get().isApiConnected) {
      api.updateAlert(alertId, { note: content, author }).catch(() => {});
    }

    set((state) => {
      const newNote: AlertNote = {
        id: `NOTE-${Date.now()}`,
        author,
        timestamp: new Date().toISOString(),
        content
      };

      const updatedAlerts = state.alerts.map(a => {
        if (a.id === alertId) {
          return {
            ...a,
            notes: [...a.notes, newNote],
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });

      return { alerts: updatedAlerts };
    });
  },

  bulkUpdateAlerts: (alertIds: string[], status: AlertStatus) => {
    set((state) => {
      const updatedAlerts = state.alerts.map(a => 
        alertIds.includes(a.id) ? { ...a, status, updatedAt: new Date().toISOString() } : a
      );

      const updatedAudit = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Security Analyst',
          action: 'BULK_ALERT_TRIAGE',
          targetId: `${alertIds.length} Alerts`,
          details: `Bulk updated ${alertIds.length} alerts to status ${status}.`
        },
        ...state.auditLogs
      ];

      return { alerts: updatedAlerts, auditLogs: updatedAudit };
    });
  },

  updateAccountStatus: (accountId: string, status: Account['status'], reason?: string) => {
    set((state) => {
      const target = state.accounts.find(a => a.id === accountId);
      const updatedAccounts = state.accounts.map(a => 
        a.id === accountId ? { ...a, status } : a
      );

      const updatedAudit = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Security Analyst',
          action: `ACCOUNT_${status}`,
          targetId: accountId,
          details: `Account ${target?.ownerName || accountId} status changed to ${status}. ${reason || ''}`
        },
        ...state.auditLogs
      ];

      return { accounts: updatedAccounts, auditLogs: updatedAudit };
    });
  },

  addAccountRiskFactor: (accountId: string, factor: string) => {
    set((state) => {
      const updatedAccounts = state.accounts.map(a => {
        if (a.id === accountId && !a.riskFactors.includes(factor)) {
          return { ...a, riskFactors: [...a.riskFactors, factor] };
        }
        return a;
      });
      return { accounts: updatedAccounts };
    });
  },

  createInvestigation: (title: string, targetAccountId: string, relatedAlertIds = [], relatedTxIds = []) => {
    const state = get();
    const targetAccount = state.accounts.find(a => a.id === targetAccountId);
    const id = `INV-2026-${(100 + state.investigations.length + 1).toString()}`;
    const totalAtRisk = state.transactions
      .filter(t => relatedTxIds.includes(t.id) || t.accountId === targetAccountId)
      .reduce((sum, t) => sum + t.amount, 0);

    const newInv: Investigation = {
      id,
      title: title || `Dossier: ${targetAccount?.ownerName || targetAccountId}`,
      targetAccountId,
      targetAccountName: targetAccount?.ownerName || 'Unknown Account',
      relatedAlertIds,
      relatedTransactionIds: relatedTxIds,
      leadAnalyst: 'Analyst Sarah (SecOps)',
      status: 'INVESTIGATING',
      severity: 'HIGH',
      totalAtRiskAmount: parseFloat(totalAtRisk.toFixed(2)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      findings: `Investigation initiated on account ${targetAccount?.ownerName}. Analyzing cluster connections and risk velocity.`,
      evidenceChecklist: [
        { id: 'ev-1', label: 'Verify sender identity and KYC validation documents', checked: false },
        { id: 'ev-2', label: 'Trace outbound crypto or wire transfer routing hops', checked: false },
        { id: 'ev-3', label: 'Correlate device IDs against shared syndicate registry', checked: false },
        { id: 'ev-4', label: 'Assess regulatory CTR/SAR filing requirement', checked: false }
      ]
    };

    set({
      investigations: [newInv, ...state.investigations],
      selectedInvestigationId: newInv.id,
      activeTab: 'investigations',
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Security Analyst',
          action: 'INVESTIGATION_OPENED',
          targetId: newInv.id,
          details: `Opened investigation ${newInv.id} for account ${targetAccount?.ownerName}.`
        },
        ...state.auditLogs
      ]
    });

    return newInv;
  },

  updateInvestigationStatus: (id: string, status: Investigation['status']) => {
    set((state) => {
      const updated = state.investigations.map(inv => 
        inv.id === id ? { ...inv, status, updatedAt: new Date().toISOString() } : inv
      );
      return { investigations: updated };
    });
  },

  toggleEvidenceCheck: (invId: string, evidenceId: string) => {
    set((state) => {
      const updated = state.investigations.map(inv => {
        if (inv.id === invId) {
          const checklist = inv.evidenceChecklist.map(item => 
            item.id === evidenceId ? { ...item, checked: !item.checked } : item
          );
          return { ...inv, evidenceChecklist: checklist, updatedAt: new Date().toISOString() };
        }
        return inv;
      });
      return { investigations: updated };
    });
  },

  updateInvestigationFindings: (invId: string, findings: string) => {
    set((state) => {
      const updated = state.investigations.map(inv => 
        inv.id === invId ? { ...inv, findings, updatedAt: new Date().toISOString() } : inv
      );
      return { investigations: updated };
    });
  },

  generateSAR: (invId: string, report: SuspiciousActivityReport) => {
    set((state) => {
      const updated = state.investigations.map(inv => 
        inv.id === invId ? { ...inv, sarReport: report, status: 'SAR_FILED' as const, updatedAt: new Date().toISOString() } : inv
      );

      const updatedAudit = [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: report.analystSignoff || 'Lead Analyst',
          action: 'SAR_FILED',
          targetId: report.reportId,
          details: `Suspicious Activity Report ${report.reportId} officially filed for ${report.subjectName}. Total suspicious value: $${report.totalSuspiciousAmount.toLocaleString()}.`
        },
        ...state.auditLogs
      ];

      return { investigations: updated, auditLogs: updatedAudit };
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedAlertId: (id) => set({ selectedAlertId: id }),
  setSelectedTxId: (id) => set({ selectedTxId: id }),
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setSelectedInvestigationId: (id) => set({ selectedInvestigationId: id }),
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

  resetToDefaultSeeds: () => {
    localStorage.removeItem(STORAGE_KEY);
    const accounts = rawAccounts as Account[];
    const transactions = rawTransactions as Transaction[];
    const alerts = generateInitialAlerts(transactions);
    const investigations = generateInitialInvestigations(accounts, alerts, transactions);
    const auditLogs = generateInitialAuditLogs();

    set({
      accounts,
      transactions,
      alerts,
      investigations,
      auditLogs,
      selectedAlertId: null,
      selectedTxId: null,
      selectedAccountId: null,
      selectedInvestigationId: null
    });
  },

  getMetrics: () => {
    const state = get();
    const txs = state.transactions;
    const flagged = txs.filter(t => t.flagged || t.riskScore >= 60);
    const blocked = txs.filter(t => t.status === 'BLOCKED');
    const totalVol = txs.reduce((sum, t) => sum + t.amount, 0);
    const atRiskVol = flagged.reduce((sum, t) => sum + t.amount, 0);
    const openAlerts = state.alerts.filter(a => a.status === 'OPEN' || a.status === 'IN_REVIEW');
    const critAlerts = state.alerts.filter(a => a.riskLevel === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE');

    return {
      tps: state.isSimulating ? parseFloat((0.8 * state.simulationSpeed + Math.random() * 0.4).toFixed(1)) : 0,
      totalProcessedCount: txs.length,
      flaggedCount: flagged.length,
      blockedCount: blocked.length,
      fraudRate: txs.length > 0 ? parseFloat(((flagged.length / txs.length) * 100).toFixed(2)) : 0,
      totalVolume: parseFloat(totalVol.toFixed(2)),
      totalAtRiskVolume: parseFloat(atRiskVol.toFixed(2)),
      openAlertsCount: openAlerts.length,
      criticalAlertsCount: critAlerts.length
    };
  }
}));
