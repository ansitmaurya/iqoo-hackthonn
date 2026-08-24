import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

interface Props {
  compact?: boolean;
  message?: string;
}

export const SyntheticDataBanner: React.FC<Props> = ({ 
  compact = false, 
  message = "PROTOTYPE DATA FEED: All transactions, threat telemetry, and risk scores displayed here are dynamically generated synthetic simulation data for evaluation purposes." 
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compact ? '4px 12px' : '7px 16px',
        backgroundColor: 'rgba(239, 68, 68, 0.07)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderLeft: '4px solid #ef4444',
        borderRadius: '6px',
        color: '#b91c1c',
        fontSize: compact ? '11px' : '12px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        boxShadow: '0 1px 4px rgba(239, 68, 68, 0.08)',
        lineHeight: 1.4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px #ef4444',
              animation: 'pulse 1.8s infinite',
            }}
          />
          <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
          <span
            style={{
              textTransform: 'uppercase',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#dc2626',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            Prototype Mode
          </span>
        </div>

        <span style={{ color: '#991b1b', fontSize: compact ? '11px' : '12px' }}>
          {message}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#dc2626',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          marginLeft: '12px',
        }}
      >
        <Activity size={12} color="#dc2626" />
        <span>Simulated Stream</span>
      </div>
    </div>
  );
};
