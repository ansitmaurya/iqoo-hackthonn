import type { Account, GeoLocation, MerchantCategory, Transaction, TransactionType } from '../types';
import { evaluateTransactionRisk } from './riskEngine';

const CITIES: GeoLocation[] = [
  { city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060, ipAddress: '198.51.100.42' },
  { city: 'San Francisco', country: 'US', latitude: 37.7749, longitude: -122.4194, ipAddress: '192.0.2.88' },
  { city: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278, ipAddress: '203.0.113.19' },
  { city: 'Singapore', country: 'SG', latitude: 1.3521, longitude: 103.8198, ipAddress: '198.18.0.51' },
  { city: 'Frankfurt', country: 'DE', latitude: 50.1109, longitude: 8.6821, ipAddress: '198.19.0.73' },
  { city: 'Tokyo', country: 'JP', latitude: 35.6762, longitude: 139.6503, ipAddress: '192.88.99.10' },
  { city: 'Sydney', country: 'AU', latitude: -33.8688, longitude: 151.2093, ipAddress: '100.64.0.95' },
  { city: 'Dubai', country: 'AE', latitude: 25.2048, longitude: 55.2708, ipAddress: '172.16.1.14' },
  { city: 'Sao Paulo', country: 'BR', latitude: -23.5505, longitude: -46.6333, ipAddress: '10.0.1.201' },
  { city: 'Toronto', country: 'CA', latitude: 43.6532, longitude: -79.3832, ipAddress: '198.51.101.8' }
];

const CATEGORIES: MerchantCategory[] = [
  'CRYPTO_EXCHANGE', 'WIRE_REMITTANCE', 'ONLINE_CASINO', 'LUXURY_GOODS',
  'ELECTRONICS', 'GROCERIES', 'TRAVEL_AIRLINE', 'PEER_TRANSFER', 'UTILITIES', 'PHARMACY'
];

const BROWSERS = ['Chrome 125', 'Safari 17.5', 'Firefox 126', 'Edge 124', 'Tor Browser / Masked'];
const OS_LIST = ['macOS Sonoma', 'Windows 11', 'iOS 17.5', 'Android 14', 'Linux Ubuntu'];

export type ForceScenario = 
  | 'AUTO' 
  | 'GEO_VELOCITY' 
  | 'STRUCTURING' 
  | 'AMOUNT_ZSCORE' 
  | 'NEW_DEVICE' 
  | 'VELOCITY_BURST' 
  | 'OFF_HOURS';

export interface SimulatorOptions {
  intervalMinMs?: number;
  intervalMaxMs?: number;
  speedMultiplier?: number; // 1x, 2x, 5x
  onTransactionGenerated: (tx: Transaction) => void;
}

export class TransactionSimulator {
  private timerId: any = null;
  private isRunning: boolean = false;
  private speedMultiplier: number = 1;
  private onTxCallback: (tx: Transaction) => void;
  private accountsProvider: () => Account[];
  private recentTxProvider: () => Transaction[];

  constructor(
    accountsProvider: () => Account[],
    recentTxProvider: () => Transaction[],
    options: SimulatorOptions
  ) {
    this.accountsProvider = accountsProvider;
    this.recentTxProvider = recentTxProvider;
    this.onTxCallback = options.onTransactionGenerated;
    this.speedMultiplier = options.speedMultiplier || 1;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNext();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = Math.max(0.5, multiplier);
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  private scheduleNext() {
    if (!this.isRunning) return;

    // Normal random cadence: 2000ms - 4500ms divided by speedMultiplier
    const baseDelay = Math.floor(Math.random() * 2500) + 2000;
    const delay = Math.max(400, Math.floor(baseDelay / this.speedMultiplier));

    this.timerId = setTimeout(() => {
      if (!this.isRunning) return;
      this.generateOne('AUTO');
      this.scheduleNext();
    }, delay);
  }

  /**
   * Generates a single transaction, optionally forcing a specific fraud anomaly.
   */
  public generateOne(scenario: ForceScenario = 'AUTO'): Transaction | null {
    const accounts = this.accountsProvider();
    if (!accounts || accounts.length === 0) return null;

    const recentTx = this.recentTxProvider();
    const sender = accounts[Math.floor(Math.random() * accounts.length)];
    let recipient = accounts[Math.floor(Math.random() * accounts.length)];
    while (recipient.id === sender.id && accounts.length > 1) {
      recipient = accounts[Math.floor(Math.random() * accounts.length)];
    }

    const txId = `TX-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
    const nowIso = new Date().toISOString();

    let category: MerchantCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    let type: TransactionType = 'PURCHASE';
    let loc: GeoLocation = {
      ...sender.lastKnownLocation,
      ipAddress: `${sender.lastKnownLocation.ipAddress.split('.').slice(0, 3).join('.')}.${Math.floor(Math.random() * 250 + 2)}`
    };
    let device = {
      deviceId: sender.knownDevices[0] || `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      browser: BROWSERS[0],
      os: OS_LIST[0],
      isKnownDevice: true,
      userAgent: 'Mozilla/5.0 SyntheticSentinelEngine/2.0'
    };

    let amount = parseFloat((Math.random() * (sender.historicalAvgAmount * 1.5 - 12) + 12).toFixed(2));

    // Determine actual scenario (either forced or natural 15% anomaly chance)
    let appliedScenario = scenario;
    if (appliedScenario === 'AUTO') {
      const roll = Math.random();
      if (roll < 0.05) appliedScenario = 'GEO_VELOCITY';
      else if (roll < 0.09) appliedScenario = 'STRUCTURING';
      else if (roll < 0.13) appliedScenario = 'AMOUNT_ZSCORE';
      else if (roll < 0.17) appliedScenario = 'NEW_DEVICE';
      else if (roll < 0.20) appliedScenario = 'OFF_HOURS';
    }

    // Apply scenario parameters
    switch (appliedScenario) {
      case 'GEO_VELOCITY': {
        const otherCity = CITIES.find(c => c.city !== sender.lastKnownLocation.city) || CITIES[3];
        loc = {
          city: otherCity.city,
          country: otherCity.country,
          latitude: otherCity.latitude,
          longitude: otherCity.longitude,
          ipAddress: `${otherCity.ipAddress.split('.').slice(0, 3).join('.')}.${Math.floor(Math.random() * 250 + 2)}`
        };
        type = 'TRANSFER';
        break;
      }
      case 'STRUCTURING': {
        amount = parseFloat((9500 + Math.random() * 480).toFixed(2)); // $9,500 - $9,980
        type = 'WIRE_OUT';
        category = 'WIRE_REMITTANCE';
        break;
      }
      case 'AMOUNT_ZSCORE': {
        const multiplier = 5.5 + Math.random() * 4.0;
        amount = parseFloat((sender.historicalAvgAmount * multiplier).toFixed(2));
        type = 'TRANSFER';
        category = 'LUXURY_GOODS';
        break;
      }
      case 'NEW_DEVICE': {
        amount = parseFloat((3500 + Math.random() * 5000).toFixed(2));
        device = {
          deviceId: `DEV-UNKNOWN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          browser: 'Tor Browser / Masked',
          os: 'Linux Ubuntu',
          isKnownDevice: false,
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'
        };
        type = 'CRYPTO_DEPOSIT';
        category = 'CRYPTO_EXCHANGE';
        break;
      }
      case 'OFF_HOURS': {
        amount = parseFloat((1200 + Math.random() * 3000).toFixed(2));
        category = 'ONLINE_CASINO';
        type = 'TRANSFER';
        break;
      }
      case 'VELOCITY_BURST': {
        amount = parseFloat((250 + Math.random() * 800).toFixed(2));
        type = 'P2P_PAYMENT';
        category = 'PEER_TRANSFER';
        break;
      }
      default:
        break;
    }

    // Evaluate risk deterministically through engine
    const accountRecentTx = recentTx.filter(t => t.accountId === sender.id);
    const candidateTx: Partial<Transaction> = {
      id: txId,
      accountId: sender.id,
      accountName: sender.ownerName,
      recipientId: recipient.id,
      recipientName: recipient.ownerName,
      amount,
      currency: 'USD',
      type,
      category,
      timestamp: nowIso,
      location: loc,
      device
    };

    const evaluation = evaluateTransactionRisk(candidateTx, sender, accountRecentTx);

    const fullTx: Transaction = {
      id: txId,
      accountId: sender.id,
      accountName: sender.ownerName,
      recipientId: recipient.id,
      recipientName: recipient.ownerName,
      amount,
      currency: 'USD',
      type,
      category,
      timestamp: nowIso,
      location: loc,
      device,
      riskScore: evaluation.score,
      riskLevel: evaluation.level,
      triggeredRules: evaluation.triggeredRules,
      flagged: evaluation.score >= 60,
      status: evaluation.decision === 'BLOCK' ? 'BLOCKED' : (evaluation.score >= 60 ? 'FLAGGED' : 'SETTLED'),
      metadata: {
        syntheticNote: 'Real-time Synthetic Stream Event',
        decision: evaluation.decision
      }
    };

    this.onTxCallback(fullTx);
    return fullTx;
  }

  /**
   * Helper to trigger a high velocity burst demo scenario (4 rapid transactions).
   */
  public triggerVelocityBurst(targetAccountId?: string) {
    const accounts = this.accountsProvider();
    const targetAcc = targetAccountId 
      ? accounts.find(a => a.id === targetAccountId) || accounts[0]
      : accounts[0];

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const txId = `TX-BURST-${Date.now().toString().slice(-5)}${i}`;
        const candidate: Partial<Transaction> = {
          id: txId,
          accountId: targetAcc.id,
          accountName: targetAcc.ownerName,
          amount: parseFloat((450 + i * 150).toFixed(2)),
          currency: 'USD',
          type: 'P2P_PAYMENT',
          category: 'PEER_TRANSFER',
          timestamp: new Date().toISOString(),
          location: targetAcc.lastKnownLocation,
          device: {
            deviceId: targetAcc.knownDevices[0],
            browser: 'Chrome 125',
            os: 'Windows 11',
            isKnownDevice: true,
            userAgent: 'Mozilla/5.0 SyntheticSentinelEngine/2.0'
          }
        };

        const recent = this.recentTxProvider().filter(t => t.accountId === targetAcc.id);
        const evalResult = evaluateTransactionRisk(candidate, targetAcc, recent);

        const tx: Transaction = {
          ...candidate as any,
          riskScore: evalResult.score,
          riskLevel: evalResult.level,
          triggeredRules: evalResult.triggeredRules,
          flagged: evalResult.score >= 60,
          status: evalResult.decision === 'BLOCK' ? 'BLOCKED' : (evalResult.score >= 60 ? 'FLAGGED' : 'SETTLED')
        };
        this.onTxCallback(tx);
      }, i * 300);
    }
  }
}
