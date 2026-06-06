import { Search, Bell, Hexagon } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.03] flex-shrink-0 glass">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <div className="relative">
          <Hexagon size={22} strokeWidth={1} className="text-[#00eeff]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#00eeff] shadow-[0_0_4px_#00eeff]" />
          </div>
        </div>
        <span className="text-white/70 font-light text-xs tracking-[0.25em] uppercase">ancstr</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
        <Search size={13} strokeWidth={1} className="text-white/20" />
        <input
          type="text"
          placeholder="Search tracks, artists, drops..."
          className="bg-transparent text-xs text-white/40 placeholder:text-white/15 outline-none tracking-wide w-full font-light"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <button className="md:hidden text-white/20">
          <Search size={17} strokeWidth={1} />
        </button>
        <button className="relative text-white/20 hover:text-white/50 transition-colors duration-300">
          <Bell size={16} strokeWidth={1} />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_4px_#ff5500]" />
        </button>
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full border border-white/[0.08] flex items-center justify-center bg-white/[0.03] overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-[#00eeff]/10 to-[#ff5500]/10" />
        </div>
      </div>
    </header>
  );
}
