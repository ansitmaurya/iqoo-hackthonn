import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  User, 
  Terminal 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useSentinelStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = log.id.toLowerCase().includes(q);
        const matchesActor = log.actor.toLowerCase().includes(q);
        const matchesTarget = log.targetId.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        if (!matchesId && !matchesActor && !matchesTarget && !matchesDetails) return false;
      }

      if (actionFilter !== 'ALL' && !log.action.includes(actionFilter)) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <SyntheticDataBanner />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            SOC Audit & Compliance Trail
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Immutable chronological record of automated engine evaluations, analyst actions, and regulatory filings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <ShieldCheck size={14} />
          <span>Audit Logging Active (Tamper Evident)</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search actor, target ID, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Filter size={14} />
          <span>Action Category:</span>
          <select
            className="form-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Event Types</option>
            <option value="ALERT">Alert Lifecycle Events</option>
            <option value="ACCOUNT">Account Security Changes</option>
            <option value="SAR">SAR Regulatory Filings</option>
            <option value="INVESTIGATION">Investigation Workflows</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Log Ref</th>
              <th>Timestamp</th>
              <th>Actor / System</th>
              <th>Action Type</th>
              <th>Target Entity</th>
              <th>Audit Narrative & Payload Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No audit log entries matched your filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.id}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.actor.includes('System') || log.actor.includes('Engine') ? (
                        <Terminal size={13} color="var(--accent-cyan)" />
                      ) : (
                        <User size={13} color="var(--accent-blue)" />
                      )}
                      <span>{log.actor}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: log.action.includes('FROZEN') || log.action.includes('SAR') ? 'rgba(239, 68, 68, 0.15)' : log.action.includes('ALERT') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: log.action.includes('FROZEN') || log.action.includes('SAR') ? '#ef4444' : log.action.includes('ALERT') ? '#f59e0b' : '#60a5fa',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                      {log.targetId}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
