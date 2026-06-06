import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  track?: {
    title: string;
    artist: string;
    duration: number;
  };
}

export default function PlayerControls({ isPlaying, onTogglePlay, track }: PlayerControlsProps) {
  const [progress, setProgress] = useState(34);
  const [volume, setVolume] = useState(72);

  const formatTime = (pct: number, duration: number) => {
    const s = Math.floor((pct / 100) * duration);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const dur = track?.duration ?? 237;

  return (
    <div className="w-full px-4 md:px-8 pb-6 md:pb-8 pt-4">
      {/* Track info */}
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <p className="text-white/80 text-sm font-light tracking-wide truncate animate-text-glow">
            {track?.title ?? 'Quantum Drift'}
          </p>
          <p className="text-white/25 text-xs tracking-widest uppercase mt-0.5 truncate">
            {track?.artist ?? 'ancstr AI :: Node 7'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500] animate-shimmer" />
          <span className="text-[10px] text-white/20 tracking-widest uppercase">NFT</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="relative group">
          <div className="h-px bg-white/[0.06] rounded-full w-full relative overflow-hidden">
            <div
              className="h-full progress-bar rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-px"
            style={{ margin: 0 }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-white/20 font-light tracking-wider">
            {formatTime(progress, dur)}
          </span>
          <span className="text-[10px] text-white/20 font-light tracking-wider">
            {formatTime(100, dur)}
          </span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <button className="text-white/20 hover:text-white/60 transition-all duration-300 p-2 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          <Shuffle size={14} strokeWidth={1} />
        </button>

        <div className="flex items-center gap-3 md:gap-5">
          <button className="text-white/40 hover:text-white/80 transition-all duration-300 p-2 hover:drop-shadow-[0_0_6px_rgba(0,238,255,0.5)]">
            <SkipBack size={18} strokeWidth={1} />
          </button>

          <button
            onClick={onTogglePlay}
            className={`
              relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center
              transition-all duration-500 group
              ${isPlaying
                ? 'border border-[#00eeff]/30 shadow-[0_0_20px_rgba(0,238,255,0.2),inset_0_0_20px_rgba(0,238,255,0.03)]'
                : 'border border-white/10 hover:border-[#00eeff]/20 hover:shadow-[0_0_15px_rgba(0,238,255,0.1)]'
              }
            `}
          >
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isPlaying ? 'bg-[#00eeff]/5' : 'bg-transparent group-hover:bg-white/[0.02]'}`} />
            {isPlaying
              ? <Pause size={16} strokeWidth={1} className="text-[#00eeff] drop-shadow-[0_0_6px_rgba(0,238,255,0.8)] relative z-10" />
              : <Play size={16} strokeWidth={1} className="text-white/60 group-hover:text-white/90 relative z-10 translate-x-0.5" />
            }
          </button>

          <button className="text-white/40 hover:text-white/80 transition-all duration-300 p-2 hover:drop-shadow-[0_0_6px_rgba(0,238,255,0.5)]">
            <SkipForward size={18} strokeWidth={1} />
          </button>
        </div>

        <button className="text-white/20 hover:text-white/60 transition-all duration-300 p-2 hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]">
          <Repeat size={14} strokeWidth={1} />
        </button>
      </div>

      {/* Volume — hidden on small mobile */}
      <div className="hidden sm:flex items-center gap-3 mt-5">
        <Volume2 size={12} strokeWidth={1} className="text-white/20 flex-shrink-0" />
        <div className="relative flex-1 group">
          <div className="h-px bg-white/[0.06] rounded-full w-full relative overflow-hidden">
            <div
              className="h-full bg-white/20 rounded-full transition-all duration-200"
              style={{ width: `${volume}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-px"
            style={{ margin: 0 }}
          />
        </div>
        <span className="text-[10px] text-white/15 w-6 text-right">{volume}</span>
      </div>
    </div>
  );
}
