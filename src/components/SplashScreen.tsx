import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Shield, 
  Sparkles, 
  ArrowRight,
  Zap,
  Activity,
  Cpu,
  Lock,
  Radio,
  CheckCircle2
} from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  isReplay?: boolean;
}

const FULL_TITLE = 'TRACEGUARD';

const checkReducedMotion = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isReplay = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Stages: 
  // 0: Initial ambient atmosphere fade-in
  // 1: Brand Hologram & Title reveal
  // 2: Neural topology nodes & Link synthesis
  // 3: Radar/Scanline sweep & Engine armed confirmation (stays active until button clicked)
  const [stage, setStage] = useState<number>(() => (checkReducedMotion() ? 3 : 0));
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [typedTitle, setTypedTitle] = useState<string>(() => (checkReducedMotion() ? FULL_TITLE : ''));
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState<boolean>(checkReducedMotion);

  // Transitions to dashboard ONLY when user triggers initiate core
  const handleInitiateCore = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 650);
  }, [isExiting, onComplete]);

  // Listen to prefers-reduced-motion changes dynamically
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Parallax tracking with gentle mouse interpolation
  const handleMouseMove = (e: React.MouseEvent) => {
    if (reducedMotion) return;
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePos({
      x: (clientX - centerX) / centerX,
      y: (clientY - centerY) / centerY
    });
  };

  // Choreographed Stage Progression (Brings all systems online, then awaits user launch)
  useEffect(() => {
    if (reducedMotion) return;

    // Stage 0 -> 1: Brand Hologram (at 600ms)
    const t1 = setTimeout(() => {
      setStage(1);
    }, 600);

    // Stage 1 -> 2: Topology Synthesis (at 1900ms)
    const t2 = setTimeout(() => {
      setStage(2);
    }, 1900);

    // Stage 2 -> 3: Radar Sweep & Systems Ready (at 3400ms)
    const t3 = setTimeout(() => {
      setStage(3);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion]);

  // Typewriter title effect when stage >= 1
  useEffect(() => {
    if (stage < 1 || reducedMotion) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= FULL_TITLE.length) {
        setTypedTitle(FULL_TITLE.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 75);

    return () => clearInterval(interval);
  }, [stage, reducedMotion]);

  // Canvas Background & Network Node Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Topology nodes structured similarly to NetworkVisualizationPage
    const nodeCount = 42;
    const nodes = Array.from({ length: nodeCount }, (_, i) => {
      const isHub = i % 7 === 0;
      const isCritical = i === 3 || i === 11 || i === 27 || i === 35;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: isHub ? 5.5 : isCritical ? 4.5 : 2.5,
        isHub,
        isCritical,
        alpha: Math.random() * 0.5 + 0.3,
        pulseOffset: Math.random() * Math.PI * 2
      };
    });

    let radarAngle = 0;
    let sweepY = 0;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Radial Gradient Background
      const radialGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        80,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      radialGrad.addColorStop(0, '#0a192f');
      radialGrad.addColorStop(0.55, '#040d1a');
      radialGrad.addColorStop(1, '#010409');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Cybersecurity Coordinate Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Ambient Graph Nodes & Synaptic Links (staggered alpha growth)
      const graphReveal = Math.min(1, Math.max(0, (elapsed - 0.6) / 1.6));

      if (graphReveal > 0) {
        // Draw connecting links
        ctx.lineWidth = 0.8;
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 160) {
              const linkAlpha = (1 - dist / 160) * 0.22 * graphReveal;
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              if (n1.isCritical || n2.isCritical) {
                ctx.strokeStyle = `rgba(239, 68, 68, ${linkAlpha * 1.5})`;
              } else {
                ctx.strokeStyle = `rgba(2, 132, 199, ${linkAlpha})`;
              }
              ctx.stroke();

              // High-risk transaction particle
              if ((n1.isCritical || n2.isCritical) && dist < 120) {
                const packetT = ((elapsed * 0.6) + (i * 0.1)) % 1;
                const px = n1.x + (n2.x - n1.x) * packetT;
                const py = n1.y + (n2.y - n1.y) * packetT;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(248, 113, 113, ${linkAlpha * 2})`;
                ctx.fill();
              }
            }
          }
        }

        // Draw nodes
        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;

          const pulse = Math.sin(elapsed * 2 + n.pulseOffset) * 0.3 + 0.7;

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

          if (n.isCritical) {
            ctx.fillStyle = `rgba(239, 68, 68, ${n.alpha * graphReveal * pulse})`;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
          } else if (n.isHub) {
            ctx.fillStyle = `rgba(0, 242, 254, ${n.alpha * graphReveal * pulse})`;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 12;
          } else {
            ctx.fillStyle = `rgba(56, 189, 248, ${n.alpha * graphReveal * 0.8})`;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 4;
          }

          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // 4. Subtle Continuous Radar Sweep Cone
      if (elapsed > 1.8) {
        radarAngle += 0.02;
        const centerX = width / 2;
        const centerY = height / 2;
        const radarRadius = Math.max(width, height) * 0.65;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radarRadius, radarAngle, radarAngle + 0.28);
        ctx.closePath();

        const sweepGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radarRadius);
        sweepGrad.addColorStop(0, 'rgba(0, 242, 254, 0.07)');
        sweepGrad.addColorStop(0.8, 'rgba(0, 242, 254, 0.02)');
        sweepGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();
      }

      // 5. Subtle Horizontal Scanline
      sweepY = (sweepY + 2.0) % height;
      const scanGrad = ctx.createLinearGradient(0, sweepY - 20, 0, sweepY + 20);
      scanGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      scanGrad.addColorStop(0.5, 'rgba(0, 242, 254, 0.12)');
      scanGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, sweepY - 20, width, 40);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div 
      onMouseMove={handleMouseMove}
      role="region"
      aria-label="TraceGuard Cinematic Startup Sequence"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#010409',
        color: '#f8fafc',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), filter 0.65s ease',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.06)' : 'scale(1)',
        filter: isExiting ? 'blur(6px)' : 'none',
        pointerEvents: isExiting ? 'none' : 'auto'
      }}
    >
      {/* Background Layer (Canvas) with Parallax Depth 1 */}
      <div style={{
        position: 'absolute',
        inset: -20,
        transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)`,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>

      {/* Parallax Depth Layer 2: HUD Corner Telemetry Accents */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        transform: `translate(${mousePos.x * 6}px, ${mousePos.y * 6}px)`,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 10
      }}>
        {/* Top Left: System Classification */}
        <div style={{
          position: 'absolute',
          top: 28,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          opacity: stage >= 0 ? 1 : 0,
          transition: 'opacity 0.8s ease'
        }}>
          <div style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: '#00f2fe',
            boxShadow: '0 0 12px #00f2fe'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="font-mono" style={{ fontSize: '11px', color: '#38bdf8', letterSpacing: '1.2px', fontWeight: 800 }}>
              TRACEGUARD // SEC-OPS DEFENSE LEVEL 5
            </span>
            <span className="font-mono" style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.8px' }}>
              SENTINEL NEURAL KERNEL READY
            </span>
          </div>
        </div>

        {/* Top Right: Protocol Stream & Mode */}
        <div style={{
          position: 'absolute',
          top: 28,
          right: 32,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          opacity: stage >= 1 ? 1 : 0,
          transition: 'opacity 0.8s ease'
        }}>
          <div className="font-mono" style={{
            fontSize: '11px',
            color: '#94a3b8',
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Lock size={12} color="#00f2fe" />
            <span>PROTOCOL: QUANTUM-DETERMINISTIC</span>
          </div>
        </div>

        {/* Bottom Left: Mesh Coordinates */}
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: 32,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'JetBrains Mono',
          fontSize: '10px',
          color: '#64748b',
          opacity: stage >= 1 ? 1 : 0,
          transition: 'opacity 0.8s ease'
        }}>
          <Radio size={13} color="#0284c7" />
          <span>FINANCIAL_GRAPH_TOPOLOGY: ACTIVE (42 NODES CONNECTED)</span>
        </div>

        {/* Bottom Right: Synthetic Data Telemetry */}
        <div style={{
          position: 'absolute',
          bottom: 28,
          right: 32,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'JetBrains Mono',
          fontSize: '10px',
          color: '#64748b',
          opacity: stage >= 1 ? 1 : 0,
          transition: 'opacity 0.8s ease'
        }}>
          <Cpu size={13} color="#10b981" />
          <span>DATA_MODE: 100% DETERMINISTIC SYNTHETIC</span>
        </div>
      </div>

      {/* Parallax Depth Layer 3: Central Cinematic Hologram & Brand Core */}
      <div 
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '36px 40px',
          maxWidth: '720px',
          width: '92%',
          transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Holographic Glowing Central Logo Core */}
        <div 
          style={{
            position: 'relative',
            width: '144px',
            height: '144px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: stage >= 1 ? 'scale(1)' : 'scale(0.85)',
            opacity: stage >= 1 ? 1 : 0.2,
            transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease'
          }}
        >
          {/* Outer Rotating Radar Ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed rgba(0, 242, 254, 0.55)',
            animation: 'spin 14s linear infinite',
            boxShadow: '0 0 32px rgba(0, 242, 254, 0.25)'
          }} />

          {/* Inner Counter-Rotating Hex Ring */}
          <div style={{
            position: 'absolute',
            inset: '12px',
            borderRadius: '50%',
            border: '1.5px solid rgba(37, 99, 235, 0.55)',
            borderTopColor: '#00f2fe',
            borderBottomColor: '#00f2fe',
            animation: 'spinReverse 9s linear infinite'
          }} />

          {/* Pulsing Energy Core Aura */}
          <div style={{
            position: 'absolute',
            inset: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.35) 0%, rgba(37, 99, 235, 0.15) 70%, transparent 100%)',
            animation: 'pulseGlow 3s ease-in-out infinite'
          }} />

          {/* Main Shield Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(0, 242, 254, 0.65), inset 0 0 16px rgba(255, 255, 255, 0.4)',
            zIndex: 5
          }}>
            <Shield size={38} color="#ffffff" strokeWidth={2.4} />
          </div>
        </div>

        {/* Project Title with letter-by-letter futuristic reveal */}
        <h1 style={{
          fontSize: '46px',
          fontWeight: 900,
          letterSpacing: '8px',
          color: '#ffffff',
          textShadow: '0 0 28px rgba(0, 242, 254, 0.85), 0 0 55px rgba(2, 132, 199, 0.5)',
          marginBottom: '10px',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '56px'
        }}>
          {typedTitle}
          {typedTitle.length < FULL_TITLE.length && stage >= 1 && (
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '36px',
              background: '#00f2fe',
              marginLeft: '4px',
              animation: 'blink 0.8s infinite',
              boxShadow: '0 0 10px #00f2fe'
            }} />
          )}
        </h1>

        {/* Subtitle Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(2, 132, 199, 0.12)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          borderRadius: '20px',
          padding: '6px 22px',
          marginBottom: '26px',
          boxShadow: '0 0 22px rgba(0, 242, 254, 0.18)',
          opacity: stage >= 1 ? 1 : 0,
          transform: stage >= 1 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}>
          <Sparkles size={14} color="#00f2fe" />
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '3px',
            color: '#38bdf8',
            textTransform: 'uppercase'
          }}>
            ADVANCED FRAUD INTELLIGENCE & SOC
          </span>
        </div>

        {/* Phase Indicator Sequence Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '560px',
          marginBottom: '28px',
          opacity: stage >= 2 ? 1 : 0,
          transform: stage >= 2 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}>
          {/* Step 1: Kernel */}
          <div style={{
            background: stage >= 1 ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
            border: `1px solid ${stage >= 1 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.15)'}`,
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'JetBrains Mono',
            fontSize: '11px',
            color: stage >= 1 ? '#e2e8f0' : '#64748b'
          }}>
            {stage >= 2 ? (
              <CheckCircle2 size={15} color="#10b981" />
            ) : (
              <Activity size={15} color="#00f2fe" className="spin-slow" />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', color: '#64748b' }}>STEP 01</div>
              <div style={{ fontWeight: 700 }}>Kernel Ready</div>
            </div>
          </div>

          {/* Step 2: Mesh */}
          <div style={{
            background: stage >= 2 ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
            border: `1px solid ${stage >= 2 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.15)'}`,
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'JetBrains Mono',
            fontSize: '11px',
            color: stage >= 2 ? '#e2e8f0' : '#64748b'
          }}>
            {stage >= 3 ? (
              <CheckCircle2 size={15} color="#10b981" />
            ) : stage >= 2 ? (
              <Zap size={15} color="#38bdf8" />
            ) : (
              <Lock size={15} color="#475569" />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', color: '#64748b' }}>STEP 02</div>
              <div style={{ fontWeight: 700 }}>Mesh Topology</div>
            </div>
          </div>

          {/* Step 3: Stream Lock */}
          <div style={{
            background: stage >= 3 ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.4)',
            border: `1px solid ${stage >= 3 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.15)'}`,
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'JetBrains Mono',
            fontSize: '11px',
            color: stage >= 3 ? '#10b981' : '#64748b'
          }}>
            {stage >= 3 ? (
              <CheckCircle2 size={15} color="#10b981" />
            ) : (
              <Cpu size={15} color="#475569" />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', color: '#64748b' }}>STEP 03</div>
              <div style={{ fontWeight: 700 }}>Telemetry Armed</div>
            </div>
          </div>
        </div>

        {/* Central INITIATE CORE Launch Button */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          marginTop: '6px'
        }}>
          <button
            id="initiate-core-btn"
            onClick={handleInitiateCore}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              border: '2px solid #00f2fe',
              borderRadius: '10px',
              padding: '16px 46px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 900,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 0 32px rgba(0, 242, 254, 0.55), inset 0 0 20px rgba(0, 242, 254, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'buttonPulse 2.5s ease-in-out infinite',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 45px rgba(0, 242, 254, 0.85), inset 0 0 25px rgba(0, 242, 254, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(0, 242, 254, 0.55), inset 0 0 20px rgba(0, 242, 254, 0.3)';
            }}
          >
            <Zap size={18} color="#00f2fe" />
            <span>{isReplay ? 'ENTER DASHBOARD' : 'INITIATE CORE'}</span>
            <ArrowRight size={18} color="#ffffff" />
          </button>

          <div style={{
            fontSize: '12px',
            color: '#94a3b8',
            letterSpacing: '0.6px',
            fontFamily: 'JetBrains Mono'
          }}>
            Click <strong style={{ color: '#38bdf8' }}>{isReplay ? 'ENTER DASHBOARD' : 'INITIATE CORE'}</strong> to open live SOC console
          </div>
        </div>

      </div>

      {/* Global CSS Keyframes for Intro Sequence */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 0.95; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(0, 242, 254, 0.45), inset 0 0 18px rgba(0, 242, 254, 0.25); }
          50% { box-shadow: 0 0 42px rgba(0, 242, 254, 0.75), inset 0 0 24px rgba(0, 242, 254, 0.4); }
        }
        .spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
