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
  Calendar
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import type { ForceScenario } from '../engine/simulator';

export const Header: React.FC = () => {
  const {
    isSimulating,
    simulationSpeed,
    audioEnabled,
    startSimulation,
    stopSimulation,
    setSimulationSpeed,
    triggerForcedScenario,
    resetToDefaultSeeds,
    toggleAudio,
    getMetrics
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

  const formattedUtcTime = currentDateTime.toISOString().substring(11, 19) + ' UTC';

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
      {/* Left: Stream Engine Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: isSimulating ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: isSimulating ? '1.5px solid #6ee7b7' : '1.5px solid #fcd34d',
          borderRadius: '8px',
          padding: '7px 14px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
        }}>
          <span className={isSimulating ? 'live-pulse' : ''} style={{ width: '9px', height: '9px', borderRadius: '50%', background: isSimulating ? '#059669' : '#d97706' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: isSimulating ? '#065f46' : '#92400e', letterSpacing: '0.5px' }}>
            {isSimulating ? '⚡ SOC ENGINE: ACTIVE' : '⏸ SOC ENGINE: PAUSED'}
          </span>
          <span style={{
            fontSize: '10px',
            color: '#0284c7',
            background: 'rgba(2, 132, 199, 0.14)',
            padding: '2px 7px',
            borderRadius: '4px',
            fontWeight: 800,
            fontFamily: 'JetBrains Mono',
            marginLeft: '4px',
            border: '1px solid rgba(2, 132, 199, 0.25)'
          }}>
            PRO v2.4
          </span>
        </div>
      </div>

      {/* Center: Live Date & Time Clock Widget (Bold Highlighted) */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #93c5fd',
        borderRadius: '8px',
        padding: '5px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(2, 132, 199, 0.08)'
      }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)' }}>
          <Calendar size={13} color="#0284c7" strokeWidth={2.2} />
          <span style={{ fontWeight: 700 }}>{formattedDate}</span>
        </div>

        <div style={{ width: '1.5px', height: '14px', background: '#bfdbfe' }} />

        {/* Local Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} color="#059669" strokeWidth={2.2} />
          <span className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
            {formattedTime}
          </span>
        </div>

        <div style={{ width: '1.5px', height: '14px', background: '#bfdbfe' }} />

        {/* UTC Time Tag */}
        <div className="font-mono" style={{
          fontSize: '10px',
          color: '#0284c7',
          background: 'rgba(2, 132, 199, 0.12)',
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid rgba(2, 132, 199, 0.3)',
          fontWeight: 800
        }}>
          {formattedUtcTime}
        </div>
      </div>

      {/* Right: Simulator Stream Control Center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Stream Metrics Pill */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #93c5fd',
          borderRadius: '8px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Throughput: </span>
            <span style={{ color: '#0284c7', fontWeight: 800, fontFamily: 'JetBrains Mono', fontSize: '13px' }}>{metrics.tps} TPS</span>
          </div>
          <div style={{ width: '1.5px', height: '14px', background: '#bfdbfe' }} />
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Fraud Rate: </span>
            <span style={{ color: metrics.fraudRate > 8 ? 'var(--risk-critical)' : '#059669', fontWeight: 800, fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
              {metrics.fraudRate}%
            </span>
          </div>
        </div>

        {/* Play/Pause Button */}
        <button 
          className={`btn ${isSimulating ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => isSimulating ? stopSimulation() : startSimulation()}
          title={isSimulating ? 'Pause Synthetic Stream' : 'Resume Synthetic Stream'}
          style={{ fontWeight: 800 }}
        >
          {isSimulating ? <Pause size={15} /> : <Play size={15} />}
          <span>{isSimulating ? 'Pause Stream' : 'Run Stream'}</span>
        </button>

        {/* Speed Selector */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          border: '1.5px solid #93c5fd',
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
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: simulationSpeed === speed ? '0 1px 4px rgba(2, 132, 199, 0.3)' : 'none'
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
            style={{ borderColor: 'var(--border-highlight)', fontWeight: 800 }}
          >
            <Zap size={14} color="#0284c7" />
            <span>Inject Anomaly</span>
            <ChevronDown size={13} />
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
          style={{ padding: '8px' }}
        >
          {audioEnabled ? <Volume2 size={18} color="#0284c7" /> : <VolumeX size={18} />}
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
          style={{ padding: '8px' }}
        >
          <RotateCcw size={16} />
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
