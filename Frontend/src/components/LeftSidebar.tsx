import { useMemo } from 'react';
import {
  Compass, Radio, BookOpen, Star, TrendingUp,
  Wallet, Settings, CheckCircle, Radio as LogoIcon, Upload,
} from 'lucide-react';
import { WalletState } from '../types';

interface LeftSidebarProps {
  wallet: WalletState;
  activeNav: string;
  onNavChange: (item: string) => void;
  onWalletClick: () => void;
}

const NAV_ITEMS = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'feed', label: 'Feed', icon: Radio },
  { id: 'library', label: 'My Library', icon: BookOpen },
  { id: 'upload', label: 'Creator Studio', icon: Upload },
  { id: 'era', label: 'ANCSTR ERA', icon: Star },
  { id: 'stake', label: 'Stake & Earn', icon: TrendingUp },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Sparkline data — static decorative
const SPARKLINE = [38, 42, 36, 55, 48, 62, 57, 70, 64, 78, 71, 82];

function Sparkline() {
  const points = useMemo(() => {
    const max = Math.max(...SPARKLINE);
    const min = Math.min(...SPARKLINE);
    const range = max - min || 1;
    return SPARKLINE.map((v, i) => {
      const x = (i / (SPARKLINE.length - 1)) * 100;
      const y = 34 - ((v - min) / range) * 30;
      return `${x},${y}`;
    }).join(' ');
  }, []);

  return (
    <svg viewBox="0 0 100 40" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5500" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="#ff6600"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LeftSidebar({ wallet, activeNav, onNavChange, onWalletClick }: LeftSidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 h-full border-r border-white/[0.04] bg-[rgba(3,5,8,0.95)] backdrop-blur-xl select-none">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-magma-600/40 to-magma-800/20 border border-magma-600/30 flex items-center justify-center shrink-0">
            <LogoIcon className="w-4 h-4 text-magma-400" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.14em] uppercase text-white/90">ANCSTR</p>
            <p className="text-[8px] tracking-[0.2em] uppercase text-white/25 leading-tight">
              Music. Freedom. Legacy.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeNav === id;
          const isWallet = id === 'wallet';
          return (
            <button
              key={id}
              onClick={() => isWallet ? onWalletClick() : onNavChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative ${
                isActive
                  ? 'bg-magma-600/15 text-magma-300'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-magma-500 glow-magma-sm" />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-magma-400' : 'text-white/25 group-hover:text-white/50'}`} />
              <span className="text-xs font-medium tracking-wide">{label}</span>
              {id === 'stake' && (
                <span className="ml-auto text-[8px] font-semibold px-1 py-0.5 rounded bg-cyan-300/10 text-cyan-300/70 tracking-wider">
                  APY
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Wallet balance */}
      <div className="mx-3 mb-3 rounded-xl bg-void-800/80 border border-white/[0.05] p-3.5">
        <p className="text-[8px] uppercase tracking-[0.22em] text-white/25 mb-2">Wallet Balance</p>
        {wallet.connected ? (
          <>
            <p className="font-mono-num text-base font-bold text-magma-400 leading-none">
              ANC {wallet.ancBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="font-mono-num text-[10px] text-white/25 mt-0.5">
              ≈ ${wallet.ancUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </p>
            <div className="mt-2">
              <Sparkline />
            </div>
          </>
        ) : (
          <button
            onClick={onWalletClick}
            className="w-full text-xs font-medium text-magma-400 hover:text-magma-300 text-left transition-colors"
          >
            Connect wallet →
          </button>
        )}
      </div>

      {/* User profile */}
      <div className="mx-3 mb-5 rounded-xl bg-void-800/60 border border-white/[0.04] p-3 flex items-center gap-2.5">
        <div className="relative shrink-0">
          <img
            src="https://images.pexels.com/photos/1699159/pexels-photo-1699159.jpeg?auto=compress&cs=tinysrgb&w=80"
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-1 ring-magma-600/30"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-300 border-2 border-void-900" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white/80 truncate">0xEchoSoul</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[8px] font-bold tracking-widest px-1 py-px rounded bg-magma-600/25 text-magma-400 uppercase">
              OG Listener
            </span>
          </div>
        </div>
        <CheckCircle className="w-3.5 h-3.5 text-cyan-300/80 shrink-0" />
      </div>
    </aside>
  );
}
