import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  MapPin, 
  Eye, 
  SlidersHorizontal 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { RiskBadge } from '../components/RiskBadge';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';
import type { MerchantCategory } from '../types';

const CATEGORIES: MerchantCategory[] = [
  'CRYPTO_EXCHANGE', 'WIRE_REMITTANCE', 'ONLINE_CASINO', 'LUXURY_GOODS',
  'ELECTRONICS', 'GROCERIES', 'TRAVEL_AIRLINE', 'PEER_TRANSFER', 'UTILITIES', 'PHARMACY'
];

export const TransactionExplorerPage: React.FC = () => {
  const { transactions, setSelectedTxId } = useSentinelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [minRiskScore, setMinRiskScore] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'timestamp' | 'amount' | 'riskScore'>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = tx.id.toLowerCase().includes(q);
        const matchesSender = tx.accountName.toLowerCase().includes(q) || tx.accountId.toLowerCase().includes(q);
        const matchesRecip = (tx.recipientName && tx.recipientName.toLowerCase().includes(q)) || (tx.recipientId && tx.recipientId.toLowerCase().includes(q));
        const matchesCity = tx.location.city.toLowerCase().includes(q);
        if (!matchesId && !matchesSender && !matchesRecip && !matchesCity) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;

      // Status
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;

      // Risk score threshold
      if (tx.riskScore < minRiskScore) return false;

      // Flagged only
      if (flaggedOnly && !tx.flagged) return false;

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'timestamp') {
        valA = new Date(a.timestamp).getTime();
        valB = new Date(b.timestamp).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [transactions, searchQuery, selectedCategory, minRiskScore, statusFilter, flaggedOnly, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTxs = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Account ID', 'Account Name', 'Amount (USD)', 'Type', 'Category', 'Timestamp', 'Location', 'IP Address', 'Risk Score', 'Risk Level', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.accountId,
      `"${t.accountName.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      t.timestamp,
      `"${t.location.city}, ${t.location.country}"`,
      t.location.ipAddress,
      t.riskScore,
      t.riskLevel,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_synthetic_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: 'timestamp' | 'amount' | 'riskScore') => {
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
            Transaction Explorer
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Full telemetry audit log of synthetic payment flows, peer transfers, and card transactions.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={14} />
          <span>Export Filtered CSV ({filteredTransactions.length})</span>
        </button>
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by TX ID, Account Name, Counterparty, City..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Category:</span>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Status:</span>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SETTLED">Settled</option>
              <option value="FLAGGED">Flagged</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Flagged Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => { setFlaggedOnly(e.target.checked); setCurrentPage(1); }}
            />
            <span>Flagged Only</span>
          </label>
        </div>

        {/* Risk Score Slider Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <SlidersHorizontal size={14} />
            <span>Minimum Risk Score:</span>
          </div>
          <input
            type="range"
            min="0"
            max="95"
            step="5"
            value={minRiskScore}
            onChange={(e) => { setMinRiskScore(parseInt(e.target.value)); setCurrentPage(1); }}
            style={{ width: '180px', accentColor: 'var(--accent-cyan)' }}
          />
          <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: minRiskScore >= 60 ? 'var(--risk-critical)' : 'var(--accent-cyan)' }}>
            &ge; {minRiskScore}/100
          </span>

          {minRiskScore > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMinRiskScore(0)}
              style={{ fontSize: '11px', padding: '2px 6px' }}
            >
              Reset Slider
            </button>
          )}
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>TX ID</th>
              <th>Originator Account</th>
              <th>Counterparty</th>
              <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Amount</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Category</th>
              <th>Geolocation</th>
              <th onClick={() => handleSort('riskScore')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Risk Score</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Status</th>
              <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Timestamp</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTxs.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No transactions match the specified filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTxs.map((tx) => (
                <tr key={tx.id} onClick={() => setSelectedTxId(tx.id)}>
                  <td>
                    <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {tx.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.accountName}</div>
                    <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tx.accountId}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.recipientName || 'External Gateway'}</div>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {tx.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} /> {tx.location.city}, {tx.location.country}
                    </span>
                  </td>
                  <td>
                    <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                  </td>
                  <td>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: tx.status === 'BLOCKED' ? 'rgba(239, 68, 68, 0.15)' : tx.status === 'FLAGGED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: tx.status === 'BLOCKED' ? '#ef4444' : tx.status === 'FLAGGED' ? '#f59e0b' : '#10b981'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(tx.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTxId(tx.id);
                      }}
                      style={{ padding: '4px' }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
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
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
