import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  User 
} from 'lucide-react';
import { useSentinelStore } from '../store/useSentinelStore';
import type { RiskLevel } from '../types';
import { SyntheticDataBanner } from '../components/SyntheticDataBanner';
import { RiskBadge } from '../components/RiskBadge';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isMule: boolean;
  degree: number;
}

interface GraphLink {
  source: string;
  target: string;
  amount: number;
  count: number;
  riskScore: number;
}

export const NetworkVisualizationPage: React.FC = () => {
  const { accounts, transactions, setSelectedAccountId } = useSentinelStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightMulesOnly, setHighlightMulesOnly] = useState<boolean>(false);

  // Build Graph Nodes & Links from real state
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkMap = new Map<string, GraphLink>();

    // Take top 42 most active accounts for clear, responsive graph topology
    const activeAccounts = accounts.slice(0, 42);

    activeAccounts.forEach((acc, idx) => {
      const angle = (idx / activeAccounts.length) * 2 * Math.PI;
      const dist = acc.type === 'MULE_SUSPECT' ? 160 + Math.random() * 80 : 260 + Math.random() * 140;
      const isMule = acc.type === 'MULE_SUSPECT' || acc.riskScore >= 75;

      nodeMap.set(acc.id, {
        id: acc.id,
        name: acc.ownerName,
        type: acc.type,
        riskScore: acc.riskScore,
        riskLevel: acc.riskScore >= 80 ? 'CRITICAL' : acc.riskScore >= 60 ? 'HIGH' : acc.riskScore >= 35 ? 'MEDIUM' : 'LOW',
        status: acc.status,
        x: Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: isMule ? 14 : (acc.type === 'BUSINESS' || acc.type === 'MERCHANT' ? 12 : 9),
        isMule,
        degree: 0
      });
    });

    // Build links from transactions between these accounts
    transactions.slice(0, 300).forEach(tx => {
      if (tx.recipientId && nodeMap.has(tx.accountId) && nodeMap.has(tx.recipientId)) {
        const linkKey = `${tx.accountId}->${tx.recipientId}`;
        if (linkMap.has(linkKey)) {
          const l = linkMap.get(linkKey)!;
          l.amount += tx.amount;
          l.count += 1;
          l.riskScore = Math.max(l.riskScore, tx.riskScore);
        } else {
          linkMap.set(linkKey, {
            source: tx.accountId,
            target: tx.recipientId,
            amount: tx.amount,
            count: 1,
            riskScore: tx.riskScore
          });
        }

        const srcNode = nodeMap.get(tx.accountId);
        const tgtNode = nodeMap.get(tx.recipientId);
        if (srcNode) srcNode.degree += 1;
        if (tgtNode) tgtNode.degree += 1;
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values())
    };
  }, [accounts, transactions]);

  // Physics simulation loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Center origin and apply Pan & Zoom
      ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      // 1. Draw Links
      links.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        if (!src || !tgt) return;

        const isHighRisk = link.riskScore >= 60 || src.isMule || tgt.isMule;
        const isDimmed = highlightMulesOnly && !isHighRisk;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (isHighRisk) {
          ctx.strokeStyle = isDimmed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(248, 113, 113, 0.75)';
          ctx.lineWidth = 2.0;
        } else {
          ctx.strokeStyle = isDimmed ? 'rgba(59, 130, 246, 0.12)' : 'rgba(96, 165, 250, 0.35)';
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();

        // Draw small flow particle if high risk
        if (isHighRisk && !isDimmed) {
          const t = (Date.now() / 1800) % 1;
          const px = src.x + (tgt.x - src.x) * t;
          const py = src.y + (tgt.y - src.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#ff4b4b';
          ctx.shadowColor = '#ff4b4b';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 2. Draw Nodes
      nodes.forEach(node => {
        const isDimmed = highlightMulesOnly && !node.isMule;
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Glow ring for Mule / High Risk
        if (node.isMule && !isDimmed) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 7, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Main Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);

        if (node.isMule) {
          ctx.fillStyle = isDimmed ? 'rgba(239, 68, 68, 0.25)' : '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = isDimmed ? 0 : 10;
        } else if (node.riskScore >= 60) {
          ctx.fillStyle = isDimmed ? 'rgba(249, 115, 22, 0.25)' : '#f97316';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = isDimmed ? 0 : 8;
        } else if (node.type === 'BUSINESS' || node.type === 'MERCHANT') {
          ctx.fillStyle = isDimmed ? 'rgba(59, 130, 246, 0.25)' : '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = isDimmed ? 0 : 6;
        } else {
          ctx.fillStyle = isDimmed ? 'rgba(16, 185, 129, 0.25)' : '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = isDimmed ? 0 : 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Border outline
        ctx.strokeStyle = isSelected ? '#00f2fe' : (isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.85)');
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Node Label
        if (zoom > 0.85 || isHovered || isSelected || node.isMule) {
          ctx.fillStyle = isDimmed ? 'rgba(148, 163, 184, 0.3)' : (node.isMule ? '#fca5a5' : '#f1f5f9');
          ctx.font = isHovered || isSelected ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.name.split(' ')[0], node.x, node.y + node.radius + 13);
        }
      });

      ctx.restore();

      // Subtle orbital physics drift
      nodes.forEach(n => {
        n.x += (Math.random() - 0.5) * 0.15;
        n.y += (Math.random() - 0.5) * 0.15;
      });

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrameId);
  }, [nodes, links, zoom, pan, hoveredNode, selectedNode, highlightMulesOnly]);

  // Handle Mouse Pan & Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hit test nodes
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvas.width / 2 - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - canvas.height / 2 - pan.y) / zoom;

    const hit = nodes.find(n => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNode(hit || null);
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      
      <SyntheticDataBanner />

      {/* Header & Controls Bar */}
      <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Share2 size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Synthetic Fraud Ring & Money Mule Network Topology
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Interactive entity-relationship graph highlighting smurfing clusters and high-velocity fund routing.
            </div>
          </div>
        </div>

        {/* View & Filter Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={highlightMulesOnly}
              onChange={(e) => setHighlightMulesOnly(e.target.checked)}
            />
            <span>Highlight Mule Rings Only</span>
          </label>

          <div style={{ display: 'flex', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset View">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Area & Node Inspector Split View */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr', gap: '16px', minHeight: 0 }}>
        
        {/* Canvas Graph Viewport: Sleek Cyber Black Theme */}
        <div className="glass-panel" style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, #0a0e18 0%, #000000 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
        }}>
          <canvas
            ref={canvasRef}
            width={1200}
            height={700}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Graph Legend Overlay: Translucent Black Glass */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(8, 10, 15, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Topology Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
              <span style={{ color: '#fca5a5', fontWeight: 600 }}>Mule Suspect Cluster</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              <span style={{ color: '#bae6fd', fontWeight: 600 }}>Merchant / Corporate Hub</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ color: '#a7f3d0', fontWeight: 600 }}>Standard Consumer</span>
            </div>
          </div>
        </div>

        {/* Selected Node Profile Drawer */}
        {selectedNode && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Inspected Node
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedNode(null)} style={{ padding: '2px' }}>
                ✕
              </button>
            </div>

            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedNode.name}
              </div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                {selectedNode.id} • {selectedNode.type}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Risk Rating:</span>
              <RiskBadge level={selectedNode.riskLevel} score={selectedNode.riskScore} size="md" />
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Network Degree:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedNode.degree} Connections</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Status:</span>
                <span style={{ fontWeight: 700, color: selectedNode.status === 'FROZEN' ? '#dc2626' : '#059669' }}>{selectedNode.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Syndicate Flag:</span>
                <span style={{ fontWeight: 700, color: selectedNode.isMule ? '#dc2626' : '#64748b' }}>
                  {selectedNode.isMule ? 'Confirmed Mule Pattern' : 'Normal Node'}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setSelectedAccountId(selectedNode.id)}
            >
              <User size={14} />
              <span>Open Full Account Profile</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
