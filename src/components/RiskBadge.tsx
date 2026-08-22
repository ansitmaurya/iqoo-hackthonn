import React from 'react';
import type { RiskLevel } from '../types';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<Props> = ({ level, score, showScore = true, size = 'md' }) => {
  let bg = 'var(--risk-low-bg)';
  let color = 'var(--risk-low)';
  let borderColor = 'rgba(16, 185, 129, 0.3)';
  let Icon = ShieldCheck;

  if (level === 'CRITICAL') {
    bg = 'var(--risk-critical-bg)';
    color = 'var(--risk-critical)';
    borderColor = 'rgba(239, 68, 68, 0.45)';
    Icon = ShieldAlert;
  } else if (level === 'HIGH') {
    bg = 'var(--risk-high-bg)';
    color = 'var(--risk-high)';
    borderColor = 'rgba(249, 115, 22, 0.4)';
    Icon = AlertTriangle;
  } else if (level === 'MEDIUM') {
    bg = 'var(--risk-medium-bg)';
    color = 'var(--risk-medium)';
    borderColor = 'rgba(245, 158, 11, 0.35)';
    Icon = Shield;
  }

  const padding = size === 'sm' ? '2px 6px' : size === 'lg' ? '6px 14px' : '4px 10px';
  const fontSize = size === 'sm' ? '10px' : size === 'lg' ? '13px' : '11px';
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 13;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        borderRadius: '9999px',
        padding,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
        boxShadow: level === 'CRITICAL' ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
        whiteSpace: 'nowrap'
      }}
    >
      <Icon size={iconSize} />
      <span>{level}</span>
      {showScore && score !== undefined && (
        <span style={{
          background: 'rgba(15, 23, 42, 0.08)',
          padding: '1px 5px',
          borderRadius: '4px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.9em'
        }}>
          {score}
        </span>
      )}
    </span>
  );
};
