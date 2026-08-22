import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  CheckCircle, 
  XCircle, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import type { AlertStatus } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';

export const AlertsQueuePage: React.FC = () => {
  const { 
    alerts, 
    setSelectedAlertId, 
    bulkUpdateAlerts 
  } = useSentinelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE_OPEN');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'riskScore' | 'createdAt' | 'amount'>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filtered & Sorted Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = alert.accountName.toLowerCase().includes(q);
        const matchesId = alert.id.toLowerCase().includes(q);
        const matchesTx = alert.transactionId.toLowerCase().includes(q);
        const matchesRule = alert.triggeredRules.some(r => r.ruleName.toLowerCase().includes(q));
        if (!matchesName && !matchesId && !matchesTx && !matchesRule) return false;
      }

      // Status
      if (statusFilter === 'ACTIVE_OPEN') {
        if (alert.status !== 'OPEN' && alert.status !== 'IN_REVIEW') return false;
      } else if (statusFilter !== 'ALL') {
        if (alert.status !== statusFilter) return false;
      }

      // Risk
      if (riskFilter !== 'ALL') {
        if (alert.riskLevel !== riskFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortField === 'amount') {
        valA = a.transaction.amount;
        valB = b.transaction.amount;
      } else if (sortField === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else {
        valA = a.riskScore;
        valB = b.riskScore;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [alerts, searchQuery, statusFilter, riskFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSelectAll = () => {
    if (selectedAlertIds.length === paginatedAlerts.length) {
      setSelectedAlertIds([]);
    } else {
      setSelectedAlertIds(paginatedAlerts.map(a => a.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAlertIds.includes(id)) {
      setSelectedAlertIds(selectedAlertIds.filter(item => item !== id));
    } else {
      setSelectedAlertIds([...selectedAlertIds, id]);
    }
  };

  const handleBulkAction = (status: AlertStatus) => {
    if (selectedAlertIds.length === 0) return;
    bulkUpdateAlerts(selectedAlertIds, status);
    setSelectedAlertIds([]);
  };

  const handleSort = (field: 'riskScore' | 'createdAt' | 'amount') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <SyntheticDataBanner />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Security Alerts Queue
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Unified real-time triage queue for suspicious transaction anomalies and synthetic AML rule alerts.
          </p>
        </div>

        {/* Bulk Action Bar */}
        {selectedAlertIds.length > 0 && (
          <div style={{
            background: '#121929',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '8px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.2)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {selectedAlertIds.length} Selected
            </span>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-color)' }} />
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAction('ESCALATED')}>
              <ShieldAlert size={13} color="#ef4444" />
              <span>Bulk Escalate</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAction('RESOLVED')}>
              <CheckCircle size={13} color="#10b981" />
              <span>Bulk Resolve</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAction('FALSE_POSITIVE')}>
              <XCircle size={13} color="#94a3b8" />
              <span>Mark False Positive</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search account, ID, or rule..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Status:</span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ACTIVE_OPEN">Active (Open & In Review)</option>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Risk Level:</span>
            <select
              className="form-select"
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Levels</option>
              <option value="CRITICAL">Critical (80-99)</option>
              <option value="HIGH">High (60-79)</option>
              <option value="MEDIUM">Medium (35-59)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <div onClick={handleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {selectedAlertIds.length > 0 && selectedAlertIds.length === paginatedAlerts.length ? (
                    <CheckSquare size={16} color="var(--accent-cyan)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                </div>
              </th>
              <th>Alert ID</th>
              <th>Account Subject</th>
              <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Amount</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Triggered Threat Rules</th>
              <th onClick={() => handleSort('riskScore')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Risk Score</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Status</th>
              <th>Assignee</th>
              <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Timestamp</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlerts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No alerts match the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedAlerts.map((alert) => {
                const isSelected = selectedAlertIds.includes(alert.id);
                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    style={{ background: isSelected ? 'rgba(0, 242, 254, 0.05)' : undefined }}
                  >
                    <td onClick={(e) => handleToggleSelect(alert.id, e)}>
                      {isSelected ? (
                        <CheckSquare size={16} color="var(--accent-cyan)" />
                      ) : (
                        <Square size={16} color="var(--text-muted)" />
                      )}
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {alert.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alert.accountName}</div>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{alert.accountId}</div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      ${alert.transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {alert.triggeredRules.slice(0, 2).map((r, i) => (
                          <span key={i} style={{ fontSize: '11px', color: r.severity === 'CRITICAL' ? '#f87171' : '#fbbf24' }}>
                            • {r.ruleName}
                          </span>
                        ))}
                        {alert.triggeredRules.length > 2 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            +{alert.triggeredRules.length - 2} more rules
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="sm" />
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: alert.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : alert.status === 'ESCALATED' ? 'rgba(239, 68, 68, 0.15)' : alert.status === 'FALSE_POSITIVE' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: alert.status === 'RESOLVED' ? '#10b981' : alert.status === 'ESCALATED' ? '#ef4444' : alert.status === 'FALSE_POSITIVE' ? '#94a3b8' : '#f59e0b',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {alert.assignedAnalyst || 'Unassigned'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(alert.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0c111c',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length} alerts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="font-mono">Page {currentPage} of {totalPages}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
