import React, { useEffect, useRef, useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [typedTitle, setTypedTitle] = useState<string>('');
  const fullTitle = 'TRACEGUARD';

  // Letter-by-letter reveal effect for title
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 90);

    return () => clearInterval(interval);
  }, []);

  // Manual launch transition when user clicks INITIATE CORE
  const handleInitiateCore = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onComplete();
    }, 650);
  };

  // Background Interactive Matrix Canvas Animation
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

    // Particle nodes
    const particleCount = 75;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.2
    }));

    let scanLineY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Cyber Gradient
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.75);
      grad.addColorStop(0, '#0a192f');
      grad.addColorStop(0.5, '#040d1a');
      grad.addColorStop(1, '#010409');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Cyber Horizon Grid
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.09)';
      ctx.lineWidth = 1;
      const gridSize = 60;
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

      // 3. Floating Constellation Nodes & Connecting Links
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 254, ${p.alpha})`;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(2, 132, 199, ${(1 - dist / 110) * 0.25})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      // 4. Sweeping Laser Scanning Line
      scanLineY = (scanLineY + 2.5) % height;
      const scanGrad = ctx.createLinearGradient(0, scanLineY - 30, 0, scanLineY + 30);
      scanGrad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      scanGrad.addColorStop(0.5, 'rgba(0, 242, 254, 0.22)');
      scanGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanLineY - 30, width, 60);

      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(width, scanLineY);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div style={{
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
      transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
      opacity: isTransitioning ? 0 : 1,
      transform: isTransitioning ? 'scale(1.1) translateY(-12px)' : 'scale(1) translateY(0)',
      pointerEvents: isTransitioning ? 'none' : 'auto'
    }}>
      {/* Background Interactive Particle Canvas */}
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

      {/* Cyber Corner HUD Accents */}
      <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 10px #00f2fe' }} />
        <span className="font-mono" style={{ fontSize: '11px', color: '#38bdf8', letterSpacing: '1px', fontWeight: 700 }}>
          TRACEGUARD // SEC-LEVEL 5
        </span>
      </div>

      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
        <div className="font-mono" style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.7)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          PROTOCOL: QUANTUM-DETERMINISTIC
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 24, left: 24, fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono', zIndex: 10 }}>
        NODE CLUSTER: GLOBAL_FINANCIAL_MESH
      </div>

      <div style={{ position: 'absolute', bottom: 24, right: 24, fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono', zIndex: 10 }}>
        SIMULATION: 100% SYNTHETIC
      </div>

      {/* Center Cinematic Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '30px',
        maxWidth: '680px',
        width: '90%'
      }}>

        {/* Holographic Glowing Central Logo Core */}
        <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Outer Rotating Radar Ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed rgba(0, 242, 254, 0.6)',
            animation: 'spin 12s linear infinite',
            boxShadow: '0 0 30px rgba(0, 242, 254, 0.3)'
          }} />

          {/* Inner Counter-Rotating Hex Ring */}
          <div style={{
            position: 'absolute',
            inset: '12px',
            borderRadius: '50%',
            border: '1.5px solid rgba(37, 99, 235, 0.6)',
            borderTopColor: '#00f2fe',
            borderBottomColor: '#00f2fe',
            animation: 'spinReverse 8s linear infinite'
          }} />

          {/* Pulsing Energy Core Aura */}
          <div style={{
            position: 'absolute',
            inset: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(37, 99, 235, 0.2) 70%, transparent 100%)',
            animation: 'pulseGlow 2.5s ease-in-out infinite'
          }} />

          {/* Main Shield Icon */}
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 35px rgba(0, 242, 254, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.4)',
            zIndex: 5
          }}>
            <Shield size={36} color="#ffffff" strokeWidth={2.4} />
          </div>
        </div>

        {/* Project Title with letter-by-letter futuristic reveal */}
        <h1 style={{
          fontSize: '44px',
          fontWeight: 900,
          letterSpacing: '6px',
          color: '#ffffff',
          textShadow: '0 0 25px rgba(0, 242, 254, 0.85), 0 0 50px rgba(2, 132, 199, 0.5)',
          marginBottom: '8px',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '52px'
        }}>
          {typedTitle}
          {typedTitle.length < fullTitle.length && (
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '34px',
              background: '#00f2fe',
              marginLeft: '4px',
              animation: 'blink 0.8s infinite'
            }} />
          )}
        </h1>

        {/* Subtitle Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(2, 132, 199, 0.14)',
          border: '1px solid rgba(0, 242, 254, 0.45)',
          borderRadius: '20px',
          padding: '6px 20px',
          marginBottom: '32px',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
        }}>
          <Sparkles size={14} color="#00f2fe" />
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '2.5px',
            color: '#38bdf8',
            textTransform: 'uppercase'
          }}>
            ADVANCED FRAUD INTELLIGENCE
          </span>
        </div>

        {/* Core Ready Status Callout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          padding: '8px 18px',
          marginBottom: '28px',
          fontFamily: 'JetBrains Mono'
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>SYSTEM STATUS:</span>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>DETECTION ENGINE ARMED & READY</span>
        </div>

        {/* Central Animated Button: INITIATE CORE */}
        <button
          onClick={handleInitiateCore}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            border: '2px solid #00f2fe',
            borderRadius: '10px',
            padding: '16px 42px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 900,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(0, 242, 254, 0.5), inset 0 0 20px rgba(0, 242, 254, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 45px rgba(0, 242, 254, 0.8), inset 0 0 25px rgba(0, 242, 254, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 242, 254, 0.5), inset 0 0 20px rgba(0, 242, 254, 0.3)';
          }}
        >
          <Zap size={18} color="#00f2fe" />
          <span>INITIATE CORE</span>
          <ArrowRight size={18} color="#ffffff" />
        </button>

        {/* Direct guidance */}
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '16px', letterSpacing: '0.6px' }}>
          Click <strong style={{ color: '#38bdf8' }}>INITIATE CORE</strong> to open live SOC dashboard
        </div>

      </div>

      {/* Global CSS Keyframes for Splash Screen */}
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
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.95; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
