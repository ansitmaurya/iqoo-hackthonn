import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Unlock, 
  MapPin, 
  Plus, 
  Tag
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { RiskBadge } from './RiskBadge';

export const AccountModal: React.FC = () => {
  const { 
    selectedAccountId, 
    setSelectedAccountId, 
    accounts, 
    transactions, 
    updateAccountStatus, 
    addAccountRiskFactor,
    createInvestigation,
    setSelectedTxId
  } = useSentinelStore();

  const [newFactor, setNewFactor] = useState('');

  if (!selectedAccountId) return null;

  const account = accounts.find(a => a.id === selectedAccountId);
  if (!account) return null;

  const accountTxs = transactions.filter(t => t.accountId === account.id || t.recipientId === account.id).slice(0, 15);
  const totalVolume = accountTxs.reduce((sum, t) => sum + t.amount, 0);

  const handleToggleFreeze = () => {
    const nextStatus = account.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    updateAccountStatus(account.id, nextStatus, `Analyst triggered status change to ${nextStatus}`);
  };

  const handleAddRiskFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactor.trim()) return;
    addAccountRiskFactor(account.id, newFactor.trim());
    setNewFactor('');
  };

  const handleStartInvestigation = () => {
    createInvestigation(`Account Dossier: ${account.ownerName}`, account.id);
    setSelectedAccountId(null);
  };

  const riskLevel = account.riskScore >= 80 ? 'CRITICAL' : account.riskScore >= 60 ? 'HIGH' : account.riskScore >= 35 ? 'MEDIUM' : 'LOW';

  return (
    <div className="drawer-backdrop" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={() => setSelectedAccountId(null)}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 22, 36, 0.98)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: '1px solid var(--border-highlight)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {account.ownerName}
                </h2>
                <RiskBadge level={riskLevel} score={account.riskScore} size="sm" />
              </div>
              <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {account.id} • {account.accountNumber} • {account.type}
              </div>
            </div>
          </div>

          <button className="btn btn-ghost" onClick={() => setSelectedAccountId(null)} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Key Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance</div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>USD Liquidity</div>
            </div>

            <div className="glass-panel" style={{ padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Historical Baseline</div>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                ${account.historicalAvgAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Tx Amount (σ: ${account.historicalStdDevAmount})</div>
            </div>

            <div className="glass-panel" style={{ padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Status</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: account.status === 'FROZEN' ? '#dc2626' : account.status === 'FLAGGED' ? '#d97706' : '#059669', marginTop: '4px' }}>
                {account.status}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{account.totalAlertsCount} Total Alerts</div>
            </div>
          </div>

          {/* Location & Devices */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="var(--accent-cyan)" /> Last Known Geolocation
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                {account.lastKnownLocation.city}, {account.lastKnownLocation.country}
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                IP: {account.lastKnownLocation.ipAddress}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Known Registered Devices
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {account.knownDevices.map((dev, idx) => (
                  <span key={idx} className="font-mono" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {dev}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Factors & Tags */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={12} /> Risk Factors & Analyst Annotations
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {account.tags.map((t, i) => (
                <span key={i} style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  {t}
                </span>
              ))}
              {account.riskFactors.map((f, i) => (
                <span key={i} style={{ background: 'var(--risk-critical-bg)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.25)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  ⚠ {f}
                </span>
              ))}
            </div>

            <form onSubmit={handleAddRiskFactor} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add new risk factor tag (e.g. Tor Exit IP, Structuring Hub)..."
                value={newFactor}
                onChange={(e) => setNewFactor(e.target.value)}
                style={{ flex: 1, fontSize: '12px' }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!newFactor.trim()}>
                <Plus size={13} /> Add Tag
              </button>
            </form>
          </div>

          {/* Recent Activity Mini List */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Recent Activity ({accountTxs.length} Events)</span>
              <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Total: ${totalVolume.toLocaleString()} USD</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {accountTxs.map(tx => (
                <div 
                  key={tx.id}
                  onClick={() => {
                    setSelectedAccountId(null);
                    setSelectedTxId(tx.id);
                  }}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{tx.id}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{tx.type} • {tx.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700 }}>
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" showScore={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Action Bar */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(11, 16, 26, 0.98)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            className={`btn ${account.status === 'FROZEN' ? 'btn-secondary' : 'btn-danger'} btn-sm`}
            onClick={handleToggleFreeze}
          >
            {account.status === 'FROZEN' ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{account.status === 'FROZEN' ? 'Unfreeze Account' : 'Emergency Freeze Account'}</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleStartInvestigation}
          >
            <span>Open Investigation & SAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
