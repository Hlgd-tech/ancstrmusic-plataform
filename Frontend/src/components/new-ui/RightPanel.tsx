import { Heart, MoreHorizontal, Zap } from 'lucide-react';
import { QueueTrack, Track } from '../../types';

interface RightPanelProps {
  queue: QueueTrack[];
  currentTrack?: Track | null;
  isPlaying: boolean;
  onQueuePlay: (track: QueueTrack) => void;
}

export default function RightPanel({ queue, currentTrack, isPlaying, onQueuePlay }: RightPanelProps) {
  return (
    <aside className="hidden md:flex flex-col h-full w-[240px] xl:w-[280px] glass border-l border-white/[0.03] flex-shrink-0">
      {/* Header */}
      <div className="px-5 pt-8 pb-5 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/20 tracking-[0.3em] uppercase">Queue</span>
          <span className="text-[10px] text-white/15 tracking-wider">{queue.length} tracks</span>
        </div>
        <p className="text-white/50 text-xs font-light tracking-wide mt-2">AI Genesis Vol.1</p>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {queue.map((track, i) => {
          const active = currentTrack?.title === track.title;
          return (
            <button
              key={track.id}
              onClick={() => onQueuePlay(track)}
              className={`
                w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 text-left
                transition-all duration-300 group
                ${active
                  ? 'bg-white/[0.03] border border-white/[0.05]'
                  : 'hover:bg-white/[0.02] border border-transparent'
                }
              `}
            >
              {/* Index / playing indicator */}
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                {active && isPlaying ? (
                  <div className="flex items-end gap-px h-3">
                    {[0, 1, 2].map(b => (
                      <div
                        key={b}
                        className="w-0.5 bg-[#00eeff] rounded-sm waveform-bar"
                        style={{
                          '--bar-duration': `${0.6 + b * 0.15}s`,
                          '--bar-delay': `${b * 0.1}s`,
                          height: '100%',
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-white/15 group-hover:text-white/30 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-light truncate ${active ? 'text-[#00eeff]' : 'text-white/50 group-hover:text-white/70'} transition-colors`}>
                  {track.title}
                </p>
                <p className="text-[10px] text-white/15 tracking-wide truncate mt-0.5">
                  {track.artist}
                </p>
              </div>

              {/* Right side */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <Zap size={9} className="text-[#ff5500] opacity-60" strokeWidth={1.5} />
                <span className="text-[10px] text-white/15">{track.duration}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* NFT metadata panel */}
      <div className="px-5 pb-6 pt-4 border-t border-white/[0.03]">
        <div className="text-[9px] text-white/15 tracking-[0.3em] uppercase mb-3">NFT Metadata</div>
        <div className="space-y-2">
          {[
            { label: 'Contract', value: '0x7f3e...c9a1' },
            { label: 'Token ID', value: '#00042' },
            { label: 'Edition', value: '1 of 100' },
            { label: 'Chain', value: 'Solana' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-[10px] text-white/15">{label}</span>
              <span className="text-[10px] text-white/40 font-light">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 rounded border border-white/[0.05] text-[10px] text-white/30 hover:text-white/60 hover:border-[#00eeff]/20 tracking-widest uppercase transition-all duration-300">
            Collect
          </button>
          <button className="p-2 rounded border border-white/[0.05] text-white/20 hover:text-white/50 hover:border-white/10 transition-all duration-300">
            <Heart size={11} strokeWidth={1} />
          </button>
          <button className="p-2 rounded border border-white/[0.05] text-white/20 hover:text-white/50 hover:border-white/10 transition-all duration-300">
            <MoreHorizontal size={11} strokeWidth={1} />
          </button>
        </div>
      </div>
    </aside>
  );
}
