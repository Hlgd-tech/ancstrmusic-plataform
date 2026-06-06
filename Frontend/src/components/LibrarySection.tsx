import { useState } from 'react';
import { BookOpen, Award, Flame, Play, Clock, Heart, Shield } from 'lucide-react';
import { TRACKS } from '../data/tracks';

interface LibrarySectionProps {
  onPlayTrack: (track: any) => void;
  currentTrackId?: string;
}

export default function LibrarySection({ onPlayTrack, currentTrackId }: LibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<'purchased' | 'favorites'>('purchased');

  // Filtrar pistas simuladas
  const purchasedTracks = TRACKS.slice(0, 3); // Primeras 3 pistas simuladas como adquiridas
  const favoriteTracks = TRACKS.slice(2, 5);  // Algunas pistas como favoritas

  const displayTracks = activeTab === 'purchased' ? purchasedTracks : favoriteTracks;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#030508] p-6 lg:p-10 select-none">
      {/* Encabezado Holográfico */}
      <div className="mb-8 relative">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-cyan-500 glow-cyan-sm" />
        <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-[0.18em] text-white/90 font-sans">
          MY LIBRARY
        </h1>
        <p className="text-[10px] lg:text-xs font-mono tracking-wider text-white/30 mt-1 uppercase">
          Tus licencias de propiedad inmutable y colecciones de audio curadas.
        </p>
      </div>

      {/* Tarjetas de Estadísticas Neumórficas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-cyan-500/5 blur-[40px]" />
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Licencias en Propiedad</p>
            <p className="text-xl font-bold font-mono text-white/90 mt-0.5">3 Pistas</p>
          </div>
        </div>

        <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-magma-500/5 blur-[40px]" />
          <div className="w-10 h-10 rounded-xl bg-magma-500/10 border border-magma-500/20 flex items-center justify-center text-magma-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Tiempo de Escucha</p>
            <p className="text-xl font-bold font-mono text-white/90 mt-0.5">14.8 Horas</p>
          </div>
        </div>

        <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-green-500/5 blur-[40px]" />
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-mono tracking-widest text-white/30 uppercase">ANC Acumulado</p>
            <p className="text-xl font-bold font-mono text-white/90 mt-0.5">12,450.75</p>
          </div>
        </div>
      </div>

      {/* Pestañas Neumórficas */}
      <div className="flex gap-4 border-b border-white/[0.04] mb-6 pb-px">
        <button
          onClick={() => setActiveTab('purchased')}
          className={`pb-3 text-xs font-mono font-bold tracking-widest uppercase transition-colors relative ${
            activeTab === 'purchased' ? 'text-cyan-400' : 'text-white/30 hover:text-white/50'
          }`}
        >
          {activeTab === 'purchased' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-500 glow-cyan-xs" />
          )}
          Licencias Compradas
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 text-xs font-mono font-bold tracking-widest uppercase transition-colors relative ${
            activeTab === 'favorites' ? 'text-magma-400' : 'text-white/30 hover:text-white/50'
          }`}
        >
          {activeTab === 'favorites' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-magma-500 glow-magma-xs" />
          )}
          Colección Favoritos
        </button>
      </div>

      {/* Lista de Pistas Neumórfica */}
      <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">
        {displayTracks.length > 0 ? (
          <div className="divide-y divide-white/[0.03]">
            {displayTracks.map((track, idx) => {
              const isCurrent = track.id === currentTrackId;
              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-300 hover:bg-white/[0.02] ${
                    isCurrent ? 'bg-white/[0.01]' : ''
                  }`}
                >
                  {/* Número o Icono de Play */}
                  <div className="w-6 text-center font-mono text-xs text-white/20">
                    {isCurrent ? (
                      <Flame className="w-4 h-4 text-cyan-400 animate-pulse mx-auto" />
                    ) : (
                      <span>{String(idx + 1).padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* Portada Miniatura */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] shrink-0">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Título y Artista */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-400' : 'text-white/80'}`}>
                      {track.title}
                    </p>
                    <p className="text-[10px] font-mono text-white/30 mt-0.5 truncate">
                      {track.artist}
                    </p>
                  </div>

                  {/* Género */}
                  <div className="hidden sm:block">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.04] text-white/40 uppercase tracking-wider">
                      {track.genre}
                    </span>
                  </div>

                  {/* Calidad de Audio */}
                  <div className="hidden sm:block">
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400/80 uppercase tracking-widest">
                      {track.quality || 'LOSSLESS'}
                    </span>
                  </div>

                  {/* Duración */}
                  <div className="font-mono text-[10px] text-white/30">
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center text-white/10 gap-3">
            <BookOpen className="w-12 h-12 stroke-[1]" />
            <p className="text-xs font-mono uppercase tracking-widest">No hay pistas en esta colección</p>
          </div>
        )}
      </div>
    </div>
  );
}
