import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Layers, 
  Share2, 
  Globe, 
  BarChart3, 
  ShieldAlert, 
  FileText, 
  UserCheck, 
  Cpu
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';

interface NavItem {
  id: 'live' | 'alerts' | 'transactions' | 'network' | 'global' | 'investigations' | 'analytics' | 'audit';
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeType?: 'danger' | 'warning' | 'info';
}

interface SidebarProps {
  onReplayIntro?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onReplayIntro }) => {
  const { 
    activeTab, 
    setActiveTab, 
    alerts, 
    investigations 
  } = useSentinelStore();

  const openAlertsCount = alerts.filter(a => a.status === 'OPEN' || a.status === 'IN_REVIEW').length;
  const criticalCount = alerts.filter(a => a.riskLevel === 'CRITICAL' && (a.status === 'OPEN' || a.status === 'IN_REVIEW')).length;
  const activeInvestigations = investigations.filter(i => i.status !== 'CLOSED').length;

  const navItems: NavItem[] = [
    {
      id: 'live',
      label: 'Live Monitoring',
      icon: Activity
    },
    {
      id: 'network',
      label: 'Network Topology',
      icon: Share2
    },
    {
      id: 'global',
      label: 'Global Threat Map',
      icon: Globe
    },
    {
      id: 'alerts',
      label: 'Alerts Queue',
      icon: AlertTriangle,
      badge: openAlertsCount,
      badgeType: criticalCount > 0 ? 'danger' : 'warning'
    },
    {
      id: 'transactions',
      label: 'Transaction Explorer',
      icon: Layers
    },
    {
      id: 'investigations',
      label: 'Investigations & SAR',
      icon: ShieldAlert,
      badge: activeInvestigations,
      badgeType: 'info'
    },
    {
      id: 'analytics',
      label: 'Analytics & Models',
      icon: BarChart3
    },
    {
      id: 'audit',
      label: 'SOC Audit Log',
      icon: FileText
    }
  ];

  return (
    <aside style={{
      width: '240px',
      position: 'relative',
      overflow: 'hidden',
      borderRight: '1px solid #bfdbfe',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 14px',
      userSelect: 'none',
      boxShadow: '4px 0 20px rgba(2, 132, 199, 0.08)'
    }}>
      {/* Dynamic Animated Moving Cyber Background */}
      <div className="sidebar-animated-bg">
        <div className="sidebar-grid-pattern" />
        <div className="sidebar-orb sidebar-orb-1" />
        <div className="sidebar-orb sidebar-orb-2" />
        <div className="sidebar-orb sidebar-orb-3" />
        <div className="sidebar-scanline" />
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Project Branding Header at Top of Sidebar (Clickable to Replay Intro) */}
        <div 
          onClick={onReplayIntro}
          title="Click to replay cinematic boot intro"
          style={{
            padding: '0 8px 16px',
            marginBottom: '14px',
            borderBottom: '1.5px solid rgba(191, 219, 254, 0.8)',
            cursor: onReplayIntro ? 'pointer' : 'default',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 12px rgba(2, 132, 199, 0.45)'
            }}>
              <Activity color="#ffffff" size={20} strokeWidth={2.6} />
            </div>
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '1px',
                background: 'linear-gradient(90deg, #0f172a 20%, #0284c7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: '1.2'
              }}>
                TRACEGUARD
              </div>
              <div style={{
                fontSize: '10px',
                color: '#0284c7',
                letterSpacing: '0.5px',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                Advanced Fraud Intel
              </div>
            </div>
          </div>
        </div>

        {/* Section Title: Bold Highlighted */}
        <div style={{
          fontSize: '11px',
          fontWeight: 800,
          color: '#0284c7',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          padding: '0 12px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
          <span>SOC Operations</span>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-highlight)' : 'transparent',
                  background: isActive ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.45)',
                  backdropFilter: 'blur(6px)',
                  color: isActive ? '#0284c7' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 800 : 600,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} color={isActive ? '#0284c7' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono',
                    background: item.badgeType === 'danger' ? 'var(--risk-critical-bg)' : item.badgeType === 'warning' ? 'var(--risk-medium-bg)' : 'rgba(37, 99, 235, 0.12)',
                    color: item.badgeType === 'danger' ? 'var(--risk-critical)' : item.badgeType === 'warning' ? 'var(--risk-medium)' : '#2563eb',
                    border: `1px solid ${item.badgeType === 'danger' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(37, 99, 235, 0.25)'}`
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SOC Analyst Station Info Footer */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #bfdbfe',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <UserCheck size={14} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Analyst Sarah</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SecOps Triage Level 3</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid #dbeafe',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Cpu size={12} color="#059669" /> 7 Rules Active
          </span>
          <span style={{ color: '#db2777', fontWeight: 700 }}>SYNTHETIC</span>
        </div>
      </div>
    </aside>
  );
};
