// Synthetic Data Generator for Sentinel Flow Seed Files
const fs = require('fs');
const path = require('path');

const CITIES = [
  { city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060, ipPrefix: '198.51.100' },
  { city: 'San Francisco', country: 'US', latitude: 37.7749, longitude: -122.4194, ipPrefix: '192.0.2' },
  { city: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278, ipPrefix: '203.0.113' },
  { city: 'Singapore', country: 'SG', latitude: 1.3521, longitude: 103.8198, ipPrefix: '198.18.0' },
  { city: 'Frankfurt', country: 'DE', latitude: 50.1109, longitude: 8.6821, ipPrefix: '198.19.0' },
  { city: 'Tokyo', country: 'JP', latitude: 35.6762, longitude: 139.6503, ipPrefix: '192.88.99' },
  { city: 'Sydney', country: 'AU', latitude: -33.8688, longitude: 151.2093, ipPrefix: '100.64.0' },
  { city: 'Dubai', country: 'AE', latitude: 25.2048, longitude: 55.2708, ipPrefix: '172.16.1' },
  { city: 'Sao Paulo', country: 'BR', latitude: -23.5505, longitude: -46.6333, ipPrefix: '10.0.1' },
  { city: 'Toronto', country: 'CA', latitude: 43.6532, longitude: -79.3832, ipPrefix: '198.51.101' },
];

const ACCOUNT_NAMES = [
  'Apex Capital Ltd', 'Elena Rostova', 'Marcus Vance', 'Quantum Dynamics LLC',
  'Sophia Chen', 'Liam O\'Connor', 'CyberNexus Global', 'Amina Al-Mansoor',
  'David K. Miller', 'Vortex Imports Inc', 'Carlos Mendez', 'Yuki Takahashi',
  'Nova Horizon LLC', 'Claire Dupont', 'Tariq Sterling', 'Aegis Cloud Corp',
  'Mateo Rossi', 'Freja Lindqvist', 'Hyperion Trade Partners', 'Zubair Khan',
  'Isabella Morales', 'Valeria Petrov', 'Titanium Global Pay', 'Alexander Wright',
  'Mei-Ling Zhou', 'Gabriel Silva', 'Starlight Merchants', 'Olivia Taylor',
  'Lucas Van Der Berg', 'Seraphim Financial Ltd', 'Ethan Hawke', 'Nadia Benali',
  'Klaus Becker', 'Aurelia Solis', 'Mirage Holdings B.V.', 'Hassan Farooq',
  'Ingrid Larson', 'Dmitri Volkov', 'Zenith Logistics LLC', 'Chloe Martin',
  'Vikram Malhotra', 'Siddharth Roy', 'Keiko Tanaka', 'OmniPay Solutions',
  'Arthur Pendelton', 'Fatima Zahra', 'Elias Thorne', 'Nordic Wave AB',
  'Valerie Dubois', 'Orion Ventures Global'
];

const ACCOUNT_TYPES = ['CONSUMER', 'CONSUMER', 'CONSUMER', 'MERCHANT', 'BUSINESS', 'HIGH_NET_WORTH', 'MULE_SUSPECT'];

const CATEGORIES = [
  'CRYPTO_EXCHANGE', 'WIRE_REMITTANCE', 'ONLINE_CASINO', 'LUXURY_GOODS',
  'ELECTRONICS', 'GROCERIES', 'TRAVEL_AIRLINE', 'PEER_TRANSFER', 'UTILITIES', 'PHARMACY'
];

const BROWSERS = ['Chrome 124', 'Safari 17.4', 'Firefox 125', 'Edge 123', 'Tor Browser / Unknown'];
const OS_LIST = ['macOS Sonoma', 'Windows 11', 'iOS 17', 'Android 14', 'Linux Ubuntu'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate Accounts
const accounts = ACCOUNT_NAMES.map((name, idx) => {
  const id = `ACC-${10000 + idx * 137}`;
  const accNum = `SF-****-${(1000 + idx * 47).toString().padStart(4, '0')}`;
  const type = idx === 12 || idx === 19 || idx === 34 ? 'MULE_SUSPECT' : randomChoice(ACCOUNT_TYPES);
  const cityObj = randomChoice(CITIES);
  const baseAvg = type === 'HIGH_NET_WORTH' ? 12500 : type === 'BUSINESS' || type === 'MERCHANT' ? 4500 : 280;
  const isMule = type === 'MULE_SUSPECT';

  return {
    id,
    accountNumber: accNum,
    ownerName: name,
    ownerEmail: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@synthetic-flow.demo`,
    type,
    status: isMule ? 'FLAGGED' : (idx % 15 === 0 ? 'FROZEN' : 'ACTIVE'),
    balance: randomFloat(5000, isMule ? 85000 : 250000),
    currency: 'USD',
    createdAt: new Date(Date.now() - randomInt(60, 400) * 86400000).toISOString(),
    riskScore: isMule ? randomInt(75, 96) : (idx % 7 === 0 ? randomInt(45, 68) : randomInt(5, 30)),
    historicalAvgAmount: baseAvg,
    historicalStdDevAmount: parseFloat((baseAvg * 0.45).toFixed(2)),
    lastKnownLocation: {
      city: cityObj.city,
      country: cityObj.country,
      latitude: cityObj.latitude,
      longitude: cityObj.longitude,
      ipAddress: `${cityObj.ipPrefix}.${randomInt(2, 250)}`
    },
    knownDevices: [
      `DEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      `DEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    ],
    tags: isMule ? ['High Risk Mule', 'Rapid Cash-Out', 'SAR Watchlist'] : (type === 'HIGH_NET_WORTH' ? ['VIP', 'Private Banking'] : ['Standard KYC']),
    totalAlertsCount: isMule ? randomInt(3, 8) : (idx % 6 === 0 ? randomInt(1, 2) : 0),
    riskFactors: isMule ? ['Linked to Smurfing Ring', 'Multiple IP Hopping', 'Off-Hours Transfers'] : []
  };
});

// Generate 520 Historical Transactions
const transactions = [];
const now = Date.now();

// Create realistic distribution across last 14 days
for (let i = 0; i < 520; i++) {
  const txId = `TX-${980000 + i * 19}`;
  const senderAcc = randomChoice(accounts);
  let recipientAcc = randomChoice(accounts);
  while (recipientAcc.id === senderAcc.id) {
    recipientAcc = randomChoice(accounts);
  }

  // Distribution of time: denser in last 48 hours
  const hoursAgo = i < 150 ? randomFloat(0.1, 48) : randomFloat(48, 336);
  const txDate = new Date(now - hoursAgo * 3600 * 1000);
  const hourOfDay = txDate.getHours();

  let category = randomChoice(CATEGORIES);
  let type = randomChoice(['TRANSFER', 'PURCHASE', 'PURCHASE', 'CRYPTO_DEPOSIT', 'WIRE_OUT', 'P2P_PAYMENT']);
  
  // Decide if this transaction is an intentional fraud scenario
  const isImpossibleTravel = i % 23 === 0;
  const isStructuring = i % 31 === 0;
  const isZScoreAnomaly = i % 19 === 0;
  const isNewDeviceHighAmount = i % 29 === 0;
  const isOffHours = (hourOfDay >= 0 && hourOfDay <= 4) && (category === 'CRYPTO_EXCHANGE' || category === 'ONLINE_CASINO' || category === 'WIRE_REMITTANCE');
  const isMuleTx = senderAcc.type === 'MULE_SUSPECT';

  let amount = 0;
  let loc = { ...senderAcc.lastKnownLocation };
  let dev = {
    deviceId: senderAcc.knownDevices[0],
    browser: randomChoice(BROWSERS),
    os: randomChoice(OS_LIST),
    isKnownDevice: true,
    userAgent: 'Mozilla/5.0 SyntheticSentinelEngine/2.0'
  };

  const triggeredRules = [];
  let calculatedScore = randomInt(5, 25);

  if (isStructuring) {
    // $9,600 - $9,950 smurfing structuring
    amount = randomFloat(9600, 9950);
    type = 'WIRE_OUT';
    calculatedScore += 45;
    triggeredRules.push({
      ruleId: 'RULE-STRUCTURING-01',
      ruleName: 'Threshold Avoidance / Structuring',
      scoreContribution: 45,
      severity: 'CRITICAL',
      description: `Transaction amount $${amount.toLocaleString()} is just below the $10,000 regulatory reporting threshold.`,
      evidence: { amount, threshold: 10000, delta: 10000 - amount }
    });
  } else if (isZScoreAnomaly) {
    amount = parseFloat((senderAcc.historicalAvgAmount * randomFloat(5.5, 9.0)).toFixed(2));
    calculatedScore += 40;
    const zScore = parseFloat(((amount - senderAcc.historicalAvgAmount) / senderAcc.historicalStdDevAmount).toFixed(2));
    triggeredRules.push({
      ruleId: 'RULE-ZSCORE-02',
      ruleName: 'Amount Outlier (High Z-Score)',
      scoreContribution: 40,
      severity: 'WARNING',
      description: `Amount $${amount.toLocaleString()} deviates significantly from historical baseline (Z-Score: +${zScore}σ).`,
      evidence: { amount, avg: senderAcc.historicalAvgAmount, zScore }
    });
  } else if (isMuleTx) {
    amount = randomFloat(12000, 38000);
    category = 'CRYPTO_EXCHANGE';
    type = 'CRYPTO_DEPOSIT';
    calculatedScore += 50;
    triggeredRules.push({
      ruleId: 'RULE-MULE-CLUSTER',
      ruleName: 'Mule Suspect Cluster Flow',
      scoreContribution: 50,
      severity: 'CRITICAL',
      description: 'Account identified in high-risk automated cash-out syndicate.',
      evidence: { sender: senderAcc.id, riskFactors: senderAcc.riskFactors }
    });
  } else {
    amount = randomFloat(15, senderAcc.historicalAvgAmount * 1.8);
  }

  if (isImpossibleTravel) {
    // Pick far city
    const otherCity = CITIES.find(c => c.city !== senderAcc.lastKnownLocation.city) || CITIES[5];
    loc = {
      city: otherCity.city,
      country: otherCity.country,
      latitude: otherCity.latitude,
      longitude: otherCity.longitude,
      ipAddress: `${otherCity.ipPrefix}.${randomInt(5, 250)}`
    };
    calculatedScore += 50;
    triggeredRules.push({
      ruleId: 'RULE-GEO-VELOCITY-03',
      ruleName: 'Impossible Travel / Geo-Velocity',
      scoreContribution: 50,
      severity: 'CRITICAL',
      description: `Origin ${loc.city} (${loc.country}) detected within minutes of previous session in ${senderAcc.lastKnownLocation.city} (calculated speed > 1,400 km/h).`,
      evidence: { prevCity: senderAcc.lastKnownLocation.city, currentCity: loc.city, impliedSpeedKmh: 1420 }
    });
  }

  if (isNewDeviceHighAmount && amount > 2500) {
    dev = {
      deviceId: `DEV-NEW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      browser: 'Tor Browser / Unknown',
      os: 'Linux Ubuntu',
      isKnownDevice: false,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'
    };
    calculatedScore += 35;
    triggeredRules.push({
      ruleId: 'RULE-NEW-DEVICE-04',
      ruleName: 'Unrecognized Device + High Value',
      scoreContribution: 35,
      severity: 'WARNING',
      description: `High-value transaction ($${amount.toLocaleString()}) initiated from an unrecognized device footprint.`,
      evidence: { deviceId: dev.deviceId, isKnownDevice: false }
    });
  }

  if (isOffHours) {
    calculatedScore += 25;
    triggeredRules.push({
      ruleId: 'RULE-OFF-HOURS-05',
      ruleName: 'Off-Hours High-Risk Activity',
      scoreContribution: 25,
      severity: 'WARNING',
      description: `Transaction initiated at ${hourOfDay}:00 local time in high-risk category (${category.replace('_', ' ')}).`,
      evidence: { hourOfDay, category }
    });
  }

  const finalScore = Math.min(99, Math.max(5, calculatedScore));
  const riskLevel = finalScore >= 80 ? 'CRITICAL' : finalScore >= 60 ? 'HIGH' : finalScore >= 35 ? 'MEDIUM' : 'LOW';
  const isFlagged = finalScore >= 60;
  const status = finalScore >= 85 ? 'BLOCKED' : isFlagged ? 'FLAGGED' : 'SETTLED';

  transactions.push({
    id: txId,
    accountId: senderAcc.id,
    accountName: senderAcc.ownerName,
    recipientId: recipientAcc.id,
    recipientName: recipientAcc.ownerName,
    amount: parseFloat(amount.toFixed(2)),
    currency: 'USD',
    type,
    category,
    timestamp: txDate.toISOString(),
    location: loc,
    device: dev,
    riskScore: finalScore,
    riskLevel,
    triggeredRules,
    flagged: isFlagged,
    status,
    metadata: {
      syntheticNote: '100% Synthetic Generated Event'
    }
  });
}

// Sort transactions descending by timestamp
transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

const dataDir = path.join(__dirname);
fs.writeFileSync(path.join(dataDir, 'accounts.json'), JSON.stringify(accounts, null, 2));
fs.writeFileSync(path.join(dataDir, 'transactions.json'), JSON.stringify(transactions, null, 2));

console.log(`Generated ${accounts.length} accounts and ${transactions.length} transactions successfully.`);
