import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Zap, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ChevronDown,
  Clock,
  Calendar,
  Send,
  Database
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import type { ForceScenario } from '../engine/simulator';

export const Header: React.FC = () => {
  const {
    isSimulating,
    simulationSpeed,
    audioEnabled,
    isApiConnected,
    startSimulation,
    stopSimulation,
    setSimulationSpeed,
    triggerForcedScenario,
    resetToDefaultSeeds,
    toggleAudio,
    getMetrics,
    setIsIngestModalOpen
  } = useSentinelStore();

  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const metrics = getMetrics();

  // Live ticking date and time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleScenarioClick = (scenario: ForceScenario) => {
    triggerForcedScenario(scenario);
    setShowScenarioMenu(false);
  };

  // Format date and time
  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header style={{
      height: '68px',
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      zIndex: 50,
      position: 'relative',
      boxShadow: '0 1px 10px rgba(15, 23, 42, 0.04)'
    }}>
      {/* Left: Stream Engine Status & Live Backend Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isSimulating ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: isSimulating ? '1.5px solid #6ee7b7' : '1.5px solid #fcd34d',
          borderRadius: '8px',
          padding: '6px 12px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
        }}>
          <span className={isSimulating ? 'live-pulse' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSimulating ? '#059669' : '#d97706' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: isSimulating ? '#065f46' : '#92400e', letterSpacing: '0.5px' }}>
            {isSimulating ? 'SOC ACTIVE' : 'SOC PAUSED'}
          </span>
        </div>

        {/* Backend API Connection Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isApiConnected ? 'rgba(2, 132, 199, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          border: `1px solid ${isApiConnected ? 'rgba(2, 132, 199, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          borderRadius: '8px',
          padding: '5px 10px',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono'
        }}>
          <Database size={13} color={isApiConnected ? '#0284c7' : '#d97706'} />
          <span style={{ color: isApiConnected ? '#0284c7' : '#d97706', fontWeight: 700 }}>
            {isApiConnected ? 'API: POSTGRES LIVE' : 'API: IN-MEMORY'}
          </span>
        </div>

        {/* Live Date & Time HUD */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '5px 12px',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono',
          color: '#334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: 700 }}>
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <Clock size={12} color="#0284c7" />
            <span style={{ color: '#0f172a' }}>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Right: Controls & Ingest Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Stream Metrics Pill */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '8px',
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Throughput: </span>
            <span style={{ color: '#0284c7', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>{metrics.tps} TPS</span>
          </div>
          <div style={{ width: '1px', height: '12px', background: '#bfdbfe' }} />
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Fraud Rate: </span>
            <span style={{ color: metrics.fraudRate > 8 ? 'var(--risk-critical)' : '#059669', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
              {metrics.fraudRate}%
            </span>
          </div>
        </div>

        {/* Live Ingest Transaction Action Button */}
        <button
          onClick={() => setIsIngestModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 14px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Send size={13} />
          <span>Ingest Transaction</span>
        </button>

        {/* Play/Pause Button */}
        <button 
          className={`btn ${isSimulating ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => isSimulating ? stopSimulation() : startSimulation()}
          title={isSimulating ? 'Pause Synthetic Stream' : 'Resume Synthetic Stream'}
          style={{ fontWeight: 800, padding: '7px 12px', fontSize: '11px' }}
        >
          {isSimulating ? <Pause size={13} /> : <Play size={13} />}
          <span>{isSimulating ? 'Pause' : 'Stream'}</span>
        </button>

        {/* Speed Selector */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '6px',
          padding: '2px'
        }}>
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setSimulationSpeed(speed)}
              style={{
                background: simulationSpeed === speed ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
                color: simulationSpeed === speed ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '3px 7px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Quick Demo Scenario Trigger Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            style={{ borderColor: 'var(--border-highlight)', fontWeight: 800, padding: '7px 10px', fontSize: '11px' }}
          >
            <Zap size={13} color="#0284c7" />
            <span>Anomaly</span>
            <ChevronDown size={12} />
          </button>

          {showScenarioMenu && (
            <div style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: '260px',
              background: '#ffffff',
              border: '1px solid var(--border-highlight)',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
              padding: '6px',
              zIndex: 100
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 10px', textTransform: 'uppercase' }}>
                Simulate Fraud Scenario
              </div>
              <button
                onClick={() => handleScenarioClick('GEO_VELOCITY')}
                style={scenarioItemStyle}
              >
                <span>🚀 Impossible Travel (&gt;800 km/h)</span>
              </button>
              <button
                onClick={() => handleScenarioClick('STRUCTURING')}
                style={scenarioItemStyle}
              >
                <span>💵 Structuring ($9,800 Smurfing)</span>
              </button>
              <button
                onClick={() => handleScenarioClick('VELOCITY_BURST')}
                style={scenarioItemStyle}
              >
                <span>⚡ 4x Rapid Velocity Burst</span>
              </button>
              <button
                onClick={() => handleScenarioClick('AMOUNT_ZSCORE')}
                style={scenarioItemStyle}
              >
                <span>📈 Z-Score Amount Spike (+6σ)</span>
              </button>
              <button
                onClick={() => handleScenarioClick('NEW_DEVICE')}
                style={scenarioItemStyle}
              >
                <span>🕵️ Unrecognized Tor Device</span>
              </button>
              <button
                onClick={() => handleScenarioClick('OFF_HOURS')}
                style={scenarioItemStyle}
              >
                <span>🌙 Nocturnal High-Risk Crypto</span>
              </button>
            </div>
          )}
        </div>

        {/* Audio Toggle */}
        <button
          className="btn btn-ghost"
          onClick={toggleAudio}
          title={audioEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio Chime'}
          style={{ padding: '6px' }}
        >
          {audioEnabled ? <Volume2 size={16} color="#0284c7" /> : <VolumeX size={16} />}
        </button>

        {/* Reset State Button */}
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('Reset all synthetic data to initial seed baseline?')) {
              resetToDefaultSeeds();
            }
          }}
          title="Reset to Initial Synthetic Seeds"
          style={{ padding: '6px' }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
};

const scenarioItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  padding: '8px 10px',
  color: 'var(--text-primary)',
  fontSize: '12px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  transition: 'background 0.15s'
};
