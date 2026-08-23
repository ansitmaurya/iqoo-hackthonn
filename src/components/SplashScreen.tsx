import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  // Trigger smooth exit transition when user clicks Initiate Core or presses Enter
  const handleExit = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  }, [onComplete]);

  // Keyboard shortcut: Press Enter or Space to initiate core instantly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit]);

  // Subtle background constellation canvas (slow, calm, low opacity)
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

    // Reduced number of particles with very slow, gentle drift
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.25 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle, deep gradient
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        40,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, '#0a1426');
      grad.addColorStop(0.5, '#050a14');
      grad.addColorStop(1, '#02060d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Very subtle architectural grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 72;
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

      // 3. Gentle node constellation
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 120) * 0.08})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="traceguard-splash-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#02060d',
        color: '#f8fafc',
        overflow: 'hidden',
        transition: 'opacity 0.45s ease-out, transform 0.45s ease-out, filter 0.45s ease-out',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.02)' : 'scale(1)',
        filter: isExiting ? 'blur(4px)' : 'none',
        pointerEvents: isExiting ? 'none' : 'auto'
      }}
    >
      {/* Dynamic Background Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Top Header Telemetry Badges */}
      <div
        style={{
          position: 'absolute',
          top: '28px',
          left: '32px',
          right: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#0284c7',
              boxShadow: '0 0 8px rgba(2, 132, 199, 0.6)'
            }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              letterSpacing: '1.2px',
              fontWeight: 600
            }}
          >
            TRACEGUARD <span style={{ color: '#38bdf8' }}>// SOC CORE OS</span>
          </span>
        </div>

        <div
          className="font-mono"
          style={{
            fontSize: '11px',
            color: '#64748b',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(56, 189, 248, 0.15)'
          }}
        >
          AUTH: ZERO-TRUST
        </div>
      </div>

      {/* Center Cinematic Card */}
      <div
        className="splash-center-content"
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '40px 36px',
          maxWidth: '560px',
          width: '90%',
          background: 'rgba(8, 15, 30, 0.55)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.14)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)'
        }}
      >
        {/* Refined Shield Logo Container with Soft Glow */}
        <div
          style={{
            position: 'relative',
            width: '88px',
            height: '88px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0) 70%)',
              filter: 'blur(10px)',
              pointerEvents: 'none'
            }}
          />

          {/* Elegant Circular Frame */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              background: 'rgba(15, 23, 42, 0.8)'
            }}
          />

          {/* Logo Badge Icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '15px',
              background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.35)',
              zIndex: 2
            }}
          >
            <Shield size={28} color="#ffffff" strokeWidth={2.2} />
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '4px',
            color: '#ffffff',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          TRACE<span style={{ color: '#38bdf8' }}>GUARD</span>
        </h1>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '2px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}
        >
          Enterprise Fraud Detection & SOC Intelligence
        </div>

        {/* System Status Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(56, 189, 248, 0.16)',
            borderRadius: '8px',
            padding: '8px 18px',
            marginBottom: '26px',
            fontFamily: 'JetBrains Mono, monospace'
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>STATUS:</span>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.5px' }}>
            DETECTION ENGINE ARMED & READY
          </span>
        </div>

        {/* Central INITIATE CORE Action Button */}
        <button
          onClick={handleExit}
          style={{
            position: 'relative',
            width: '100%',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            border: '1px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '10px',
            padding: '15px 28px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(2, 132, 199, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'Inter, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 35px rgba(2, 132, 199, 0.65), inset 0 0 20px rgba(56, 189, 248, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(2, 132, 199, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
          }}
        >
          <Zap size={16} color="#38bdf8" />
          <span>INITIATE CORE</span>
          <ArrowRight size={16} color="#ffffff" />
        </button>

        {/* Micro Telemetry Footer */}
        <div
          className="font-mono"
          style={{
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '22px'
          }}
        >
          <span>ENVIRONMENT: PRODUCTION SIM</span>
          <span>•</span>
          <span>LATENCY: 1.2ms</span>
          <span>•</span>
          <span>PIPELINE: ACTIVE</span>
        </div>
      </div>

      {/* Bottom Subtext */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '11px',
          color: '#475569',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.5px'
        }}
      >
        Press <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>Enter</kbd> or click INITIATE CORE to enter dashboard
      </div>

      {/* Reduced motion and smooth styling overrides */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .traceguard-splash-overlay,
          .splash-center-content {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};


