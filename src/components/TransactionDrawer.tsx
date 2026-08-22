import React from 'react';
import { 
  X, 
  CreditCard, 
  MapPin, 
  Smartphone, 
  ShieldAlert, 
  ArrowRight, 
  User, 
  CheckCircle2, 
  AlertOctagon,
  Clock
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { RiskBadge } from './RiskBadge';

export const TransactionDrawer: React.FC = () => {
  const { 
    selectedTxId, 
    setSelectedTxId, 
    transactions, 
    setSelectedAccountId, 
    createInvestigation,
    updateAccountStatus
  } = useSentinelStore();

  if (!selectedTxId) return null;

  const tx = transactions.find(t => t.id === selectedTxId);
  if (!tx) return null;

  const handleOpenAccount = () => {
    setSelectedAccountId(tx.accountId);
  };

  const handleStartInvestigation = () => {
    createInvestigation(`Investigation: ${tx.accountName} (${tx.id})`, tx.accountId, [], [tx.id]);
    setSelectedTxId(null);
  };

  return (
    <div className="drawer-backdrop" onClick={() => setSelectedTxId(null)}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 22, 36, 0.98)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Transaction Dossier
              </h2>
              <span className="font-mono" style={{ fontSize: '13px', color: 'var(--accent-cyan)' }}>
                {tx.id}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} />
              <span>{new Date(tx.timestamp).toLocaleString()}</span>
              <span>•</span>
              <span className="synthetic-badge" style={{ padding: '1px 6px', fontSize: '9px' }}>100% Synthetic</span>
            </div>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => setSelectedTxId(null)}
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Key Metrics Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0c121e 0%, #151e30 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transaction Amount</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>USD</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent-blue)', marginTop: '4px' }}>
                {tx.type} • {tx.category.replace(/_/g, ' ')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Evaluation</div>
              <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="lg" />
              <span style={{ fontSize: '11px', color: tx.status === 'BLOCKED' ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                Status: {tx.status}
              </span>
            </div>
          </div>

          {/* Account Transfer Flow Card */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Entity Flow
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              {/* Origin Account */}
              <div style={{ flex: 1, background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} /> Originator
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{tx.accountName}</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{tx.accountId}</div>
                <button
                  onClick={handleOpenAccount}
                  style={{ marginTop: '8px', background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontSize: '11px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  View Profile →
                </button>
              </div>

              <div style={{ color: 'var(--text-muted)' }}>
                <ArrowRight size={20} />
              </div>

              {/* Recipient Account */}
              <div style={{ flex: 1, background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CreditCard size={12} /> Counterparty / Recipient
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{tx.recipientName || 'External Gateway'}</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.recipientId || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Triggered Risk Rules & Explainability */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} color={tx.triggeredRules.length > 0 ? '#ef4444' : '#10b981'} />
                <span>Deterministic Rule Breakdown ({tx.triggeredRules.length})</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Composite: {tx.riskScore}/100</span>
            </div>

            {tx.triggeredRules.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#059669', background: 'rgba(5, 150, 105, 0.08)', borderRadius: '8px', fontSize: '13px' }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                <div>Standard transaction. No fraud anomaly thresholds triggered.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tx.triggeredRules.map((rule, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid',
                      borderColor: rule.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.35)' : 'rgba(217, 119, 6, 0.35)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: rule.severity === 'CRITICAL' ? '#dc2626' : '#d97706'
                      }}>
                        {rule.ruleName}
                      </span>
                      <span style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: '11px',
                        background: 'rgba(2, 132, 199, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'var(--accent-cyan)'
                      }}>
                        +{rule.scoreContribution} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      {rule.description}
                    </p>
                    {rule.evidence && (
                      <div style={{ marginTop: '8px', background: 'rgba(15, 23, 42, 0.04)', padding: '6px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                        {JSON.stringify(rule.evidence)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telemetry & Device Footprint */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Geolocation */}
            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--accent-cyan)" /> Origin Location
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                {tx.location.city}, {tx.location.country}
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                IP: {tx.location.ipAddress}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Lat: {tx.location.latitude.toFixed(4)}, Lon: {tx.location.longitude.toFixed(4)}
              </div>
            </div>

            {/* Device Info */}
            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Smartphone size={13} color="var(--accent-cyan)" /> Device Footprint
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                {tx.device.browser} • {tx.device.os}
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                ID: {tx.device.deviceId}
              </div>
              <div style={{ fontSize: '11px', color: tx.device.isKnownDevice ? '#10b981' : '#f59e0b', marginTop: '2px', fontWeight: 600 }}>
                {tx.device.isKnownDevice ? '✓ Recognized Device' : '⚠ Unrecognized / Tor Exit'}
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Action Bar */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(11, 16, 26, 0.98)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              updateAccountStatus(tx.accountId, 'FLAGGED', `Manual flag via TX ${tx.id}`);
              alert(`Account ${tx.accountName} flagged for analyst monitoring.`);
            }}
          >
            <AlertOctagon size={14} color="#f59e0b" />
            <span>Flag Account</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleStartInvestigation}
          >
            <ShieldAlert size={14} />
            <span>Open Investigation & SAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
