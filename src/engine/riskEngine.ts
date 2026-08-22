import type { Account, GeoLocation, RiskEvaluationResult, RiskLevel, RuleTrigger, Transaction } from '../types';

/**
 * Calculates Great-Circle distance in kilometers between two geo-coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(loc1: GeoLocation, loc2: GeoLocation): number {
  if (!loc1 || !loc2) return 0;
  if (loc1.latitude === loc2.latitude && loc1.longitude === loc2.longitude) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const lat1 = (loc1.latitude * Math.PI) / 180;
  const lat2 = (loc2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  baseWeight: number;
  evaluate: (
    tx: Partial<Transaction>,
    account?: Account,
    recentAccountTransactions?: Transaction[]
  ) => RuleTrigger | null;
}

export const SENTINEL_RULES: RuleDefinition[] = [
  // 1. HIGH VELOCITY BURST RULE
  {
    id: 'RULE-VELOCITY-01',
    name: 'Rapid Transaction Burst (Velocity)',
    description: 'Triggers when more than 3 transactions occur within a 2-minute window.',
    baseWeight: 40,
    evaluate: (tx, _, recentTx = []) => {
      if (!tx.timestamp || recentTx.length === 0) return null;
      const txTime = new Date(tx.timestamp).getTime();
      const twoMinutesMs = 2 * 60 * 1000;

      const recentInWindow = recentTx.filter(t => {
        const diff = Math.abs(txTime - new Date(t.timestamp).getTime());
        return diff <= twoMinutesMs && t.id !== tx.id;
      });

      if (recentInWindow.length >= 3) {
        return {
          ruleId: 'RULE-VELOCITY-01',
          ruleName: 'Rapid Transaction Burst (Velocity)',
          scoreContribution: 40,
          severity: 'CRITICAL',
          description: `Detected ${recentInWindow.length + 1} transactions within a 2-minute window. Potential automated bot activity.`,
          evidence: {
            windowMinutes: 2,
            transactionCount: recentInWindow.length + 1,
            recentTxIds: recentInWindow.map(t => t.id)
          }
        };
      }
      return null;
    }
  },

  // 2. GEO-VELOCITY / IMPOSSIBLE TRAVEL RULE
  {
    id: 'RULE-GEO-VELOCITY-02',
    name: 'Impossible Travel (Geo-Velocity)',
    description: 'Triggers when physical travel speed between consecutive transactions exceeds 800 km/h.',
    baseWeight: 50,
    evaluate: (tx, account, recentTx = []) => {
      if (!tx.location || !tx.timestamp) return null;

      // Find the most recent previous transaction for this account or fallback to account's last known location
      const prevTx = recentTx[0];
      const prevLoc = prevTx ? prevTx.location : account?.lastKnownLocation;
      const prevTime = prevTx ? new Date(prevTx.timestamp).getTime() : (account ? new Date(account.createdAt).getTime() : 0);
      const currTime = new Date(tx.timestamp).getTime();

      if (!prevLoc || prevTime === 0) return null;

      const distanceKm = calculateHaversineDistanceKm(prevLoc, tx.location);
      const timeDiffHours = Math.abs(currTime - prevTime) / (1000 * 60 * 60);

      // Avoid divide by zero
      const effectiveHours = Math.max(timeDiffHours, 0.0167); // minimum 1 minute
      const speedKmh = Math.round(distanceKm / effectiveHours);

      // If distance is significant (>200 km) and speed exceeds commercial jet speed (800 km/h)
      if (distanceKm > 200 && speedKmh > 800) {
        return {
          ruleId: 'RULE-GEO-VELOCITY-02',
          ruleName: 'Impossible Travel (Geo-Velocity)',
          scoreContribution: 50,
          severity: 'CRITICAL',
          description: `Location jump from ${prevLoc.city}, ${prevLoc.country} to ${tx.location.city}, ${tx.location.country} (${distanceKm} km) in ${timeDiffHours.toFixed(1)}h indicates physical impossibility (${speedKmh} km/h).`,
          evidence: {
            originCity: prevLoc.city,
            destCity: tx.location.city,
            distanceKm,
            timeDiffMinutes: Math.round(timeDiffHours * 60),
            impliedSpeedKmh: speedKmh
          }
        };
      }
      return null;
    }
  },

  // 3. AMOUNT Z-SCORE ANOMALY RULE
  {
    id: 'RULE-ZSCORE-03',
    name: 'Amount Deviation Anomaly (Z-Score)',
    description: 'Triggers when transaction amount exceeds 3.0 standard deviations from user baseline.',
    baseWeight: 35,
    evaluate: (tx, account) => {
      if (!tx.amount || !account) return null;
      const avg = account.historicalAvgAmount || 300;
      const stdDev = account.historicalStdDevAmount || Math.max(avg * 0.4, 50);

      const zScore = (tx.amount - avg) / stdDev;

      if (zScore >= 3.0 && tx.amount > 1500) {
        const contribution = Math.min(45, Math.round(25 + zScore * 4));
        return {
          ruleId: 'RULE-ZSCORE-03',
          ruleName: 'Amount Deviation Anomaly (Z-Score)',
          scoreContribution: contribution,
          severity: zScore > 5 ? 'CRITICAL' : 'WARNING',
          description: `Transaction amount ($${tx.amount.toLocaleString()}) deviates by +${zScore.toFixed(1)}σ from account baseline (Avg: $${avg.toLocaleString()}).`,
          evidence: {
            amount: tx.amount,
            historicalMean: avg,
            standardDeviation: stdDev,
            zScore: parseFloat(zScore.toFixed(2))
          }
        };
      }
      return null;
    }
  },

  // 4. STRUCTURING / SMURFING RULE
  {
    id: 'RULE-STRUCTURING-04',
    name: 'Regulatory Threshold Avoidance (Structuring)',
    description: 'Triggers on amounts between $9,000 and $9,999 engineered to evade the $10k mandatory CTR filing.',
    baseWeight: 45,
    evaluate: (tx) => {
      const amount = tx.amount || 0;
      if (amount >= 9000 && amount < 10000) {
        return {
          ruleId: 'RULE-STRUCTURING-04',
          ruleName: 'Regulatory Threshold Avoidance (Structuring)',
          scoreContribution: 45,
          severity: 'CRITICAL',
          description: `Amount $${amount.toLocaleString()} is intentionally close to but below the $10,000 Bank Secrecy Act CTR threshold.`,
          evidence: {
            amount,
            threshold: 10000,
            deltaToThreshold: 10000 - amount
          }
        };
      }
      return null;
    }
  },

  // 5. UNRECOGNIZED DEVICE + HIGH VALUE RULE
  {
    id: 'RULE-NEW-DEVICE-05',
    name: 'Unrecognized Device + High Value',
    description: 'Triggers when a transaction exceeding $2,500 originates from an unseen device footprint.',
    baseWeight: 35,
    evaluate: (tx, account) => {
      const amount = tx.amount || 0;
      const device = tx.device;
      if (!device || amount < 2500) return null;

      const isKnown = device.isKnownDevice || (account?.knownDevices && account.knownDevices.includes(device.deviceId));

      if (!isKnown) {
        return {
          ruleId: 'RULE-NEW-DEVICE-05',
          ruleName: 'Unrecognized Device + High Value',
          scoreContribution: 35,
          severity: 'WARNING',
          description: `Transaction of $${amount.toLocaleString()} initiated from unrecognized device fingerprint (${device.deviceId || 'Unknown'}).`,
          evidence: {
            deviceId: device.deviceId,
            browser: device.browser,
            os: device.os,
            amount
          }
        };
      }
      return null;
    }
  },

  // 6. OFF-HOURS HIGH-RISK MERCHANT CATEGORY RULE
  {
    id: 'RULE-OFF-HOURS-06',
    name: 'Off-Hours High-Risk Activity',
    description: 'Triggers on nocturnal transactions (0:00 - 4:30 AM) in high-risk categories (Crypto, Casino, Wire).',
    baseWeight: 30,
    evaluate: (tx) => {
      if (!tx.timestamp || !tx.category) return null;
      const hour = new Date(tx.timestamp).getHours();
      const isOffHour = hour >= 0 && hour <= 4;
      const isHighRiskCategory =
        tx.category === 'CRYPTO_EXCHANGE' ||
        tx.category === 'ONLINE_CASINO' ||
        tx.category === 'WIRE_REMITTANCE';

      if (isOffHour && isHighRiskCategory && (tx.amount || 0) > 800) {
        return {
          ruleId: 'RULE-OFF-HOURS-06',
          ruleName: 'Off-Hours High-Risk Activity',
          scoreContribution: 30,
          severity: 'WARNING',
          description: `High-value (${(tx.amount || 0).toLocaleString()} USD) ${tx.category.replace('_', ' ')} transaction executed during off-hours (${hour}:00 AM local).`,
          evidence: {
            hour,
            category: tx.category,
            amount: tx.amount
          }
        };
      }
      return null;
    }
  },

  // 7. MULE / SYNDICATE WATCHLIST MATCH RULE
  {
    id: 'RULE-MULE-WATCHLIST-07',
    name: 'Sanctioned / Mule Syndicate Association',
    description: 'Triggers when account has flagged status or is marked as mule suspect.',
    baseWeight: 50,
    evaluate: (_, account) => {
      if (account && (account.type === 'MULE_SUSPECT' || account.status === 'FLAGGED' || account.status === 'FROZEN')) {
        return {
          ruleId: 'RULE-MULE-WATCHLIST-07',
          ruleName: 'Sanctioned / Mule Syndicate Association',
          scoreContribution: 50,
          severity: 'CRITICAL',
          description: `Account is flagged in syndicate database (${account.riskFactors.join(', ') || 'High Risk Mule'}).`,
          evidence: {
            accountType: account.type,
            status: account.status,
            riskFactors: account.riskFactors
          }
        };
      }
      return null;
    }
  }
];

/**
 * Deterministic fraud risk evaluation engine.
 */
export function evaluateTransactionRisk(
  tx: Partial<Transaction>,
  account?: Account,
  recentAccountTransactions: Transaction[] = []
): RiskEvaluationResult {
  const triggeredRules: RuleTrigger[] = [];
  let baseScore = 5; // Base organic noise score

  // Evaluate all rules
  for (const rule of SENTINEL_RULES) {
    const trigger = rule.evaluate(tx, account, recentAccountTransactions);
    if (trigger) {
      triggeredRules.push(trigger);
      baseScore += trigger.scoreContribution;
    }
  }

  // Cap score between 0 and 99
  const score = Math.min(99, Math.max(5, baseScore));

  let level: RiskLevel = 'LOW';
  let decision: 'ALLOW' | 'REVIEW' | 'BLOCK' = 'ALLOW';

  if (score >= 80) {
    level = 'CRITICAL';
    decision = 'BLOCK';
  } else if (score >= 60) {
    level = 'HIGH';
    decision = 'REVIEW';
  } else if (score >= 35) {
    level = 'MEDIUM';
    decision = 'REVIEW';
  } else {
    level = 'LOW';
    decision = 'ALLOW';
  }

  return {
    score,
    level,
    triggeredRules,
    evaluationTimestamp: new Date().toISOString(),
    decision
  };
}
