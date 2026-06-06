import { useRef, useEffect, useCallback } from 'react';

interface WaveformProgressBarProps {
  progress: number; // 0-1
  isPlaying: boolean;
  onSeek: (progress: number) => void;
}

const BARS = 80;

// Deterministic waveform shape — same every render
const WAVE_HEIGHTS = Array.from({ length: BARS }, (_, i) =>
  Math.max(0.08, Math.abs(
    Math.sin(i * 0.68) * 0.38 +
    Math.sin(i * 0.22) * 0.28 +
    Math.sin(i * 1.72) * 0.14 +
    Math.sin(i * 0.06) * 0.18
  ))
);

export default function WaveformProgressBar({ progress, isPlaying, onSeek }: WaveformProgressBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const isPlayingRef = useRef(isPlaying);
  const phaseRef = useRef(0);
  const animIdRef = useRef<number>(0);

  progressRef.current = progress;
  isPlayingRef.current = isPlaying;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const prog = progressRef.current;
    const playing = isPlayingRef.current;
    const playheadBarF = prog * BARS;
    const playheadBar = Math.floor(playheadBarF);
    const barW = W / BARS;

    // Pulse wave near playhead (advances when playing)
    if (playing) phaseRef.current += 0.06;

    // Gradient for played bars
    const magmaGrad = ctx.createLinearGradient(0, 0, 0, H);
    magmaGrad.addColorStop(0, '#ffaa00');
    magmaGrad.addColorStop(0.5, '#ff5500');
    magmaGrad.addColorStop(1, '#ff2200');

    for (let i = 0; i < BARS; i++) {
      const isPast = i < playheadBar;
      const isHead = i === playheadBar;

      // Proximity boost around playhead
      const dist = Math.abs(i - playheadBar);
      const nearBoost = Math.max(0, 1 - dist / 7);
      const pulse = Math.sin(phaseRef.current + i * 0.4) * 0.5 + 0.5;
      const boost = nearBoost * pulse * (playing ? 0.45 : 0.15);

      const h = Math.max(3, (WAVE_HEIGHTS[i] + boost) * H * 0.88);
      const x = i * barW + 1.5;
      const y = (H - h) / 2;
      const w = Math.max(1, barW - 3);
      const r = Math.min(2, w / 2);

      if (isPast || isHead) {
        ctx.fillStyle = magmaGrad;
        // Glow effect for played bars
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = isHead ? 12 : (isPast ? 4 : 0);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Playhead dot
    const headX = playheadBarF * barW + barW / 2;
    ctx.beginPath();
    ctx.arc(headX, H / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const loop = () => {
      draw();
      animIdRef.current = requestAnimationFrame(loop);
    };
    animIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = Math.floor(width * devicePixelRatio);
        canvas.height = Math.floor(height * devicePixelRatio);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(devicePixelRatio, devicePixelRatio);
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pct);
  }, [onSeek]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-12 cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
