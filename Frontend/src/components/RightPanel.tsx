import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Album, QueueTrack, Track } from '../types';

interface RightPanelProps {
  albums: Album[];
  queue: QueueTrack[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onQueuePlay: (track: QueueTrack) => void;
  earnProgress: number; // 0-1
}

// CSS 3D Cube component (orange accent, no Three.js)
function OrangeCube() {
  return (
    <div className="w-10 h-10 shrink-0" style={{ perspective: '80px' }}>
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'rotateCube 5s linear infinite',
        }}
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(255,100,0,0.55)', border: '1px solid rgba(255,150,0,0.4)', transform: 'translateZ(20px)' }} />
        {/* Back */}
        <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(255,60,0,0.40)', border: '1px solid rgba(255,120,0,0.3)', transform: 'rotateY(180deg) translateZ(20px)' }} />
        {/* Left */}
        <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(255,80,0,0.45)', border: '1px solid rgba(255,130,0,0.35)', transform: 'rotateY(-90deg) translateZ(20px)' }} />
        {/* Right */}
        <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(255,80,0,0.45)', border: '1px solid rgba(255,130,0,0.35)', transform: 'rotateY(90deg) translateZ(20px)' }} />
        {/* Top */}
        <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(255,140,0,0.55)', border: '1px solid rgba(255,170,0,0.4)', transform: 'rotateX(90deg) translateZ(20px)' }} />
        {/* Bottom */}
        <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(200,50,0,0.40)', border: '1px solid rgba(255,100,0,0.3)', transform: 'rotateX(-90deg) translateZ(20px)' }} />
      </div>
    </div>
  );
}

// Animated playing indicator (3 bars)
function PlayingBars() {
  return (
    <div className="flex items-end gap-px h-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-0.5 bg-cyan-300 rounded-full"
          style={{
            animation: `playingBar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function RightPanel({ albums, queue, currentTrack, isPlaying, onQueuePlay, earnProgress }: RightPanelProps) {
  const [autoplay, setAutoplay] = useState(true);

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 h-full border-l border-white/[0.04] bg-[rgba(3,5,8,0.92)] backdrop-blur-xl overflow-hidden">

      {/* ── Search bar + notifications ── */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <input
              type="text"
              placeholder="Search ANCSTR"
              className="flex-1 bg-transparent text-xs text-white/60 placeholder-white/20 outline-none"
            />
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all shrink-0">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* ── ANCSTR ERA ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30 font-semibold">
              ANCSTR ERA
            </p>
            <button className="text-[9px] text-cyan-300/50 hover:text-cyan-300 uppercase tracking-widest transition-colors">
              View All
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {albums.map((album) => (
              <motion.div
                key={album.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 cursor-pointer group"
              >
                <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden holo-cover">
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[9px] text-white/50 mt-1.5 font-medium leading-tight truncate w-[72px]">
                  {album.title}
                </p>
                <p className="text-[8px] text-white/20 leading-tight">{album.volume}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── UP NEXT ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30 font-semibold">
              Up Next
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase tracking-widest text-white/20">Autoplay</span>
              <button
                onClick={() => setAutoplay(!autoplay)}
                className={`relative w-7 h-3.5 rounded-full transition-all duration-300 ${
                  autoplay ? 'bg-cyan-300/70' : 'bg-white/[0.08]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all duration-300 ${
                    autoplay ? 'left-3.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {queue.map((item, idx) => {
              const isCurrentPlaying = currentTrack?.title === item.title && isPlaying;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onQueuePlay(item)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all group relative ${
                    isCurrentPlaying
                      ? 'bg-cyan-300/[0.06] border border-cyan-300/10'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {isCurrentPlaying && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-cyan-300/60" />
                  )}

                  <span className="text-[9px] font-mono-num text-white/15 w-4 shrink-0 text-right">
                    {idx + 1}
                  </span>

                  <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0">
                    <img src={item.cover} alt="" className="w-full h-full object-cover" />
                    {isCurrentPlaying && (
                      <div className="absolute inset-0 bg-void-950/50 flex items-center justify-center">
                        <PlayingBars />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-xs font-medium line-clamp-1 transition-colors ${
                      isCurrentPlaying ? 'text-cyan-200' : 'text-white/60 group-hover:text-white/80'
                    }`}>
                      {item.title}
                    </p>
                    <p className="text-[9px] text-white/25 truncate">{item.artist}</p>
                  </div>

                  <span className="font-mono-num text-[10px] text-white/20 shrink-0">
                    {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ── EARN ANC ── */}
        <section>
          <div className="rounded-xl border border-magma-600/20 bg-magma-600/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-magma-400/80 font-semibold">
                    Earn ANC
                  </p>
                  <span className="text-[7px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/[0.05] text-white/20 border border-white/[0.06]">
                    Locked
                  </span>
                </div>
                <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${earnProgress * 100}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #ff4400, #ffaa00)',
                      boxShadow: '0 0 8px rgba(255,100,0,0.5)',
                    }}
                  />
                </div>
                <p className="font-mono-num text-sm font-bold text-white/80">
                  3,200 <span className="text-xs text-white/40 font-normal">ANC</span>
                </p>
                <p className="text-[9px] text-white/20 mt-0.5">Stream to unlock rewards</p>
              </div>
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(255,100,0,0.5))' }}>
                <OrangeCube />
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
