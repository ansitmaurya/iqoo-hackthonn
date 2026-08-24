import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Layers, 
  MapPin, 
  Eye
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { RiskBadge } from '../components/RiskBadge';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';

export const LiveMonitoringPage: React.FC = () => {
  const { 
    transactions, 
    alerts, 
    recentNewTxIds, 
    recentNewAlertIds, 
    setSelectedTxId, 
    setSelectedAlertId, 
    triggerForcedScenario, 
    isSimulating,
    getMetrics 
  } = useSentinelStore();

  const metrics = getMetrics();
  const liveTxs = transactions.slice(0, 25);
  const liveAlerts = alerts.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Synthetic Environment Notice */}
      <SyntheticDataBanner />

      {/* KPI Cards Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Metric 1: TPS */}
        <div className="cyber-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Throughput Velocity</span>
            <Activity size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', fontFamily: 'JetBrains Mono' }}>
            {metrics.tps} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>TPS</span>
          </div>
          <div style={{ fontSize: '11px', color: isSimulating ? '#10b981' : '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className={isSimulating ? 'live-pulse' : ''} style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSimulating ? '#10b981' : '#f59e0b' }} />
            {isSimulating ? 'Deterministic Engine Active' : 'Simulation Paused'}
          </div>
        </div>

        {/* Metric 2: Fraud Rate */}
        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Anomaly / Fraud Rate</span>
            <TrendingUp size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: metrics.fraudRate > 8 ? '#ef4444' : '#f59e0b', marginTop: '8px', fontFamily: 'JetBrains Mono' }}>
            {metrics.fraudRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {metrics.flaggedCount} Flagged / {metrics.totalProcessedCount} Total
          </div>
        </div>

        {/* Metric 3: Value At Risk */}
        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Total Value At Risk</span>
            <DollarSign size={16} color="#f97316" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f97316', marginTop: '8px', fontFamily: 'JetBrains Mono' }}>
            ${metrics.totalAtRiskVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Out of ${metrics.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} Total Volume
          </div>
        </div>

        {/* Metric 4: Critical Incidents */}
        <div className="cyber-card" style={{ borderColor: metrics.criticalAlertsCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Open Active Incidents</span>
            <ShieldAlert size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', fontFamily: 'JetBrains Mono' }}>
            {metrics.openAlertsCount}
            {metrics.criticalAlertsCount > 0 && (
              <span style={{ fontSize: '12px', color: '#ef4444', marginLeft: '8px', fontWeight: 600 }}>
                ({metrics.criticalAlertsCount} Critical)
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-Time Triage Required
          </div>
        </div>

      </div>

      {/* Live Demo Anomaly Trigger Deck */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Interactive Fraud Scenario Injector
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Force synthetic threat patterns to test deterministic scoring rules in real-time.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => triggerForcedScenario('GEO_VELOCITY')}
            title="Simulates rapid inter-continental hop (>800 km/h)"
          >
            ✈️ Impossible Travel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => triggerForcedScenario('STRUCTURING')}
            title="Simulates $9,800 transfer to evade $10k reporting limit"
          >
            💵 $9.8k Structuring
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => triggerForcedScenario('VELOCITY_BURST')}
            title="Injects 4 rapid transactions within milliseconds"
          >
            ⚡ 4x Velocity Burst
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => triggerForcedScenario('AMOUNT_ZSCORE')}
            title="Triggers extreme deviation from account baseline (+6σ)"
          >
            📈 +6σ Z-Score Spike
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => triggerForcedScenario('NEW_DEVICE')}
            title="Unseen device footprint with Tor browser and high volume"
          >
            🕵️ Tor Device Infiltration
          </button>
        </div>
      </div>

      {/* Main Real-Time Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Live Ingestion Stream */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Layers size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Ingestion Stream
              </h3>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ({liveTxs.length} latest events)
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#dc2626',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                marginLeft: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                Prototype Data Feed
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click row to inspect payload</span>
          </div>

          <div style={{ flex: 1, overflowX: 'auto', maxHeight: '580px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Originator</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Risk Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveTxs.map((tx) => {
                  const isNew = recentNewTxIds.includes(tx.id);
                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTxId(tx.id)}
                      className={isNew ? 'new-row-highlight' : ''}
                    >
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.accountName}</div>
                        <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tx.accountId}</div>
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
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {tx.location.city}
                        </span>
                      </td>
                      <td>
                        <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxId(tx.id);
                          }}
                          style={{ padding: '4px 6px' }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Flagged Alerts Queue Mini-Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color="#dc2626" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Threats Triage
                </h3>
              </div>
              <span className="synthetic-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>Real-Time</span>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '580px', overflowY: 'auto' }}>
              {liveAlerts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No active high-risk alerts at this moment.
                </div>
              ) : (
                liveAlerts.map((alert) => {
                  const isNewAlert = recentNewAlertIds.includes(alert.id);
                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={isNewAlert ? 'new-alert-highlight' : ''}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid',
                        borderColor: alert.riskLevel === 'CRITICAL' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(217, 119, 6, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                        transition: 'transform 0.15s ease, border-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="sm" />
                        <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {alert.accountName}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span className="font-mono">{alert.transactionId}</span>
                        <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          ${alert.transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {alert.triggeredRules.length > 0 && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#dc2626', background: 'rgba(220, 38, 38, 0.08)', padding: '4px 6px', borderRadius: '4px' }}>
                          ⚡ {alert.triggeredRules[0].ruleName}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
