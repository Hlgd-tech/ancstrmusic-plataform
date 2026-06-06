import { Heart, MoreHorizontal, Zap, Clock } from 'lucide-react';

const playlist = [
  { id: 1, title: 'Quantum Drift', artist: 'ancstr AI :: Node 7', duration: '3:57', active: true, nft: true },
  { id: 2, title: 'Neon Cascade', artist: 'ancstr AI :: Node 12', duration: '4:22', active: false, nft: true },
  { id: 3, title: 'Abyssal Echo', artist: 'ancstr AI :: Node 3', duration: '5:08', active: false, nft: false },
  { id: 4, title: 'Vertex Storm', artist: 'ancstr AI :: Node 9', duration: '3:44', active: false, nft: true },
  { id: 5, title: 'Particle Rift', artist: 'ancstr AI :: Node 7', duration: '4:11', active: false, nft: false },
  { id: 6, title: 'Fractal Hymn', artist: 'ancstr AI :: Node 2', duration: '6:02', active: false, nft: true },
  { id: 7, title: 'Dark Matter', artist: 'ancstr AI :: Node 15', duration: '3:29', active: false, nft: false },
];

export default function RightPanel() {
  return (
    <aside className="hidden md:flex flex-col h-full w-[240px] xl:w-[280px] glass border-l border-white/[0.03] flex-shrink-0">
      {/* Header */}
      <div className="px-5 pt-8 pb-5 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/20 tracking-[0.3em] uppercase">Queue</span>
          <span className="text-[10px] text-white/15 tracking-wider">{playlist.length} tracks</span>
        </div>
        <p className="text-white/50 text-xs font-light tracking-wide mt-2">AI Genesis Vol.1</p>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {playlist.map((track, i) => (
          <button
            key={track.id}
            className={`
              w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 text-left
              transition-all duration-300 group
              ${track.active
                ? 'bg-white/[0.03] border border-white/[0.05]'
                : 'hover:bg-white/[0.02] border border-transparent'
              }
            `}
          >
            {/* Index / playing indicator */}
            <div className="w-5 flex-shrink-0 flex items-center justify-center">
              {track.active ? (
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
              <p className={`text-xs font-light truncate ${track.active ? 'text-[#00eeff]' : 'text-white/50 group-hover:text-white/70'} transition-colors`}>
                {track.title}
              </p>
              <p className="text-[10px] text-white/15 tracking-wide truncate mt-0.5">
                {track.artist}
              </p>
            </div>

            {/* Right side */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {track.nft && (
                <Zap size={9} className="text-[#ff5500] opacity-60" strokeWidth={1.5} />
              )}
              <span className="text-[10px] text-white/15">{track.duration}</span>
            </div>
          </button>
        ))}
      </div>

      {/* NFT metadata panel */}
      <div className="px-5 pb-6 pt-4 border-t border-white/[0.03]">
        <div className="text-[9px] text-white/15 tracking-[0.3em] uppercase mb-3">NFT Metadata</div>
        <div className="space-y-2">
          {[
            { label: 'Contract', value: '0x7f3e...c9a1' },
            { label: 'Token ID', value: '#00042' },
            { label: 'Edition', value: '1 of 100' },
            { label: 'Chain', value: 'Base' },
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
