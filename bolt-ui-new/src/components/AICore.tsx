import { useEffect, useRef, useState } from 'react';

interface AICoreProps {
  isPlaying: boolean;
  energy?: number;
}

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
  layer: number;
};

export default function AICore({ isPlaying, energy = 0.5 }: AICoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const [morphState, setMorphState] = useState(0);

  useEffect(() => {
    const count = 120;
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 80 + Math.random() * 60,
      speed: 0.003 + Math.random() * 0.004,
      size: 0.8 + Math.random() * 1.8,
      opacity: 0.2 + Math.random() * 0.6,
      color: Math.random() > 0.5 ? '#00eeff' : '#ff5500',
      layer: Math.floor(Math.random() * 3),
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMorphState(s => (s + 1) % 3);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);

    const draw = () => {
      const { width, height } = canvas;
      const cx = width / 2;
      const cy = height / 2;
      const t = timeRef.current;
      const speedMult = isPlaying ? 1.5 : 0.4;
      timeRef.current += 0.008 * speedMult;

      ctx.clearRect(0, 0, width, height);

      const baseR = Math.min(width, height) * 0.22;
      const pulseR = baseR + Math.sin(t * 2) * (isPlaying ? baseR * 0.04 : baseR * 0.01);

      // Outer glow rings
      for (let ring = 3; ring >= 1; ring--) {
        const ringR = pulseR * (1 + ring * 0.18);
        const grad = ctx.createRadialGradient(cx, cy, ringR * 0.8, cx, cy, ringR);
        grad.addColorStop(0, `rgba(0, 238, 255, ${0.04 / ring})`);
        grad.addColorStop(1, 'rgba(0, 238, 255, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Rotating geometric shapes (morphing)
      if (morphState === 0) {
        drawOctagon(ctx, cx, cy, pulseR * 0.9, t * 0.3);
        drawOctagon(ctx, cx, cy, pulseR * 0.65, -t * 0.5);
      } else if (morphState === 1) {
        drawPolygon(ctx, cx, cy, 6, pulseR * 0.85, t * 0.2);
        drawPolygon(ctx, cx, cy, 6, pulseR * 0.6, -t * 0.35);
      } else {
        drawPolygon(ctx, cx, cy, 4, pulseR * 0.8, t * 0.25 + Math.PI / 4);
        drawPolygon(ctx, cx, cy, 4, pulseR * 0.55, -t * 0.4 + Math.PI / 4);
      }

      // Core sphere gradient
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR * 0.7);
      coreGrad.addColorStop(0, `rgba(0, 238, 255, ${isPlaying ? 0.25 : 0.1})`);
      coreGrad.addColorStop(0.4, `rgba(0, 238, 255, ${isPlaying ? 0.08 : 0.03})`);
      coreGrad.addColorStop(0.7, `rgba(255, 85, 0, ${isPlaying ? 0.06 : 0.02})`);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Particles
      particlesRef.current.forEach(p => {
        p.angle += p.speed * speedMult * (p.layer === 2 ? -1 : 1);
        const layerR = p.radius * (0.7 + p.layer * 0.2) * (pulseR / 100);
        const wobble = Math.sin(t * 3 + p.angle * 4) * (isPlaying ? 6 : 2);
        const px = cx + Math.cos(p.angle) * (layerR + wobble);
        const py = cy + Math.sin(p.angle) * (layerR + wobble) * 0.6;
        const alpha = p.opacity * (isPlaying ? 1 : 0.4) * (0.7 + 0.3 * Math.sin(t * 5 + p.angle));

        ctx.beginPath();
        ctx.arc(px, py, p.size * (pulseR / 100), 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#00eeff', `rgba(0,238,255,${alpha})`).replace('#ff5500', `rgba(255,85,0,${alpha})`);

        const pGrad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2 * (pulseR / 100));
        pGrad.addColorStop(0, p.color === '#00eeff' ? `rgba(0,238,255,${alpha})` : `rgba(255,85,0,${alpha})`);
        pGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pGrad;
        ctx.fill();
      });

      // Energy lines from core
      if (isPlaying) {
        const lineCount = 8;
        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * Math.PI * 2 + t * 0.5;
          const len = pulseR * (0.4 + 0.3 * Math.sin(t * 3 + i));
          const x1 = cx + Math.cos(angle) * pulseR * 0.15;
          const y1 = cy + Math.sin(angle) * pulseR * 0.15;
          const x2 = cx + Math.cos(angle) * len;
          const y2 = cy + Math.sin(angle) * len;
          const lineGrad = ctx.createLinearGradient(x1, y1, x2, y2);
          lineGrad.addColorStop(0, 'rgba(0,238,255,0.4)');
          lineGrad.addColorStop(1, 'rgba(255,85,0,0)');
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Central dot
      const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      dotGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
      dotGrad.addColorStop(0.3, 'rgba(0,238,255,0.6)');
      dotGrad.addColorStop(1, 'rgba(0,238,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = dotGrad;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, [isPlaying, morphState]);

  return (
    <canvas
      ref={canvasRef}
      className="ai-canvas"
      style={{ display: 'block' }}
    />
  );
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  sides: number,
  r: number,
  angle: number
) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2 + angle;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.6;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(0, 238, 255, 0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawOctagon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  angle: number
) {
  drawPolygon(ctx, cx, cy, 8, r, angle);
}
