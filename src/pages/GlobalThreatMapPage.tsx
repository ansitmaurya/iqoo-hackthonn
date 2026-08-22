import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  Globe, 
  Radio, 
  Navigation, 
  ArrowRight, 
  Layers,
  ShieldAlert 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';
import { RiskBadge } from '../components/RiskBadge';

interface CityHub {
  city: string;
  country: string;
  lat: number;
  lng: number;
  x: number; // projected canvas x (0 - 1000)
  y: number; // projected canvas y (0 - 500)
  region: 'AMERICAS' | 'EMEA' | 'APAC';
}

const HUBS: CityHub[] = [
  { city: 'San Francisco', country: 'US', lat: 37.7749, lng: -122.4194, x: 165, y: 168, region: 'AMERICAS' },
  { city: 'New York', country: 'US', lat: 40.7128, lng: -74.0060, x: 265, y: 155, region: 'AMERICAS' },
  { city: 'Toronto', country: 'CA', lat: 43.6532, lng: -79.3832, x: 255, y: 140, region: 'AMERICAS' },
  { city: 'Sao Paulo', country: 'BR', lat: -23.5505, lng: -46.6333, x: 330, y: 360, region: 'AMERICAS' },
  { city: 'London', country: 'GB', lat: 51.5074, lng: -0.1278, x: 485, y: 120, region: 'EMEA' },
  { city: 'Frankfurt', country: 'DE', lat: 50.1109, lng: 8.6821, x: 515, y: 125, region: 'EMEA' },
  { city: 'Dubai', country: 'AE', lat: 25.2048, lng: 55.2708, x: 630, y: 200, region: 'EMEA' },
  { city: 'Singapore', country: 'SG', lat: 1.3521, lng: 103.8198, x: 760, y: 275, region: 'APAC' },
  { city: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, x: 865, y: 170, region: 'APAC' },
  { city: 'Sydney', country: 'AU', lat: -33.8688, lng: 151.2093, x: 895, y: 395, region: 'APAC' }
];

// Complete Global Interconnect Mesh connecting all 10 international hubs
const GLOBAL_MESH_ROUTES: [string, string][] = [
  // Trans-Pacific & Americas Hubs
  ['San Francisco', 'New York'],
  ['San Francisco', 'Toronto'],
  ['San Francisco', 'Tokyo'],
  ['San Francisco', 'Sydney'],
  ['New York', 'Toronto'],
  ['New York', 'London'],
  ['New York', 'Sao Paulo'],
  ['New York', 'Frankfurt'],
  ['Toronto', 'London'],
  ['Sao Paulo', 'London'],
  ['Sao Paulo', 'Frankfurt'],
  ['Sao Paulo', 'San Francisco'],
  
  // Trans-Atlantic & EMEA Backbone
  ['London', 'Frankfurt'],
  ['London', 'Dubai'],
  ['London', 'Singapore'],
  ['Frankfurt', 'Dubai'],
  ['Frankfurt', 'Singapore'],
  ['Frankfurt', 'Tokyo'],
  ['Dubai', 'Singapore'],
  ['Dubai', 'Sydney'],
  
  // APAC & Cross-Global Transits
  ['Singapore', 'Tokyo'],
  ['Singapore', 'Sydney'],
  ['Tokyo', 'Sydney'],
  ['Tokyo', 'New York'],
  ['Sydney', 'San Francisco']
];

export const GlobalThreatMapPage: React.FC = () => {
  const { transactions, setSelectedTxId, triggerForcedScenario } = useSentinelStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityHub | null>(null);

  // Compute City Statistics from real synthetic transactions
  const cityStats = useMemo(() => {
    const map = new Map<string, { totalTx: number; flaggedTx: number; totalVolume: number; highestRisk: number }>();
    HUBS.forEach(h => map.set(h.city, { totalTx: 0, flaggedTx: 0, totalVolume: 0, highestRisk: 0 }));

    transactions.forEach(t => {
      const city = t.location.city;
      if (map.has(city)) {
        const stat = map.get(city)!;
        stat.totalTx += 1;
        stat.totalVolume += t.amount;
        if (t.flagged || t.riskScore >= 60) {
          stat.flaggedTx += 1;
          stat.highestRisk = Math.max(stat.highestRisk, t.riskScore);
        }
      }
    });

    return map;
  }, [transactions]);

  // Compute Cross-Border Corridors
  const corridors = useMemo(() => {
    const list: { from: CityHub; to: CityHub; txId: string; amount: number; riskScore: number; ruleName: string }[] = [];

    // Look for impossible travel & high-risk hops in recent transactions
    transactions.slice(0, 100).forEach(t => {
      if (t.riskScore >= 60) {
        const destHub = HUBS.find(h => h.city === t.location.city);
        // Find origin from triggered rule evidence or pick previous hub
        let originHub = HUBS.find(h => t.triggeredRules.some(r => r.evidence?.originCity === h.city || r.evidence?.prevCity === h.city));
        if (!originHub && destHub) {
          originHub = HUBS.find(h => h.city !== destHub.city && (h.city === 'London' || h.city === 'New York' || h.city === 'Singapore' || h.city === 'Tokyo'));
        }

        if (originHub && destHub && originHub.city !== destHub.city) {
          list.push({
            from: originHub,
            to: destHub,
            txId: t.id,
            amount: t.amount,
            riskScore: t.riskScore,
            ruleName: t.triggeredRules[0]?.ruleName || 'Cross-Border Anomaly'
          });
        }
      }
    });

    return list.slice(0, 12);
  }, [transactions]);

  // Canvas World Grid & Flight Trajectory Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Draw World Matrix Grid Background (Cyber Black Matrix)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 0.5;

      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Draw Subtle Continents / Landmass Outlines via stylized polygons
      ctx.fillStyle = 'rgba(20, 26, 40, 0.75)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.2;

      // North America block
      ctx.beginPath();
      ctx.ellipse(220, 150, 120, 70, -0.2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // South America block
      ctx.beginPath();
      ctx.ellipse(320, 340, 60, 90, 0.2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Europe & Middle East block
      ctx.beginPath();
      ctx.ellipse(540, 150, 90, 60, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Africa block
      ctx.beginPath();
      ctx.ellipse(510, 280, 70, 90, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Asia block
      ctx.beginPath();
      ctx.ellipse(750, 160, 130, 80, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Australia block
      ctx.beginPath();
      ctx.ellipse(870, 360, 65, 50, 0.1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // 3. Draw Global Telemetry Interconnect Mesh (All 10 Hubs Connected)
      GLOBAL_MESH_ROUTES.forEach(([fromCity, toCity], idx) => {
        const fromHub = HUBS.find(h => h.city === fromCity);
        const toHub = HUBS.find(h => h.city === toCity);
        if (!fromHub || !toHub) return;

        const sx = (fromHub.x / 1000) * w;
        const sy = (fromHub.y / 500) * h;
        const tx = (toHub.x / 1000) * w;
        const ty = (toHub.y / 500) * h;

        const isHighlighted = (hoveredCity && (hoveredCity.city === fromCity || hoveredCity.city === toCity)) ||
                              (selectedCity && (selectedCity === fromCity || selectedCity === toCity));
        const isDimmed = (hoveredCity || selectedCity) && !isHighlighted;

        const midX = (sx + tx) / 2;
        const midY = Math.min(sy, ty) - 25 - (idx % 4) * 8;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(midX, midY, tx, ty);

        if (isHighlighted) {
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
          ctx.lineWidth = 2.0;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();

        // Animate continuous live telemetry data packets across the global mesh
        if (!isDimmed) {
          const t = ((Date.now() / 3200) + (idx * 0.15)) % 1;
          const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
          const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;

          ctx.beginPath();
          ctx.arc(px, py, isHighlighted ? 2.5 : 1.8, 0, 2 * Math.PI);
          ctx.fillStyle = isHighlighted ? '#00f2fe' : 'rgba(56, 189, 248, 0.75)';
          ctx.fill();
        }
      });

      // 4. Draw Cross-Border Threat Flight Arcs (Dynamic Fraud & Velocity Corridors)
      corridors.forEach((corr, idx) => {
        const sx = (corr.from.x / 1000) * w;
        const sy = (corr.from.y / 500) * h;
        const tx = (corr.to.x / 1000) * w;
        const ty = (corr.to.y / 500) * h;

        // Quadratic curve with control point arching above
        const midX = (sx + tx) / 2;
        const midY = Math.min(sy, ty) - 50 - (idx % 3) * 20;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(midX, midY, tx, ty);
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated traveling photon particle
        const t = ((Date.now() / 2000) + (idx * 0.25)) % 1;
        const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
        const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00f2fe';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Draw City Financial Hub Nodes & Pulsing Beacons
      HUBS.forEach((hub) => {
        const x = (hub.x / 1000) * w;
        const y = (hub.y / 500) * h;
        const stat = cityStats.get(hub.city);
        const hasCritical = stat && stat.highestRisk >= 80;
        const hasWarning = stat && stat.flaggedTx > 0;
        const isHovered = hoveredCity?.city === hub.city;
        const isSelected = selectedCity === hub.city;

        const mainColor = hasCritical ? '#ef4444' : hasWarning ? '#f59e0b' : '#10b981';

        // Pulsating Radar Wave
        const pulseT = (Date.now() % 2000) / 2000;
        const pulseR = 6 + pulseT * 18;
        const pulseAlpha = Math.max(0, 1 - pulseT);

        ctx.beginPath();
        ctx.arc(x, y, pulseR, 0, 2 * Math.PI);
        ctx.strokeStyle = hasCritical ? `rgba(239, 68, 68, ${pulseAlpha})` : `rgba(56, 189, 248, ${pulseAlpha * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, isHovered || isSelected ? 8 : 5, 0, 2 * Math.PI);
        ctx.fillStyle = mainColor;
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = isHovered || isSelected ? 14 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = isSelected ? '#38bdf8' : (hasCritical ? '#fca5a5' : '#f1f5f9');
        ctx.font = isSelected || isHovered ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${hub.city}`, x, y + 16);

        if (stat && stat.flaggedTx > 0) {
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillText(`⚠ ${stat.flaggedTx} alerts`, x, y + 27);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [corridors, cityStats, hoveredCity, selectedCity]);

  // Handle Canvas Mouse Move / Click
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 1000;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 500;

    const hit = HUBS.find(h => {
      const dx = h.x - mouseX;
      const dy = h.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= 25;
    });

    setHoveredCity(hit || null);
    canvas.style.cursor = hit ? 'pointer' : 'default';
  };

  const handleCanvasClick = () => {
    if (hoveredCity) {
      setSelectedCity(hoveredCity.city === selectedCity ? null : hoveredCity.city);
    } else {
      setSelectedCity(null);
    }
  };

  // City-specific transactions
  const cityTransactions = useMemo(() => {
    if (!selectedCity) return transactions.slice(0, 10);
    return transactions.filter(t => t.location.city === selectedCity).slice(0, 10);
  }, [transactions, selectedCity]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <SyntheticDataBanner />

      {/* Global View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={22} color="var(--accent-cyan)" />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Global Threat Matrix & Impossible Travel Map
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Live geospatial telemetry correlating international fund hops, impossible speed vectors (&gt;800 km/h), and proxy gateways.
          </p>
        </div>

        {/* Global Fast Trigger Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => triggerForcedScenario('GEO_VELOCITY')}
          >
            <Navigation size={13} color="var(--accent-cyan)" />
            <span>Simulate Impossible Travel Hop</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedCity(null)}
          >
            <Radio size={13} color="#059669" />
            <span>Show All Hubs ({HUBS.length})</span>
          </button>
        </div>
      </div>

      {/* Regional Threat Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {['AMERICAS', 'EMEA', 'APAC'].map((regionKey) => {
          const regionHubs = HUBS.filter(h => h.region === regionKey);
          const regionTxs = transactions.filter(t => regionHubs.some(h => h.city === t.location.city));
          const flaggedCount = regionTxs.filter(t => t.flagged || t.riskScore >= 60).length;
          const totalVol = regionTxs.reduce((sum, t) => sum + t.amount, 0);

          return (
            <div key={regionKey} className="cyber-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {regionKey} Geozone Telemetry
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: flaggedCount > 5 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                  color: flaggedCount > 5 ? '#dc2626' : '#059669'
                }}>
                  {flaggedCount > 5 ? 'ELEVATED RISK' : 'NORMAL'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {regionTxs.length}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Events Tracked</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>⚠ {flaggedCount} Anomalies</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>${(totalVol / 1000).toFixed(0)}k Volume</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Map Viewport: Sleek Cyber Black Matrix */}
      <div className="glass-panel" style={{
        position: 'relative',
        overflow: 'hidden',
        height: '480px',
        background: 'radial-gradient(circle at 50% 50%, #0a0e18 0%, #000000 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
      }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={500}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Map Overlay Badge: Translucent Black Glass */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(8, 10, 15, 0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '11px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={13} color="var(--accent-cyan)" />
            <span>Global Geodesic Vector Radar</span>
          </div>
          <div style={{ color: '#94a3b8' }}>
            Dotted arcs indicate intercontinental velocity transfers with active photon routing.
          </div>
        </div>

        {/* Selected Hub Inspector Pill */}
        {selectedCity && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            background: 'rgba(8, 10, 15, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 0 24px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>
                📍 Hub: {selectedCity}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {cityStats.get(selectedCity)?.totalTx || 0} Events • {cityStats.get(selectedCity)?.flaggedTx || 0} Flagged
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedCity(null)}
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Two Column Section: Live Cross-Border Corridors & City Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Active Threat Corridors List */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} color="#dc2626" />
            <span>Active Cross-Border Risk Corridors ({corridors.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {corridors.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No active cross-border threat corridors detected.
              </div>
            ) : (
              corridors.map((corr, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTxId(corr.txId)}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span>{corr.from.city}</span>
                      <ArrowRight size={14} color="var(--accent-cyan)" />
                      <span>{corr.to.city}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: 500 }}>
                      ⚡ {corr.ruleName}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${corr.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <RiskBadge level={corr.riskScore >= 80 ? 'CRITICAL' : 'HIGH'} score={corr.riskScore} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Hub Telemetry Table */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--accent-cyan)" />
              <span>{selectedCity ? `Recent Telemetry: ${selectedCity}` : 'Global Real-Time Feed'}</span>
            </div>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {cityTransactions.length} Events
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {cityTransactions.map(tx => (
              <div
                key={tx.id}
                onClick={() => setSelectedTxId(tx.id)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{tx.accountName}</div>
                  <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {tx.id} • {tx.location.city}, {tx.location.country}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" showScore={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
