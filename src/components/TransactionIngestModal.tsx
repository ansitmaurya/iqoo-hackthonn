import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Send
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import type { MerchantCategory, TransactionType } from '../types';

interface TransactionIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MERCHANT_CATEGORIES: MerchantCategory[] = [
  'CRYPTO_EXCHANGE',
  'WIRE_REMITTANCE',
  'ONLINE_CASINO',
  'LUXURY_GOODS',
  'ELECTRONICS',
  'GROCERIES',
  'TRAVEL_AIRLINE',
  'PEER_TRANSFER',
  'UTILITIES',
  'PHARMACY'
];

const TX_TYPES: TransactionType[] = [
  'TRANSFER',
  'P2P_PAYMENT',
  'CRYPTO_DEPOSIT',
  'WIRE_OUT',
  'PURCHASE',
  'ATM_WITHDRAWAL'
];

const CITIES = [
  { city: 'New York', country: 'US', lat: 40.7128, lng: -74.0060, ip: '198.51.100.42' },
  { city: 'Singapore', country: 'SG', lat: 1.3521, lng: 103.8198, ip: '185.220.101.5' },
  { city: 'Frankfurt', country: 'DE', lat: 50.1109, lng: 8.6821, ip: '194.26.29.112' },
  { city: 'London', country: 'GB', lat: 51.5074, lng: -0.1278, ip: '82.165.197.1' },
  { city: 'Dubai', country: 'AE', lat: 25.2048, lng: 55.2708, ip: '185.107.56.20' },
  { city: 'Toronto', country: 'CA', lat: 43.6532, lng: -79.3832, ip: '198.51.101.232' }
];

export const TransactionIngestModal: React.FC<TransactionIngestModalProps> = ({ isOpen, onClose }) => {
  const { accounts, submitTransactionApi } = useSentinelStore();

  const [senderId, setSenderId] = useState<string>(accounts[0]?.id || 'ACC-10000');
  const [receiverId, setReceiverId] = useState<string>(accounts[1]?.id || 'ACC-10411');
  const [amount, setAmount] = useState<string>('12500');
  const [category, setCategory] = useState<MerchantCategory>('CRYPTO_EXCHANGE');
  const [txType, setTxType] = useState<TransactionType>('TRANSFER');
  const [selectedCityIdx, setSelectedCityIdx] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const senderAccount = accounts.find(a => a.id === senderId);
  const receiverAccount = accounts.find(a => a.id === receiverId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResultData(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid positive transaction amount.');
      return;
    }

    const cityObj = CITIES[selectedCityIdx];

    setIsSubmitting(true);
    try {
      const response = await submitTransactionApi({
        sender: senderId,
        sender_name: senderAccount?.ownerName || `Account ${senderId}`,
        receiver: receiverId,
        receiver_name: receiverAccount?.ownerName || `Account ${receiverId}`,
        amount: numAmount,
        currency: 'USD',
        type: txType,
        category,
        location: {
          city: cityObj.city,
          country: cityObj.country,
          latitude: cityObj.lat,
          longitude: cityObj.lng,
          ipAddress: cityObj.ip
        }
      });

      setResultData(response);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit transaction to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setResultData(null);
    setErrorMessage(null);
    setAmount('15000');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(1, 4, 9, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '620px',
        boxShadow: '0 20px 40px rgba(2, 132, 199, 0.18)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%)',
          borderBottom: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Ingest Live Transaction
              </h2>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Dispatch live payload directly into Flask Risk Scoring & PostgreSQL Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {resultData ? (
            /* Success & Risk Evaluation Result State */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: resultData.transaction.riskScore >= 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1.5px solid ${resultData.transaction.riskScore >= 60 ? '#ef4444' : '#10b981'}`,
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  {resultData.transaction.riskScore >= 60 ? (
                    <ShieldAlert size={26} color="#ef4444" />
                  ) : (
                    <CheckCircle2 size={26} color="#10b981" />
                  )}
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {resultData.transaction.riskScore >= 60 ? 'HIGH RISK DETECTED & FLAGGED' : 'TRANSACTION SETTLED'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                  Transaction <strong>{resultData.transaction.id}</strong> scored{' '}
                  <span style={{
                    fontWeight: 800,
                    color: resultData.transaction.riskScore >= 80 ? '#dc2626' : resultData.transaction.riskScore >= 60 ? '#ea580c' : '#059669',
                    fontSize: '15px'
                  }}>
                    {resultData.transaction.riskScore}/100 ({resultData.transaction.riskLevel})
                  </span>
                </div>

                {resultData.alert && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#991b1b',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <span>
                      <strong>Automated Alert Dispatched:</strong> {resultData.alert.id} ({resultData.alert.severity} Severity)
                    </span>
                  </div>
                )}
              </div>

              {/* Triggered Rules Breakdown */}
              {resultData.transaction.triggeredRules && resultData.transaction.triggeredRules.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                    TRIGGERED HEURISTIC RULES ({resultData.transaction.triggeredRules.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {resultData.transaction.triggeredRules.map((rule: any, idx: number) => (
                      <div key={idx} style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>
                          <span>{rule.ruleName}</span>
                          <span style={{ color: '#ef4444' }}>+{rule.scoreContribution} pts</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{rule.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleResetForm}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    background: '#f0f7ff',
                    color: '#0284c7',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Ingest Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View in Console
                </button>
              </div>
            </div>
          ) : (
            /* Ingest Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {errorMessage && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '12px'
                }}>
                  {errorMessage}
                </div>
              )}

              {/* Sender & Receiver Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Originating Sender (Account)
                  </label>
                  <select
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      background: '#ffffff',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  >
                    {accounts.slice(0, 30).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.ownerName} ({acc.id}) - Risk {acc.riskScore}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Destination Receiver
                  </label>
                  <select
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      background: '#ffffff',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  >
                    {accounts.slice(0, 30).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.ownerName} ({acc.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Amount (USD)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b', fontSize: '13px' }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10000.00"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 24px',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe',
                        background: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Transaction Type
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as TransactionType)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      background: '#ffffff',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  >
                    {TX_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category & Geolocation Transit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Merchant / Sector Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MerchantCategory)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      background: '#ffffff',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  >
                    {MERCHANT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Routed Geo-Location & IP
                  </label>
                  <select
                    value={selectedCityIdx}
                    onChange={(e) => setSelectedCityIdx(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      background: '#ffffff',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  >
                    {CITIES.map((c, i) => (
                      <option key={c.city} value={i}>
                        {c.city}, {c.country} ({c.ip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Scenario Fill Chips */}
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                  QUICK AML SCENARIOS:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAmount('65000');
                      setCategory('CRYPTO_EXCHANGE');
                      setTxType('CRYPTO_DEPOSIT');
                      setSelectedCityIdx(1); // Singapore
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Critical Crypto Egress ($65k)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmount('9850');
                      setCategory('WIRE_REMITTANCE');
                      setTxType('WIRE_OUT');
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#fef3c7',
                      color: '#d97706',
                      border: '1px solid #fde68a',
                      cursor: 'pointer'
                    }}
                  >
                    ⚠️ Near-CTR Structuring ($9.85k)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmount('250');
                      setCategory('GROCERIES');
                      setTxType('PURCHASE');
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#dcfce7',
                      color: '#059669',
                      border: '1px solid #86efac',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Normal Low Risk ($250)
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {isSubmitting ? (
                    <span>Evaluating Risk...</span>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Dispatch & Evaluate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
