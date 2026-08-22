import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Download, 
  CheckCircle2
} from 'lucide-react';
import type { Investigation, SuspiciousActivityReport } from '../types';
import { useSentinelStore } from '../store/useSentinelStore';

interface Props {
  investigation: Investigation;
  onClose: () => void;
}

export const SarGeneratorModal: React.FC<Props> = ({ investigation, onClose }) => {
  const { generateSAR, transactions } = useSentinelStore();
  const [copied, setCopied] = useState(false);

  const relatedTxs = transactions.filter(t => investigation.relatedTransactionIds.includes(t.id) || t.accountId === investigation.targetAccountId);
  const totalAmount = relatedTxs.reduce((sum, t) => sum + t.amount, 0);

  // Deterministic SAR generation
  const existingReport = investigation.sarReport;

  const defaultReport: SuspiciousActivityReport = existingReport || {
    reportId: `SAR-BSA-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toISOString(),
    filingInstitution: 'SENTINEL FLOW SEC-OPS COMPLIANCE (SYNTHETIC)',
    subjectName: investigation.targetAccountName,
    subjectAccountId: investigation.targetAccountId,
    totalSuspiciousAmount: parseFloat(totalAmount.toFixed(2)),
    summaryNarrative: `Between ${new Date(Date.now() - 7 * 86400000).toLocaleDateString()} and ${new Date().toLocaleDateString()}, synthetic account ${investigation.targetAccountName} (${investigation.targetAccountId}) executed a cluster of anomalous high-risk transactions totaling $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD.

Key Typologies Identified:
1. Impossible Geo-Velocity: Multiple inter-continental transactions executed within minutes exceeding 800 km/h physical travel feasibility.
2. Structured Transactions: Rapid serial wire out transfers structured just below the $10,000 regulatory reporting threshold.
3. Unrecognized Device Footprint: High-value transactions originating from unknown Tor exit nodes and headless browser fingerprints.

Findings & Corroboration:
Analyst review corroborated syndication indicators consistent with automated money mule operations. Evidence gathered confirms synthetic profile mismatch.`,
    violatedRules: [
      '31 CFR § 1020.320 - Reports by banks of suspicious transactions',
      'Rule 401: Impossible Geo-Velocity & Proxy Hopping',
      'Rule 404: Structuring to Evade Currency Reporting Requirements'
    ],
    recommendedAction: 'IMMEDIATE FREEZE & FINCEN BSA REGULATORY ESCALATION',
    analystSignoff: `${investigation.leadAnalyst} [Digital Token: 0x88F7B129]`
  };

  const handleSaveAndFile = () => {
    generateSAR(investigation.id, defaultReport);
    alert(`SAR Report ${defaultReport.reportId} successfully generated and filed to audit log!`);
    onClose();
  };

  const handleCopy = () => {
    const text = `=====================================================
OFFICIAL SUSPICIOUS ACTIVITY REPORT (SAR) — SYNTHETIC DEMO
=====================================================
Report ID: ${defaultReport.reportId}
Filing Institution: ${defaultReport.filingInstitution}
Date: ${new Date(defaultReport.generatedAt).toLocaleString()}

SUBJECT INFORMATION:
Name: ${defaultReport.subjectName}
Account ID: ${defaultReport.subjectAccountId}
Total Suspicious Volume: $${defaultReport.totalSuspiciousAmount.toLocaleString()} USD

NARRATIVE SUMMARY:
${defaultReport.summaryNarrative}

VIOLATED REGULATIONS & RULES:
${defaultReport.violatedRules.map(r => `• ${r}`).join('\n')}

RECOMMENDED ACTION:
${defaultReport.recommendedAction}

ANALYST SIGN-OFF:
${defaultReport.analystSignoff}
=====================================================
DEMO / SYNTHETIC DATA ONLY`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="drawer-backdrop" style={{ justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 22, 36, 0.98)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Suspicious Activity Report (SAR) Generator
                </h2>
                <span className="synthetic-badge" style={{ fontSize: '10px' }}>Synthetic Template</span>
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Doc Ref: {defaultReport.reportId} • FinCEN Form 111 Compliance Format
              </div>
            </div>
          </div>

          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Report Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff' }}>
          
          {/* Header Metadata Grid */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filing Entity</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>TraceGuard SOC</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject Account</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>{defaultReport.subjectName}</div>
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{defaultReport.subjectAccountId}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Suspicious Amount</div>
              <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                ${defaultReport.totalSuspiciousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
              </div>
            </div>
          </div>

          {/* Narrative Preview */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Part V: Suspicious Activity Information Narrative
            </div>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              fontFamily: 'Inter, sans-serif'
            }}>
              {defaultReport.summaryNarrative}
            </pre>
          </div>

          {/* Regulations & Violations */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Statutory Basis & Policy Violations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {defaultReport.violatedRules.map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                  <CheckCircle2 size={13} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Action & Signoff */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommended Regulatory Action</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                {defaultReport.recommendedAction}
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SecOps Analyst Signoff</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {defaultReport.analystSignoff}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy SAR Text'}</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleSaveAndFile}>
            <Download size={14} />
            <span>File SAR & Seal Case</span>
          </button>
        </div>
      </div>
    </div>
  );
};
