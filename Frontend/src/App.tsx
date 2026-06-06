import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LeftSidebar from './components/LeftSidebar';
import NowPlayingStage from './components/NowPlayingStage';
import RightPanel from './components/RightPanel';
import BottomSheet from './components/BottomSheet';
import WalletWidget from './components/WalletWidget';
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

  const handlePlayPause = useCallback(() => {
    setPlayer((p) => ({ ...p, isPlaying: !p.isPlaying }));
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#030508] text-white">
      {/* Elemento de audio real oculto */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Left Sidebar */}
      <LeftSidebar
        wallet={wallet}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onWalletClick={() => setWalletOpen(!walletOpen)}
      />
      {/* Center Stage */}
      <main className="flex-1 relative min-w-0">
        <NowPlayingStage
          player={player}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={handleSeek}
          onVolume={handleVolume}
          onShuffle={handleShuffle}
          onRepeat={handleRepeat}
          onMenuOpen={() => setMobileMenuOpen(true)}
          defaultTrack={DEFAULT_TRACK}
        />
      </main>
      {/* Right Panel */}
      <RightPanel
        albums={ALBUMS}
        queue={QUEUE}
        currentTrack={player.track}
        isPlaying={player.isPlaying}
        onQueuePlay={handleQueuePlay}
        earnProgress={EARN_PROGRESS}
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
