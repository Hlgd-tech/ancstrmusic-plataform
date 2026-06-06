import { Home, Radio, Disc3, Layers, TrendingUp, Settings, Hexagon, Wallet, Upload } from 'lucide-react';
import { WalletState } from '../../types';

interface SidebarProps {
  wallet: WalletState;
  activeNav: string;
  onNavChange: (item: string) => void;
  onWalletClick: () => void;
}

const navItems = [
  { id: 'discover', icon: Home, label: 'Discover' },
  { id: 'feed', icon: Radio, label: 'Feed' },
  { id: 'library', icon: Disc3, label: 'Library' },
  { id: 'upload', icon: Upload, label: 'Creator' },
  { id: 'stake', icon: TrendingUp, label: 'Staking' },
];

export default function Sidebar({ wallet, activeNav, onNavChange, onWalletClick }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col h-full w-[72px] xl:w-[180px] glass border-r border-white/[0.03] py-8 px-3 xl:px-5 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 px-1">
        <div className="relative flex-shrink-0">
          <Hexagon
            size={26}
            strokeWidth={1}
            className="text-cyan-neon animate-pulse-core"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00eeff] shadow-[0_0_6px_#00eeff]" />
          </div>
        </div>
        <span className="hidden xl:block text-white/90 font-light text-sm tracking-[0.25em] uppercase">
          ancstr
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              className={`
                group flex items-center gap-3 px-2 xl:px-3 py-3 rounded-lg transition-all duration-300 text-left
                ${active
                  ? 'text-[#00eeff] bg-white/[0.02]'
                  : 'text-white/25 hover:text-white/70'
                }
              `}
            >
              <Icon
                size={17}
                strokeWidth={active ? 1.5 : 1}
                className={`flex-shrink-0 transition-all duration-300 ${
                  active ? 'drop-shadow-[0_0_6px_rgba(0,238,255,0.8)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]'
                }`}
              />
              <span className={`hidden xl:block text-xs tracking-wider uppercase font-light ${active ? 'opacity-100' : 'opacity-70'}`}>
                {label}
              </span>
              {active && (
                <div className="hidden xl:block ml-auto w-1 h-1 rounded-full bg-[#00eeff] shadow-[0_0_6px_#00eeff]" />
              )}
            </button>
          );
        })}

        {/* Wallet connection trigger */}
        <button
          onClick={onWalletClick}
          className={`
            group flex items-center gap-3 px-2 xl:px-3 py-3 rounded-lg transition-all duration-300 text-left mt-2
            ${wallet.connected
              ? 'text-[#ff5500] hover:text-[#ff7722]'
              : 'text-white/25 hover:text-[#00eeff]'
            }
          `}
        >
          <Wallet
            size={17}
            strokeWidth={1}
            className={`flex-shrink-0 transition-all duration-300 ${
              wallet.connected ? 'drop-shadow-[0_0_6px_rgba(255,85,0,0.5)]' : 'group-hover:drop-shadow-[0_0_4px_rgba(0,238,255,0.3)]'
            }`}
          />
          <span className="hidden xl:block text-xs tracking-wider uppercase font-light truncate">
            {wallet.connected ? 'Wallet' : 'Connect'}
          </span>
          {wallet.connected && (
            <div className="hidden xl:block ml-auto w-1 h-1 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
          )}
        </button>
      </nav>

      {/* Settings / Extra info */}
      <div className="mt-auto flex flex-col gap-4">
        {wallet.connected && (
          <div className="hidden xl:block p-3 rounded-lg border border-white/[0.03] bg-white/[0.01]">
            <p className="text-[8px] uppercase tracking-[0.22em] text-white/20">ANC Balance</p>
            <p className="font-mono text-xs font-bold text-[#ff5500] mt-1 truncate">
              {wallet.ancBalance.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </p>
          </div>
        )}
        <button className="flex items-center gap-3 px-2 xl:px-3 py-3 text-white/15 hover:text-white/50 transition-all duration-300 rounded-lg">
          <Settings size={16} strokeWidth={1} className="flex-shrink-0" />
          <span className="hidden xl:block text-xs tracking-wider uppercase font-light">Settings</span>
        </button>
      </div>
    </aside>
  );
}
