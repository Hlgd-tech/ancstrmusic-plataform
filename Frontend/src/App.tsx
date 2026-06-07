import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LeftSidebar from './components/new-ui/Sidebar';
import RightPanel from './components/new-ui/RightPanel';
import TopBar from './components/new-ui/TopBar';
import AICore from './components/new-ui/AICore';
import PlayerControls from './components/new-ui/PlayerControls';
import BottomTabBar from './components/new-ui/BottomTabBar';
import BottomSheet from './components/BottomSheet';
import WalletWidget from './components/WalletWidget';
import UploadSection from './components/UploadSection';
import LibrarySection from './components/LibrarySection';
import StakeSection from './components/StakeSection';
import { TRACKS, ALBUMS, QUEUE } from './data/tracks';
import { WalletState, PlayerState, QueueTrack } from './types';
import { toast } from 'sonner';

// Importaciones de Solana Wallet Adapter y Web3
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

import { ThemeProvider } from "./contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";

const DEFAULT_TRACK = TRACKS[0];
const EARN_PROGRESS = 0.52;

function MainApp() {
  // --- CONEXIÓN DE SOLANA WALLET ADAPTER REAL ---
  const { connection } = useConnection();
  const { select, connect, disconnect, wallets, publicKey, connected, wallet: activeWallet } = useWallet();

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    provider: null,
    balances: { SOL: 0, USDC: 0, USDT: 0 },
    ancBalance: 0,
    ancUSD: 0,
  });

  const [player, setPlayer] = useState<PlayerState>({
    track: DEFAULT_TRACK,
    isPlaying: false,
    progress: 0,
    volume: 0.8,
    shuffle: false,
    repeat: false,
  });

  const [activeNav, setActiveNav] = useState('discover');
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- MOTOR DE AUDIO REAL ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Sincronizar el estado de la wallet con Solana Wallet Adapter real
  useEffect(() => {
    if (connected && publicKey) {
      const fetchBalance = async () => {
        try {
          const bal = await connection.getBalance(publicKey);
          const solBal = bal / 1e9;
          setWallet({
            connected: true,
            address: publicKey.toBase58(),
            provider: activeWallet?.adapter.name.toLowerCase().includes('phantom') ? 'phantom' : 'solflare',
            balances: { SOL: solBal, USDC: 124.50, USDT: 80.00 }, // USDC/USDT de muestra
            ancBalance: 12450.75,
            ancUSD: 8745.20,
          });
        } catch (err) {
          console.error("Error al obtener balance de Solana:", err);
        }
      };
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000); // Actualizar cada 10s
      return () => clearInterval(interval);
    } else {
      setWallet({
        connected: false,
        address: null,
        provider: null,
        balances: { SOL: 0, USDC: 0, USDT: 0 },
        ancBalance: 0,
        ancUSD: 0,
      });
    }
  }, [connected, publicKey, activeWallet, connection]);

  // Sincronizar el elemento de audio con el estado de reproducción
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (player.isPlaying) {
      // Inicializar AudioContext en el primer gesto del usuario
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Conectar el elemento <audio> al analizador
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
        // Exponer el analizador globalmente para que el Canvas WebGL acceda con latencia cero
        (window as any).__AUDIO_ANALYSER__ = analyser;
      }

      if (!sourceRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
          sourceRef.current = source;
        } catch (e) {
          console.warn("AudioContext ya estaba conectado o falló la conexión:", e);
        }
      }

      audioRef.current.play().catch(err => {
        console.error("Error al reproducir audio:", err);
        setPlayer(prev => ({ ...prev, isPlaying: false }));
      });
    } else {
      audioRef.current.pause();
    }
  }, [player.isPlaying]);

  // Sincronizar el src del audio cuando cambia de pista
  useEffect(() => {
    if (!audioRef.current || !player.track) return;

    const hash = player.track.ipfs_audio_hash || player.track.id;
    let url = "";
    if (hash.startsWith("Qm") || hash.startsWith("ba")) {
      url = `${import.meta.env.VITE_API_URL || 'https://ancstrmusic-plataform-1.onrender.com'}/ipfs/stream/${hash}`;
    } else {
      url = hash; // Es una URL directa
    }

    audioRef.current.src = url;
    audioRef.current.load();
    
    if (player.isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Error al reproducir pista nueva:", err);
        setPlayer(prev => ({ ...prev, isPlaying: false }));
      });
    }
  }, [player.track]);

  // Sincronizar el volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.volume;
    }
  }, [player.volume]);

  // Manejar el progreso en tiempo real
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setPlayer(prev => ({ ...prev, progress: current / dur }));
  };

  const handleAudioEnded = () => {
    handleNext();
  };

  // Manejador de errores para URLs de IPFS lentas o rotas - Carga audio de respaldo automático
  const handleAudioError = () => {
    if (!audioRef.current || !player.track) return;
    console.warn("Fallo al cargar la pista desde IPFS, cargando audio de respaldo de alta fidelidad...");
    
    // Si ya es un blob o una URL directa que falló, no ciclar infinitamente
    if (audioRef.current.src.startsWith("blob:") || audioRef.current.src.includes("soundhelix.com")) {
      return;
    }

    // Usar una URL de respaldo de SoundHelix
    const songNum = (parseInt(player.track.id) || 1) % 8 + 1;
    const fallbackUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNum}.mp3`;
    
    audioRef.current.src = fallbackUrl;
    audioRef.current.load();
    if (player.isPlaying) {
      audioRef.current.play().catch(err => console.error("Error al reproducir audio de respaldo:", err));
    }
  };

  const handlePlayPause = useCallback(() => {
    setPlayer((p) => {
      const nextPlaying = !p.isPlaying;
      
      // Inicializar/Reanudar AudioContext directamente en el hilo de interacción del usuario
      if (nextPlaying) {
        try {
          if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
          }
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        } catch (e) {
          console.warn("No se pudo inicializar el AudioContext en el gesto del usuario:", e);
        }
      }
      
      return { ...p, isPlaying: nextPlaying };
    });
  }, []);

  const handleNext = useCallback(() => {
    setPlayer((p) => {
      const idx = TRACKS.findIndex((t) => t.id === (p.track?.id ?? DEFAULT_TRACK.id));
      return { ...p, track: TRACKS[(idx + 1) % TRACKS.length], progress: 0, isPlaying: true };
    });
  }, []);

  const handlePrev = useCallback(() => {
    setPlayer((p) => {
      const idx = TRACKS.findIndex((t) => t.id === (p.track?.id ?? DEFAULT_TRACK.id));
      return { ...p, track: TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length], progress: 0, isPlaying: true };
    });
  }, []);

  const handleSeek = useCallback((progress: number) => {
    if (audioRef.current) {
      const dur = audioRef.current.duration || 0;
      audioRef.current.currentTime = progress * dur;
    }
    setPlayer((p) => ({ ...p, progress }));
  }, []);

  const handleVolume = useCallback((volume: number) => {
    setPlayer((p) => ({ ...p, volume }));
  }, []);

  const handleShuffle = useCallback(() => {
    setPlayer((p) => ({ ...p, shuffle: !p.shuffle }));
  }, []);

  const handleRepeat = useCallback(() => {
    setPlayer((p) => ({ ...p, repeat: !p.repeat }));
  }, []);

  const handleQueuePlay = useCallback((qt: QueueTrack) => {
    const found = TRACKS.find((t) => t.title === qt.title) ?? {
      ...DEFAULT_TRACK,
      id: qt.id,
      title: qt.title,
      artist: qt.artist,
      cover: qt.cover,
      duration: qt.duration,
    };
    setPlayer((p) => ({ ...p, track: found, progress: 0, isPlaying: true }));
  }, []);

  const handleConnect = useCallback(async (provider: 'phantom' | 'solflare') => {
    const walletName = provider === 'phantom' ? 'Phantom' : 'Solflare';
    const selectedWallet = wallets.find(w => w.adapter.name === walletName);
    
    if (selectedWallet) {
      try {
        select(selectedWallet.adapter.name);
        setWalletOpen(false);
        toast.success(`Conectando con ${walletName}...`);
      } catch (err) {
        console.error("Error al conectar wallet:", err);
        toast.error(`Error al conectar con ${walletName}.`);
      }
    } else {
      toast.error(`Wallet ${walletName} no encontrada. Asegúrate de tener instalada su extensión.`);
    }
  }, [wallets, select]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setWalletOpen(false);
    toast.info("Wallet desconectada.");
  }, [disconnect]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030508] text-white font-['Inter'] relative">
      {/* Elemento de audio real oculto */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="auto"
        crossOrigin="anonymous"
      />

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
      <LeftSidebar
        wallet={wallet}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onWalletClick={() => setWalletOpen(!walletOpen)}
      />

      {/* CENTER — Main content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top bar */}
        <TopBar wallet={wallet} onWalletClick={() => setWalletOpen(!walletOpen)} />

        {/* Interior Views and AI Core Area */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          
          {/* Status chip — only shown when in Discover view */}
          {activeNav === 'discover' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl">
              <span className="text-[9px] text-white/25 tracking-[0.3em] uppercase">
                {player.isPlaying ? 'Processing audio stream' : 'Standby mode'}
              </span>
              <div className={`w-1 h-1 rounded-full transition-all duration-500 ${
                player.isPlaying ? 'bg-[#00eeff] shadow-[0_0_4px_#00eeff] animate-shimmer' : 'bg-white/15'
              }`} />
            </div>
          )}

          {/* Core content routing */}
          <div className="flex-1 relative overflow-y-auto">
            {activeNav === 'discover' ? (
              <div className="absolute inset-0 w-full h-full">
                {/* 3D WebGL Canvas Sphere */}
                <AICore
                  isPlaying={player.isPlaying}
                  progress={player.progress}
                  analyserNode={analyserRef.current}
                />

                {/* Center text overlay when paused */}
                {!player.isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
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
            ) : activeNav === 'upload' ? (
              <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto">
                <UploadSection
                  walletConnected={wallet.connected}
                  onUploadSuccess={(newTrack) => {
                    TRACKS.unshift(newTrack);
                    setPlayer(prev => ({ ...prev, track: newTrack, isPlaying: true, progress: 0 }));
                    toast.success(`¡"${newTrack.title}" registrada con éxito!`);
                  }}
                />
              </div>
            ) : activeNav === 'library' ? (
              <div className="p-4 md:p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto">
                <LibrarySection
                  onPlayTrack={(track) => {
                    setPlayer(prev => ({ ...prev, track, isPlaying: true, progress: 0 }));
                  }}
                  currentTrackId={player.track?.id}
                />
              </div>
            ) : activeNav === 'stake' ? (
              <div className="p-4 md:p-8 max-w-4xl mx-auto w-full h-full overflow-y-auto">
                <StakeSection
                  walletConnected={wallet.connected}
                  ancBalance={wallet.ancBalance}
                />
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-[#030508] font-mono text-[10px] text-white/20 uppercase tracking-[0.2em] gap-3">
                <Settings className="w-8 h-8 animate-spin-slow stroke-[1]" />
                <span>Próximamente: {activeNav}</span>
              </div>
            )}
          </div>

          {/* Player controls — float above the bottom tab bar on mobile */}
          <div className="relative z-10 pb-16 md:pb-0">
            <PlayerControls
              player={player}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrev={handlePrev}
              onSeek={handleSeek}
              onVolume={handleVolume}
              onShuffle={handleShuffle}
              onRepeat={handleRepeat}
            />
          </div>
        </div>
      </main>

      {/* RIGHT — Context panel */}
      <RightPanel
        queue={QUEUE}
        currentTrack={player.track}
        isPlaying={player.isPlaying}
        onQueuePlay={handleQueuePlay}
      />
      {/* Wallet Widget overlay */}
      <AnimatePresence>
        {walletOpen && (
          <>
            <motion.div
              key="wbg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setWalletOpen(false)}
            />
            <motion.div
              key="wwidget"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="fixed top-4 z-50 left-4 lg:left-[232px]"
            >
              <WalletWidget
                wallet={wallet}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onClose={() => setWalletOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Mobile Bottom Sheet */}
      <BottomSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        wallet={wallet}
        queue={QUEUE}
        currentTrack={player.track}
        isPlaying={player.isPlaying}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onWalletClick={() => setWalletOpen(true)}
        onQueuePlay={handleQueuePlay}
      />

      {/* MOBILE — Bottom tab bar */}
      <BottomTabBar activeNav={activeNav} onNavChange={setActiveNav} />
    </div>
  );
}

export default function App() {
  // Configurar la red y el endpoint de Solana (Devnet)
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configurar las wallets soportadas
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ThemeProvider defaultTheme="dark">
              <TooltipProvider>
                <Toaster />
                <MainApp />
              </TooltipProvider>
            </ThemeProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
}
