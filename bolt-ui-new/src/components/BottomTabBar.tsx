import { Home, Radio, Disc3, Layers, TrendingUp } from 'lucide-react';

const tabs = [
  { icon: Home, label: 'Home', active: true },
  { icon: Radio, label: 'Live', active: false },
  { icon: Disc3, label: 'Drops', active: false },
  { icon: Layers, label: 'Vault', active: false },
  { icon: TrendingUp, label: 'Charts', active: false },
];

export default function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.04]">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {tabs.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
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
        ))}
      </div>
    </nav>
  );
}
