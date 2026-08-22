import React, { useState } from 'react';
import { 
  FileSpreadsheet,
  CheckSquare, 
  Square, 
  User, 
  CheckCircle2, 
  Plus, 
  ExternalLink, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { RiskBadge } from '../components/RiskBadge';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';
import { SarGeneratorModal } from '../components/SarGeneratorModal';
import type { Investigation } from '../types';

export const InvestigationWorkspacePage: React.FC = () => {
  const { 
    investigations, 
    selectedInvestigationId, 
    setSelectedInvestigationId, 
    accounts, 
    transactions, 
    updateInvestigationStatus, 
    toggleEvidenceCheck, 
    updateInvestigationFindings,
    updateAccountStatus,
    setSelectedTxId,
    setSelectedAccountId,
    createInvestigation
  } = useSentinelStore();

  const [showSarModal, setShowSarModal] = useState<boolean>(false);
  const [newCaseAccount, setNewCaseAccount] = useState<string>(accounts[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Active selected investigation
  const activeInv: Investigation | undefined = 
    investigations.find(i => i.id === selectedInvestigationId) || investigations[0];

  const targetAccount = activeInv ? accounts.find(a => a.id === activeInv.targetAccountId) : undefined;
  const relatedTxs = activeInv ? transactions.filter(t => activeInv.relatedTransactionIds.includes(t.id) || t.accountId === activeInv.targetAccountId).slice(0, 8) : [];

  const handleStatusChange = (status: Investigation['status']) => {
    if (!activeInv) return;
    updateInvestigationStatus(activeInv.id, status);
  };

  const handleCreateNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === newCaseAccount);
    if (!acc) return;

    createInvestigation(
      `Special Investigation: ${acc.ownerName}`,
      acc.id
    );
    setShowCreateModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <SyntheticDataBanner />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Investigation Workspace & SAR Compliance
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comprehensive case management, evidence corroboration, and deterministic FinCEN SAR filing.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          <span>New Investigation Case</span>
        </button>
      </div>

      {/* Main Workspace Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Active Investigations Dossier List */}
        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1.5px solid #93c5fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Active Dossiers ({investigations.length})
            </span>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '680px', overflowY: 'auto' }}>
            {investigations.map((inv) => {
              const isSelected = activeInv?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvestigationId(inv.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: isSelected ? 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)' : '#ffffff',
                    border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color)',
                    boxShadow: isSelected ? '0 6px 20px rgba(2, 132, 199, 0.22)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative'
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '12px',
                      bottom: '12px',
                      width: '4px',
                      borderRadius: '0 4px 4px 0',
                      background: '#0284c7'
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: '#0284c7', fontWeight: 800 }}>
                      {inv.id}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: inv.status === 'SAR_FILED' ? 'rgba(5, 150, 105, 0.15)' : inv.status === 'ESCALATED_LEGAL' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                      color: inv.status === 'SAR_FILED' ? '#059669' : inv.status === 'ESCALATED_LEGAL' ? '#dc2626' : '#d97706',
                      border: '1px solid currentColor'
                    }}>
                      {inv.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {inv.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600 }}>Target: <strong style={{ color: 'var(--text-primary)' }}>{inv.targetAccountName}</strong></span>
                    <span className="font-mono" style={{ color: '#dc2626', fontWeight: 800 }}>
                      ${inv.totalAtRiskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Detail Dossier */}
        {activeInv ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Case Dossier Header */}
            <div className="glass-panel" style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              borderTop: '3px solid #0284c7',
              boxShadow: '0 6px 24px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                      {activeInv.title}
                    </h2>
                    <RiskBadge level={activeInv.severity} size="sm" showScore={false} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Lead: <strong style={{ color: 'var(--text-primary)' }}>{activeInv.leadAnalyst}</strong></span>
                    <span>•</span>
                    <span>Created: <strong>{new Date(activeInv.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Status Selector & SAR Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    className="form-select"
                    value={activeInv.status}
                    onChange={(e) => handleStatusChange(e.target.value as Investigation['status'])}
                    style={{ fontWeight: 700, border: '1.5px solid var(--border-highlight)' }}
                  >
                    <option value="NEW">Status: NEW</option>
                    <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                    <option value="SAR_FILED">Status: SAR FILED</option>
                    <option value="ESCALATED_LEGAL">Status: ESCALATED LEGAL</option>
                    <option value="CLOSED">Status: CLOSED</option>
                  </select>

                  <button
                    className="btn btn-primary"
                    onClick={() => setShowSarModal(true)}
                    style={{ fontWeight: 700 }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Generate FinCEN SAR</span>
                  </button>
                </div>
              </div>

              {/* Target Account Summary Banner */}
              {targetAccount && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%)',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}>
                      <User size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>{targetAccount.ownerName}</span>
                        <RiskBadge level={targetAccount.riskScore >= 80 ? 'CRITICAL' : 'HIGH'} score={targetAccount.riskScore} size="sm" />
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <strong style={{ color: '#0284c7' }}>{targetAccount.id}</strong> • {targetAccount.type} • {targetAccount.lastKnownLocation.city}, {targetAccount.lastKnownLocation.country}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Liquidity Balance</div>
                      <div className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
                        ${targetAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button
                      className={`btn ${targetAccount.status === 'FROZEN' ? 'btn-secondary' : 'btn-danger'} btn-sm`}
                      onClick={() => {
                        const next = targetAccount.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
                        updateAccountStatus(targetAccount.id, next, `Changed from Investigation ${activeInv.id}`);
                      }}
                      style={{ fontWeight: 700 }}
                    >
                      {targetAccount.status === 'FROZEN' ? <Unlock size={14} /> : <Lock size={14} />}
                      <span>{targetAccount.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}</span>
                    </button>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedAccountId(targetAccount.id)}
                      title="View Full Profile"
                    >
                      <ExternalLink size={15} color="#0284c7" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Checklist & Corroboration */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" />
                <span>Forensic Evidence Corroboration Checklist</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeInv.evidenceChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleEvidenceCheck(activeInv.id, item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: item.checked ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-subtle)',
                      border: '1px solid',
                      borderColor: item.checked ? 'rgba(5, 150, 105, 0.35)' : 'var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: item.checked ? 600 : 500,
                      color: item.checked ? '#059669' : 'var(--text-primary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.checked ? <CheckSquare size={17} color="#059669" /> : <Square size={17} color="var(--text-muted)" />}
                    <span style={{ textDecoration: item.checked ? 'line-through' : 'none' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Findings & Case Notes */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Analyst Findings Narrative & Case Notes
              </div>
              <textarea
                className="form-input"
                rows={4}
                value={activeInv.findings}
                onChange={(e) => updateInvestigationFindings(activeInv.id, e.target.value)}
                placeholder="Enter detailed forensic observations, syndicate linkage notes, and law enforcement referrals..."
                style={{ width: '100%', lineHeight: '1.5', fontSize: '13px', border: '1.5px solid var(--border-color)' }}
              />
            </div>

            {/* Linked Flagged Transactions */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Linked Suspicious Transactions ({relatedTxs.length})</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 800 }}>
                  Total Flagged: ${activeInv.totalAtRiskAmount.toLocaleString()} USD
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {relatedTxs.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 800 }}>{tx.id}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>{tx.category.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {new Date(tx.timestamp).toLocaleString()} • {tx.location.city}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No investigation selected.
          </div>
        )}

      </div>

      {/* SAR Generator Modal */}
      {showSarModal && activeInv && (
        <SarGeneratorModal
          investigation={activeInv}
          onClose={() => setShowSarModal(false)}
        />
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="drawer-backdrop" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Open New Investigation</h3>
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateNewCase} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Account Subject:</label>
                <select
                  className="form-select"
                  value={newCaseAccount}
                  onChange={(e) => setNewCaseAccount(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.ownerName} ({acc.id}) — {acc.type}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Dossier</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
