// Core Domain Types for Sentinel Flow Synthetic Fraud Detection System

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';

export type AccountStatus = 'ACTIVE' | 'FLAGGED' | 'FROZEN' | 'SUSPENDED';

export type AccountType = 'CONSUMER' | 'MERCHANT' | 'BUSINESS' | 'HIGH_NET_WORTH' | 'MULE_SUSPECT';

export type TransactionType = 'TRANSFER' | 'PURCHASE' | 'ATM_WITHDRAWAL' | 'CRYPTO_DEPOSIT' | 'WIRE_OUT' | 'P2P_PAYMENT';

export type MerchantCategory = 
  | 'CRYPTO_EXCHANGE' 
  | 'WIRE_REMITTANCE' 
  | 'ONLINE_CASINO' 
  | 'LUXURY_GOODS' 
  | 'ELECTRONICS' 
  | 'GROCERIES' 
  | 'TRAVEL_AIRLINE' 
  | 'PEER_TRANSFER' 
  | 'UTILITIES'
  | 'PHARMACY';

export interface GeoLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  ipAddress: string;
}

export interface DeviceInfo {
  deviceId: string;
  browser: string;
  os: string;
  isKnownDevice: boolean;
  userAgent: string;
}

export interface Account {
  id: string; // e.g., ACC-84920
  accountNumber: string;
  ownerName: string;
  ownerEmail: string;
  type: AccountType;
  status: AccountStatus;
  balance: number;
  currency: string;
  createdAt: string;
  riskScore: number; // 0 - 100
  historicalAvgAmount: number;
  historicalStdDevAmount: number;
  lastKnownLocation: GeoLocation;
  knownDevices: string[];
  tags: string[];
  totalAlertsCount: number;
  riskFactors: string[];
}

export interface RuleTrigger {
  ruleId: string;
  ruleName: string;
  scoreContribution: number;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  description: string;
  evidence: Record<string, any>;
}

export interface RiskEvaluationResult {
  score: number; // 0 - 100
  level: RiskLevel;
  triggeredRules: RuleTrigger[];
  evaluationTimestamp: string;
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
}

export interface Transaction {
  id: string; // e.g., TX-902148
  accountId: string;
  accountName: string;
  recipientId?: string;
  recipientName?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  category: MerchantCategory;
  timestamp: string; // ISO 8601
  location: GeoLocation;
  device: DeviceInfo;
  riskScore: number; // calculated deterministic score
  riskLevel: RiskLevel;
  triggeredRules: RuleTrigger[];
  flagged: boolean;
  status: 'SETTLED' | 'PENDING' | 'BLOCKED' | 'FLAGGED';
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string; // e.g., ALT-5012
  transactionId: string;
  transaction: Transaction;
  accountId: string;
  accountName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: AlertStatus;
  assignedAnalyst?: string;
  createdAt: string;
  updatedAt: string;
  triggeredRules: RuleTrigger[];
  notes: AlertNote[];
  resolutionSummary?: string;
}

export interface AlertNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface Investigation {
  id: string; // e.g., INV-2024-009
  title: string;
  targetAccountId: string;
  targetAccountName: string;
  relatedAlertIds: string[];
  relatedTransactionIds: string[];
  leadAnalyst: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED_LEGAL' | 'SAR_FILED' | 'CLOSED';
  severity: RiskLevel;
  totalAtRiskAmount: number;
  createdAt: string;
  updatedAt: string;
  findings: string;
  evidenceChecklist: {
    id: string;
    label: string;
    checked: boolean;
  }[];
  sarReport?: SuspiciousActivityReport;
}

export interface SuspiciousActivityReport {
  reportId: string;
  generatedAt: string;
  filingInstitution: string;
  subjectName: string;
  subjectAccountId: string;
  totalSuspiciousAmount: number;
  summaryNarrative: string;
  violatedRules: string[];
  recommendedAction: string;
  analystSignoff: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string; // e.g. "Analyst Sarah (SecOps)" or "System Engine"
  action: string; // e.g., "ALERT_STATUS_UPDATE", "RULE_TRIGGERED", "ACCOUNT_FROZEN"
  targetId: string; // Alert ID, Account ID, or TX ID
  details: string;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  tps: number;
  totalProcessedCount: number;
  flaggedCount: number;
  blockedCount: number;
  fraudRate: number; // percentage
  totalVolume: number;
  totalAtRiskVolume: number;
  openAlertsCount: number;
  criticalAlertsCount: number;
}
