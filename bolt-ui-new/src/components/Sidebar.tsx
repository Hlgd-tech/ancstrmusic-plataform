import { Home, Radio, Disc3, Layers, TrendingUp, Settings, Hexagon } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Radio, label: 'Live', active: false },
  { icon: Disc3, label: 'Drops', active: false },
  { icon: Layers, label: 'Vault', active: false },
  { icon: TrendingUp, label: 'Charts', active: false },
];

export default function Sidebar() {
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
        {navItems.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`
              group flex items-center gap-3 px-2 xl:px-3 py-3 rounded-lg transition-all duration-300 text-left
              ${active
                ? 'text-[#00eeff]'
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
        ))}
      </nav>

      {/* Settings */}
      <button className="flex items-center gap-3 px-2 xl:px-3 py-3 text-white/15 hover:text-white/50 transition-all duration-300 rounded-lg mt-auto">
        <Settings size={16} strokeWidth={1} className="flex-shrink-0" />
        <span className="hidden xl:block text-xs tracking-wider uppercase font-light">Settings</span>
      </button>
    </aside>
  );
}
