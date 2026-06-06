import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Compass, Radio, BookOpen, Star,
  TrendingUp, Wallet, Settings, CheckCircle,
} from 'lucide-react';
import { WalletState, QueueTrack, Track } from '../types';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  wallet: WalletState;
  queue: QueueTrack[];
  currentTrack: Track | null;
  isPlaying: boolean;
  activeNav: string;
  onNavChange: (item: string) => void;
  onWalletClick: () => void;
  onQueuePlay: (track: QueueTrack) => void;
}

const NAV_ITEMS = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'feed', label: 'Feed', icon: Radio },
  { id: 'library', label: 'My Library', icon: BookOpen },
  { id: 'era', label: 'ANCSTR ERA', icon: Star },
  { id: 'stake', label: 'Stake & Earn', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomSheet({
  open, onClose, wallet, queue, currentTrack,
  isPlaying, activeNav, onNavChange, onWalletClick, onQueuePlay,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-void-950/80 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-white/[0.06] bg-[rgba(6,10,16,0.97)] backdrop-blur-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-8 h-0.5 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-white/70">ANCSTR</p>
                <span className="text-[8px] text-white/20 tracking-widest">MUSIC. FREEDOM. LEGACY.</span>
              </div>
              <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Nav items */}
              <div className="px-3 pt-3 space-y-0.5">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { onNavChange(id); onClose(); }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      activeNav === id
                        ? 'bg-magma-600/15 border border-magma-600/15 text-magma-300'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Wallet */}
              <div className="px-3 pt-2 pb-2">
                <button
                  onClick={() => { onWalletClick(); onClose(); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    wallet.connected
                      ? 'bg-cyan-950/30 border border-cyan-300/12 text-cyan-300'
                      : 'bg-magma-600/[0.07] border border-magma-600/18 text-magma-300'
                  }`}
                >
                  <Wallet className="w-5 h-5 shrink-0" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">
                      {wallet.connected ? 'Wallet Connected' : 'Connect Wallet'}
                    </p>
                    {wallet.connected && (
                      <p className="font-mono-num text-[9px] text-cyan-300/50 mt-0.5">
                        {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                      </p>
                    )}
                  </div>
                  {wallet.connected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-300 animate-live-pulse" />
                  )}
                </button>
              </div>

              {/* Up Next (mobile) */}
              {queue.length > 0 && (
                <div className="px-4 pt-2 pb-6">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-white/20 mb-2 font-semibold">
                    Up Next
                  </p>
                  <div className="space-y-1">
                    {queue.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { onQueuePlay(item); onClose(); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-all"
                      >
                        <img src={item.cover} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-medium text-white/60 truncate">{item.title}</p>
                          <p className="text-[9px] text-white/25 truncate">{item.artist}</p>
                        </div>
                        <span className="font-mono-num text-[10px] text-white/20">
                          {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile */}
              <div className="mx-4 mb-6 rounded-xl border border-white/[0.04] px-3 py-2.5 flex items-center gap-2.5">
                <img
                  src="https://images.pexels.com/photos/1699159/pexels-photo-1699159.jpeg?auto=compress&cs=tinysrgb&w=80"
                  alt=""
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-magma-600/30 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/70">0xEchoSoul</p>
                  <span className="text-[8px] font-bold tracking-widest px-1 py-px rounded bg-magma-600/25 text-magma-400 uppercase">
                    OG Listener
                  </span>
                </div>
                <CheckCircle className="w-3.5 h-3.5 text-cyan-300/70 shrink-0" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
