import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Send, 
  MessageSquare, 
  ShieldAlert, 
  User, 
  FileText
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import type { AlertStatus } from '../types';
import { RiskBadge } from './RiskBadge';

const ANALYSTS = [
  'Analyst Sarah (SecOps)',
  'Analyst Chen (FinCrime)',
  'Analyst Marcus (AML Compliance)',
  'Unassigned (Auto-Triage)'
];

export const AlertDrawer: React.FC = () => {
  const { 
    selectedAlertId, 
    setSelectedAlertId, 
    alerts, 
    updateAlertStatus, 
    assignAlertAnalyst, 
    addAlertNote,
    createInvestigation,
    setSelectedTxId
  } = useSentinelStore();

  const [newNote, setNewNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState<AlertStatus | null>(null);

  if (!selectedAlertId) return null;

  const alert = alerts.find(a => a.id === selectedAlertId);
  if (!alert) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addAlertNote(alert.id, 'Analyst Sarah (SecOps)', newNote.trim());
    setNewNote('');
  };

  const handleStatusChange = (status: AlertStatus) => {
    if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
      setShowResolveModal(status);
    } else {
      updateAlertStatus(alert.id, status);
    }
  };

  const handleConfirmResolution = () => {
    if (showResolveModal) {
      updateAlertStatus(alert.id, showResolveModal, resolutionNote || `Closed as ${showResolveModal}`);
      setShowResolveModal(null);
      setResolutionNote('');
    }
  };

  const handleEscalateToInvestigation = () => {
    createInvestigation(
      `Escalated Alert Dossier: ${alert.accountName} (${alert.id})`,
      alert.accountId,
      [alert.id],
      [alert.transactionId]
    );
    updateAlertStatus(alert.id, 'ESCALATED', 'Escalated to Formal AML/SAR Investigation');
    setSelectedAlertId(null);
  };

  return (
    <div className="drawer-backdrop" onClick={() => setSelectedAlertId(null)}>
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
              <AlertTriangle size={20} color={alert.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Security Alert Triage
              </h2>
              <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
                {alert.id}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Created: {new Date(alert.createdAt).toLocaleString()}
            </div>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => setSelectedAlertId(null)}
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status & Priority Control Header */}
          <div style={{
            background: '#0a0e17',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Severity Score
              </div>
              <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="lg" />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Lifecycle Status
              </div>
              <select
                className="form-select"
                value={alert.status}
                onChange={(e) => handleStatusChange(e.target.value as AlertStatus)}
                style={{
                  fontWeight: 600,
                  color: alert.status === 'RESOLVED' ? '#10b981' : alert.status === 'ESCALATED' ? '#ef4444' : alert.status === 'FALSE_POSITIVE' ? '#94a3b8' : '#f59e0b'
                }}
              >
                <option value="OPEN">OPEN (New)</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="RESOLVED">RESOLVED (Actioned)</option>
                <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Assigned Lead
              </div>
              <select
                className="form-select"
                value={alert.assignedAnalyst || ANALYSTS[0]}
                onChange={(e) => assignAlertAnalyst(alert.id, e.target.value)}
                style={{ fontSize: '12px' }}
              >
                {ANALYSTS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Related Transaction Quick Card */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Triggering Transaction
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSelectedTxId(alert.transactionId);
                  setSelectedAlertId(null);
                }}
                style={{ color: 'var(--accent-cyan)', fontSize: '11px', padding: 0 }}
              >
                Inspect Full TX Payload →
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {alert.accountName}
                </div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Account: {alert.accountId} • TX: {alert.transactionId}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${alert.transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {alert.transaction.category.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Violated Rules List */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color="#ef4444" />
              <span>Triggered Detection Rules ({alert.triggeredRules.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alert.triggeredRules.map((rule, idx) => (
                <div key={idx} style={{ background: '#090d16', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: rule.severity === 'CRITICAL' ? '#f87171' : '#fbbf24' }}>
                      {rule.ruleName}
                    </span>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      +{rule.scoreContribution} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {rule.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Notes & Triage Audit Trail */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={14} />
              <span>Analyst Triage Log ({alert.notes.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {alert.notes.map((note) => (
                <div key={note.id} style={{ background: '#0a0e17', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={11} /> {note.author}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {note.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add investigation note or triage finding..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!newNote.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

        {/* Action Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(11, 16, 26, 0.98)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleStatusChange('FALSE_POSITIVE')}
            >
              <XCircle size={14} color="#94a3b8" />
              <span>False Positive</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleStatusChange('RESOLVED')}
            >
              <CheckCircle size={14} color="#10b981" />
              <span>Resolve</span>
            </button>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleEscalateToInvestigation}
          >
            <FileText size={14} />
            <span>Escalate to SAR Case</span>
          </button>
        </div>

        {/* Modal for Resolution Note */}
        {showResolveModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 15, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 10
          }}>
            <div style={{ background: '#121929', border: '1px solid var(--border-highlight)', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                Close Alert as {showResolveModal}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Provide a brief rationale for compliance audit logging:
              </p>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g., Customer verified legitimate travel via telephone OTP verification."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                style={{ width: '100%', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowResolveModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleConfirmResolution}>Confirm & Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
