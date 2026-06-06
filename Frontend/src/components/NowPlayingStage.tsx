import { useState } from 'react';
import {
  Heart, Plus, MoreHorizontal, Shuffle, SkipBack,
  Play, Pause, SkipForward, Repeat, Volume2, VolumeX,
  CheckCircle, AlignJustify, Maximize2, Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioSphereCanvas from '../three/AudioSphereCanvas';
import WaveformProgressBar from './WaveformProgressBar';
import { PlayerState, Track } from '../types';

interface NowPlayingStageProps {
  player: PlayerState;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (p: number) => void;
  onVolume: (v: number) => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onMenuOpen: () => void;
  defaultTrack: Track;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function NowPlayingStage({
  player, onPlayPause, onNext, onPrev, onSeek,
  onVolume, onShuffle, onRepeat, onMenuOpen, defaultTrack,
}: NowPlayingStageProps) {
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(false);

  const track = player.track ?? defaultTrack;
  const duration = track.duration;
  const currentTime = duration * player.progress;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* ── WebGL sphere — fills entire stage background ── */}
      <div className="absolute inset-0">
        <AudioSphereCanvas isPlaying={player.isPlaying} progress={player.progress} />
      </div>

      {/* ── Vignette overlay for readability ── */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,5,8,0.55)_100%)]" />

      {/* ── Top bar: mobile menu + search ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 lg:pt-5 lg:px-8">
        <button
          onClick={onMenuOpen}
          className="lg:hidden touch-target w-10 h-10 flex items-center justify-center text-white/30 hover:text-white/60"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:block" />
        {/* Right: nothing (search lives in RightPanel header) */}
      </div>

      {/* ── Track info overlay (top left of stage) ── */}
      <div className="relative z-10 px-5 pt-2 pb-0 lg:px-8 lg:pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <p className="text-[9px] uppercase tracking-[0.28em] text-magma-400 font-semibold mb-1.5">
              Now Playing
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight leading-none">
              {track.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-white/40 font-medium">{track.artist}</p>
              <span className="text-white/15">•</span>
              <p className="text-sm text-white/25">ANCSTR ERA</p>
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400/70 fill-cyan-400/10" />
            </div>
            {/* Quality badges */}
            <div className="flex items-center gap-2 mt-2.5">
              {track.kbps && (
                <span className="text-[9px] font-semibold tracking-widest px-2 py-0.5 rounded border border-white/[0.1] text-white/35 bg-white/[0.04]">
                  {track.kbps} KBPS
                </span>
              )}
              {track.quality && (
                <span className="text-[9px] font-semibold tracking-widest px-2 py-0.5 rounded border border-white/[0.1] text-white/35 bg-white/[0.04]">
                  {track.quality}
                </span>
              )}
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setLiked(!liked)}
                className={`touch-target w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  liked
                    ? 'bg-magma-600/30 text-magma-400 glow-magma-sm border border-magma-600/40'
                    : 'text-white/20 hover:text-white/50 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-magma-400' : ''}`} />
              </button>
              <button className="touch-target w-9 h-9 flex items-center justify-center rounded-full text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all border border-transparent">
                <Plus className="w-4 h-4" />
              </button>
              <button className="touch-target w-9 h-9 flex items-center justify-center rounded-full text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all border border-transparent">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Spacer — the sphere shows here */}
      <div className="flex-1" />

      {/* ── Player controls (bottom) ── */}
      <div className="relative z-10 px-5 pb-4 sm:pb-6 lg:px-8 lg:pb-7">
        {/* Waveform progress bar */}
        <WaveformProgressBar
          progress={player.progress}
          isPlaying={player.isPlaying}
          onSeek={onSeek}
        />

        {/* Time */}
        <div className="flex justify-between mt-1 mb-4">
          <span className="font-mono-num text-[10px] text-white/30">
            {formatTime(currentTime)}
          </span>
          <span className="font-mono-num text-[10px] text-white/20">
            {formatTime(duration)}
          </span>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-between">
          {/* Left: shuffle + skip back */}
          <div className="flex items-center gap-1">
            <button
              onClick={onShuffle}
              className={`touch-target w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                player.shuffle ? 'text-cyan-300/80' : 'text-white/20 hover:text-white/45'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onPrev}
              className="touch-target w-11 h-11 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Play/Pause — the hero button */}
          <button
            onClick={onPlayPause}
            className="touch-target relative w-16 h-16 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              background: 'radial-gradient(circle at 40% 35%, #ff8800, #ff3300)',
              boxShadow: player.isPlaying
                ? '0 0 0 1px rgba(255,80,0,0.4), 0 0 30px rgba(255,60,0,0.45), 0 0 70px rgba(255,40,0,0.2)'
                : '0 0 0 1px rgba(255,80,0,0.25), 0 0 16px rgba(255,60,0,0.2)',
            }}
          >
            {/* Outer pulse ring */}
            {player.isPlaying && (
              <div
                className="absolute inset-0 rounded-full animate-ping-slow"
                style={{ background: 'rgba(255,80,0,0.15)', animationDuration: '2s' }}
              />
            )}
            {player.isPlaying
              ? <Pause className="w-6 h-6 text-white relative z-10" />
              : <Play className="w-6 h-6 text-white relative z-10 ml-0.5" />
            }
          </button>

          {/* Right: skip forward + repeat */}
          <div className="flex items-center gap-1">
            <button
              onClick={onNext}
              className="touch-target w-11 h-11 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onRepeat}
              className={`touch-target w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                player.repeat ? 'text-cyan-300/80' : 'text-white/20 hover:text-white/45'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Volume + extras row */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setMuted(!muted)}
            className="text-white/20 hover:text-white/50 transition-colors shrink-0"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 relative h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
            <input
              type="range" min="0" max="1" step="0.02"
              value={muted ? 0 : player.volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="h-full rounded-full bg-white/30 transition-all"
              style={{ width: `${(muted ? 0 : player.volume) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button className="text-[9px] font-semibold tracking-widest text-white/20 hover:text-white/50 uppercase px-2 py-1 rounded hover:bg-white/[0.04] transition-all">
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button className="text-white/20 hover:text-white/50 transition-colors p-1">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
