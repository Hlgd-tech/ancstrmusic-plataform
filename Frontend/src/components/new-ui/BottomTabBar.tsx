import { Home, Radio, Disc3, Layers, TrendingUp, Upload } from 'lucide-react';

interface BottomTabBarProps {
  activeNav: string;
  onNavChange: (item: string) => void;
}

const tabs = [
  { id: 'discover', icon: Home, label: 'Discover' },
  { id: 'feed', icon: Radio, label: 'Feed' },
  { id: 'library', icon: Disc3, label: 'Library' },
  { id: 'upload', icon: Upload, label: 'Creator' },
  { id: 'stake', icon: TrendingUp, label: 'Staking' },
];

export default function BottomTabBar({ activeNav, onNavChange }: BottomTabBarProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.04]">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {tabs.map(({ id, icon: Icon, label }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-0 ${
                active ? 'text-[#00eeff]' : 'text-white/20 hover:text-white/50'
              }`}
            >
              <Icon
                size={19}
                strokeWidth={active ? 1.5 : 1}
                className={active ? 'drop-shadow-[0_0_6px_rgba(0,238,255,0.7)]' : ''}
              />
              <span className={`text-[9px] tracking-widest uppercase font-light ${active ? 'opacity-100' : 'opacity-60'}`}>
                {label}
              </span>
              {active && (
                <div className="w-1 h-px bg-[#00eeff] rounded-full shadow-[0_0_4px_#00eeff]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
