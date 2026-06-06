import { useState } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import AICore from './components/AICore';
import PlayerControls from './components/PlayerControls';
import BottomTabBar from './components/BottomTabBar';
import TopBar from './components/TopBar';
import { Cpu } from 'lucide-react';

const currentTrack = {
  title: 'Quantum Drift',
  artist: 'ancstr AI :: Node 7',
  duration: 237,
};

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex h-screen bg-[#030508] overflow-hidden font-['Inter']">
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,238,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,238,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Ambient glow blobs */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,238,255,0.025) 0%, transparent 70%)' }}
      />
      <div className="fixed bottom-0 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,85,0,0.03) 0%, transparent 70%)' }}
      />

      {/* LEFT — Sidebar */}
      <Sidebar />

      {/* CENTER — Main content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top bar */}
        <TopBar />

        {/* AI Core area */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Status chip */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl">
            <Cpu size={10} strokeWidth={1} className="text-white/30" />
            <span className="text-[9px] text-white/25 tracking-[0.3em] uppercase">
              {isPlaying ? 'Processing audio stream' : 'Standby mode'}
            </span>
            <div className={`w-1 h-1 rounded-full transition-all duration-500 ${
              isPlaying ? 'bg-[#00eeff] shadow-[0_0_4px_#00eeff] animate-shimmer' : 'bg-white/15'
            }`} />
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <AICore isPlaying={isPlaying} />

            {/* Center text overlay when paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center mt-32">
                  <p className="text-[10px] text-white/10 tracking-[0.5em] uppercase mb-2">
                    ancstr intelligence
                  </p>
                  <p className="text-[9px] text-white/[0.06] tracking-[0.3em] uppercase">
                    Tap play to awaken
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Player controls — float above the bottom tab bar on mobile */}
          <div className="relative z-10 pb-16 md:pb-0">
            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(p => !p)}
              track={currentTrack}
            />
          </div>
        </div>
      </main>

      {/* RIGHT — Context panel */}
      <RightPanel />

      {/* MOBILE — Bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
