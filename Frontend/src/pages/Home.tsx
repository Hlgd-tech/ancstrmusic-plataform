import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import HoloSphereVisualizer from "@/components/HoloSphereVisualizer";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Volume, VolumeX, Music, 
  Upload, Disc, ArrowRight, ShieldCheck, 
  Coins, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Loader2,
  TrendingUp, History, Heart, Send, DollarSign, Share2, Award, User, Image, MessageSquare,
  ChevronDown, Download, X, Smartphone, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Importaciones de Solana Wallet Adapter y Web3
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";

// --- DATOS INICIALES ---
interface Track {
  track_id: string;
  title: string;
  artist_name: string;
  artist_wallet: string;
  album: string;
  genre: string;
  duration: number;
  ipfs_audio_hash: string;
  ipfs_cover_hash: string;
  price_sol: number;
  price_usdc: number;
  price_usdt: number;
  price_eth: number;
  price_btc: number;
  sales_count: number;
  is_streamable_free: boolean;
  likes?: number;
}

interface PurchaseRecord {
  track_id: string;
  title: string;
  artist_name: string;
  ipfs_cover_hash: string;
  amount_paid: number;
  currency: string;
  timestamp: number;
  cnft_address?: string;
  merkle_tree?: string;
}

// Lista de gateways públicos de IPFS como respaldo
const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];

// GÉNEROS MUSICALES INSPIRADOS EN SPOTIFY
const SPOTIFY_GENRES = [
  "Pop", "Hip Hop", "Rap", "Rock", "Electronic", "House", "Techno", "Ambient", 
  "Synthwave", "Lo-Fi / Beats", "R&B", "Reggae", "Reggaeton", "Latin", "Jazz", 
  "Blues", "Classical", "Acoustic / Indie", "Metal", "Drum & Bass", "Dubstep", 
  "Chill", "Disco", "Funk", "Soul", "Folk", "Country", "Punk", "K-Pop", "Afrobeats"
];

const INITIAL_TRACKS: Track[] = [
  {
    track_id: "track-1",
    title: "Decentralized Dreams",
    artist_name: "Satoshi Sound",
    artist_wallet: "Art1stSolanaWa11etAddressX111111111111111",
    album: "Genesis Blocks",
    genre: "Ambient",
    duration: 245,
    ipfs_audio_hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    ipfs_cover_hash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp",
    price_sol: 0.15,
    price_usdc: 5.00,
    price_usdt: 5.00,
    price_eth: 0.0015,
    price_btc: 0.00008,
    sales_count: 42,
    is_streamable_free: true,
    likes: 124
  },
  {
    track_id: "track-2",
    title: "USDC Groove",
    artist_name: "Web3 Wave",
    artist_wallet: "Art2stSolanaWa11etAddressY222222222222222",
    album: "Stable Beats",
    genre: "Synthwave",
    duration: 198,
    ipfs_audio_hash: "QmYwAPz9yyRMT93fnG7G9Bq8Gg9Bq8Gg9Bq8Gg9Bq8Gg9B",
    ipfs_cover_hash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_stable-ZkbAmoDjUkftQcV24apMRo.webp",
    price_sol: 0.09,
    price_usdc: 3.00,
    price_usdt: 3.00,
    price_eth: 0.0009,
    price_btc: 0.00005,
    sales_count: 18,
    is_streamable_free: true,
    likes: 56
  },
  {
    track_id: "track-3",
    title: "Solana Summer",
    artist_name: "Anchor Band",
    artist_wallet: "Art1stSolanaWa11etAddressX111111111111111",
    album: "Proof of History",
    genre: "House",
    duration: 312,
    ipfs_audio_hash: "QmZz9zG7p98R7L7H7U98YgU78R7L7H7U98YgU78R7L7H7U",
    ipfs_cover_hash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_history-iKDCRAzXkDSabWpUUxBDQ8.webp",
    price_sol: 0.25,
    price_usdc: 8.00,
    price_usdt: 8.00,
    price_eth: 0.0025,
    price_btc: 0.00013,
    sales_count: 105,
    is_streamable_free: false,
    likes: 312
  }
];

export default function Home() {
  // --- HOOKS REALES DE SOLANA ---
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  // --- ESTADOS ---
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [activeTab, setActiveTab] = useState<string>("player");
  const [isAncstrEraOpen, setIsAncstrEraOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isUpNextOpen, setIsUpNextOpen] = useState(true);
  const [isEarnAncOpen, setIsEarnAncOpen] = useState(true);

  // --- ESTADOS PWA ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentTrack, setCurrentTrack] = useState<Track>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Saldos reales y simulados
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(50.0);
  const [usdtBalance, setUsdtBalance] = useState<number>(35.0);
  const [ethBalance, setEthBalance] = useState<number>(0.12);
  const [btcBalance, setBtcBalance] = useState<number>(0.0045);

  const [purchasedTracks, setPurchasedTracks] = useState<string[]>(["track-1", "track-2"]);
  const [userHistory, setUserHistory] = useState<PurchaseRecord[]>([
    {
      track_id: "track-1",
      title: "Decentralized Dreams",
      artist_name: "Satoshi Sound",
      ipfs_cover_hash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp",
      amount_paid: 0.15,
      currency: "SOL",
      timestamp: Date.now() - 86400000 * 2
    },
    {
      track_id: "track-2",
      title: "USDC Groove",
      artist_name: "Web3 Wave",
      ipfs_cover_hash: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_stable-ZkbAmoDjUkftQcV24apMRo.webp",
      amount_paid: 3.00,
      currency: "USDC",
      timestamp: Date.now() - 3600000 * 5
    }
  ]);

  // Panel de Subida Artista
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newPriceSol, setNewPriceSol] = useState("0.1");
  const [newPriceUsdc, setNewPriceUsdc] = useState("3.0");
  const [newPriceUsdt, setNewPriceUsdt] = useState("3.0");
  const [newPriceEth, setNewPriceEth] = useState("0.001");
  const [newPriceBtc, setNewPriceBtc] = useState("0.00005");
  
  // Estado de subida de archivos real a IPFS
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadedAudioHash, setUploadedAudioHash] = useState("");
  const [uploadedCoverHash, setUploadedCoverHash] = useState("");

  // Simulación/Procesamiento de Transacción activa
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [txSplitDetails, setTxSplitDetails] = useState<{
    artistShare: number;
    platformShare: number;
    currency: string;
    signature?: string;
  } | null>(null);

  // Módulo Social & Propinas
  const [tipAmount, setTipAmount] = useState("1.0");
  const [tipCurrency, setTipCurrency] = useState("SOL");
  const [isProcessingTip, setIsProcessingTip] = useState(false);
  const [likedTracks, setLikedTracks] = useState<string[]>(["track-1"]);

  // Muro de Comentarios Descentralizados
  const [comments, setComments] = useState<any[]>([
    {
      comment_id: "comment-1",
      artist_wallet: "Art1stSolanaWa11etAddressX111111111111111",
      author_wallet: "Buy1stSolanaWa11etAddressZ999999999999999",
      author_name: "DecentralizedLover",
      text: "¡Me encanta esta pista! El bajo se siente increíble en el reproductor analógico de ANCSTR.",
      timestamp: Date.now() - 86400000,
      has_license: true
    },
    {
      comment_id: "comment-2",
      artist_wallet: "Art1stSolanaWa11etAddressX111111111111111",
      author_wallet: "AnonSolanaWa11etAddress00000000000000000",
      author_name: "Anon listener",
      text: "Satoshi Sound nunca defrauda, gran diseño de sonido.",
      timestamp: Date.now() - 3600000 * 4,
      has_license: false
    }
  ]);
  const [newCommentText, setNewCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // --- REFERENCIAS ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // --- REFERENCIAS WEBGL ---
  const webglSceneRef = useRef<THREE.Scene | null>(null);
  const webglCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const webglRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const webglParticlesRef = useRef<THREE.Points | null>(null);
  const webglLineRef = useRef<THREE.Line | null>(null);
  const webglGlowRef = useRef<THREE.Mesh | null>(null);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  // --- WEB AUDIO API & INTERACTIVIDAD ---
  const [playbackRate, setPlaybackRate] = useState(1.0); // Pitch / BPM control
  const [dynamicFrequencies, setDynamicFrequencies] = useState<number[]>([20, 40, 15, 30, 45, 25, 35, 18, 28, 32, 22, 40, 16]); // Alturas dinámicas de las ondas
  const [bassIntensity, setBassIntensity] = useState(0); // Intensidad de bajos para el neón pulsante
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // --- CONSTRUIR URL DE IPFS ---
  const getAudioUrl = (hash: string) => {
    if (hash.startsWith("Qm") || hash.startsWith("ba")) {
      return `${import.meta.env.VITE_API_URL || 'https://ancstrmusic-plataform-1.onrender.com'}/ipfs/stream/${hash}`;
    }
    if (hash.startsWith("http")) {
      return hash;
    }
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  };

  // --- EFECTOS ---
  // Detección de PWA e Instalación
  useEffect(() => {
    // 1. Detectar si ya está instalada (en modo standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log("La dApp ya se está ejecutando en modo standalone (instalada).");
      return;
    }

    // 2. Detectar si es iOS (Safari)
    const ua = window.navigator.userAgent;
    const isAppleIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua);
    
    if (isAppleIOS) {
      setIsIOS(true);
      // Mostrar banner de iOS si no se ha cerrado en esta sesión
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        // Retrasar la aparición del banner holográfico para una experiencia no intrusiva
        const timer = setTimeout(() => setShowInstallBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // 3. Capturar el evento beforeinstallprompt (Android / Escritorio Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Capturar evento de instalación exitosa
    const handleAppInstalled = () => {
      console.log('¡ANCSTR dApp instalada con éxito!');
      setIsInstalling(false);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      
      // Cerrar el banner holográfico automáticamente después de 3.5 segundos de celebrar el éxito
      setTimeout(() => {
        setShowInstallBanner(false);
        // Marcar como descartado para que no vuelva a molestar
        localStorage.setItem('pwa-banner-dismissed', 'true');
      }, 3500);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Obtener saldo real de Solana al conectar wallet
  useEffect(() => {
    if (connected && publicKey) {
      const getBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setSolBalance(Number((balance / LAMPORTS_PER_SOL).toFixed(4)));
        } catch (error) {
          console.error("Error al obtener saldo:", error);
          setSolBalance(2.5);
        }
      };
      getBalance();
      const interval = setInterval(getBalance, 10000);
      return () => clearInterval(interval);
    } else {
      setSolBalance(null);
    }
  }, [connected, publicKey, connection]);

  // Sincronizar velocidad de reproducción (Pitch / BPM)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentTrack]);

  // Inicializar Web Audio API para análisis de audio real
  const initAudioAnalyser = () => {
    if (!audioRef.current) return;
    
    try {
      // Crear AudioContext solo tras interacción del usuario
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        // Aumentamos fftSize para capturar mejor los datos de forma de onda del osciloscopio
        analyser.fftSize = 512; 
        analyserRef.current = analyser;
      }
      
      if (!sourceRef.current) {
        // Conectar el elemento <audio> al analizador
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
        sourceRef.current = source;
      }
      
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArrayFreq = new Uint8Array(bufferLength);
      const dataArrayTime = new Uint8Array(bufferLength);
      
      let phaseOffset1 = 0;
      let phaseOffset2 = 0;
      
      const updateFrequencies = () => {
        // Capturar datos de forma de onda en tiempo real
        if (isPlaying) {
          analyser.getByteTimeDomainData(dataArrayTime);
        } else {
          dataArrayTime.fill(128);
        }

        // 1. ANIMAR Y RENDERIZAR WEBGL 3D (THREE.JS)
        const scene = webglSceneRef.current;
        const camera = webglCameraRef.current;
        const renderer = webglRendererRef.current;
        const particles = webglParticlesRef.current;
        const line = webglLineRef.current;
        const glow = webglGlowRef.current;

        if (scene && camera && renderer) {
          const time = Date.now() * 0.001;

          // A. Rotación continua del orbe de partículas, acelerando según bajos
          if (particles) {
            const rotSpeed = 0.005 + (bassIntensity * 0.025);
            particles.rotation.y += rotSpeed;
            particles.rotation.x = Math.sin(time * 0.1) * 0.15; // Leve inclinación orbital

            // Vibración y modulación de partículas individuales
            const geometry = particles.geometry;
            const positions = geometry.attributes.position.array as Float32Array;
            const initialPositions = geometry.userData.initialPositions as Float32Array;
            const count = positions.length / 3;

            for (let i = 0; i < count; i++) {
              const ix = i * 3;
              const iy = i * 3 + 1;
              const iz = i * 3 + 2;

              // Posiciones originales
              const x0 = initialPositions[ix];
              const y0 = initialPositions[iy];
              const z0 = initialPositions[iz];

              // Aplicar distorsión de onda basada en bajos e índice de partícula
              const noiseFactor = isPlaying ? (0.05 + bassIntensity * 0.28) : 0.02;
              const wave = Math.sin(y0 * 2.0 + time * 4.0 + i * 0.01) * noiseFactor;

              // Desplazar radialmente
              positions[ix] = x0 + (x0 * wave);
              positions[iy] = y0 + (y0 * wave);
              positions[iz] = z0 + (z0 * wave);
            }
            geometry.attributes.position.needsUpdate = true;
          }

          // B. Deformación del osciloscopio de línea 3D (Onda real de neón)
          if (line) {
            const lineGeometry = line.geometry;
            const linePositions = lineGeometry.attributes.position.array as Float32Array;
            const count = linePositions.length / 3;

            for (let i = 0; i < count; i++) {
              const iy = i * 3 + 1;

              // Mapear los datos de forma de onda (0 a 255) a la coordenada Y de la línea 3D
              // Muestrear de forma distribuida el buffer de tiempo real
              const sampleIdx = Math.min(Math.floor(i * (dataArrayTime.length / count)), dataArrayTime.length - 1);
              const v = dataArrayTime[sampleIdx] / 128.0 - 1.0; // Desviación de -1.0 a 1.0

              // Atenuación de campana en los bordes para fundirse con la esfera
              const edgeAttenuation = Math.sin((i / (count - 1)) * Math.PI);
              
              // Deformación vertical (Y)
              linePositions[iy] = v * 2.8 * edgeAttenuation;
            }
            lineGeometry.attributes.position.needsUpdate = true;
          }

          // C. Pulsación física del orbe de brillo central
          if (glow) {
            const scale = 1.0 + (bassIntensity * 0.35);
            glow.scale.set(scale, scale, scale);
            const glowMaterial = glow.material as THREE.MeshBasicMaterial;
            if (glowMaterial) {
              glowMaterial.opacity = 0.05 + (bassIntensity * 0.15); // Más brillante con los bajos
            }
          }

          // D. Renderizar escena en la GPU
          renderer.render(scene, camera);
        }
        
        // 2. ACTUALIZAR FRECUENCIAS PARA EL BANNER DE FONDO Y PULSO DE BAJOS
        if (!isPlaying) {
          // Si está pausado, reducir suavemente las barras a un estado de reposo
          setDynamicFrequencies(prev => prev.map(val => Math.max(10, val - 1.5)));
          setBassIntensity(prev => Math.max(0, prev - 0.05));
          animationFrameIdRef.current = requestAnimationFrame(updateFrequencies);
          return;
        }
        
        analyser.getByteFrequencyData(dataArrayFreq);
        
        // Mapear los datos de frecuencia a las 13 barras del banner
        const newFreqs = [];
        let lowFreqSum = 0; // Para medir la intensidad de los bajos (primeros bins)
        
        for (let i = 0; i < 13; i++) {
          // Tomamos una muestra distribuida de frecuencias
          const binIndex = Math.min(Math.floor(i * (bufferLength / 13)), bufferLength - 1);
          const val = dataArrayFreq[binIndex];
          // Convertir rango 0-255 a escala de píxeles/porcentaje (10px a 50px de altura)
          const height = Math.max(8, (val / 255) * 45);
          newFreqs.push(height);
          
          if (i < 4) {
            lowFreqSum += val; // Primeros bins corresponden a los bajos
          }
        }
        
        // Calcular intensidad de bajos para el resplandor de neón (0 a 1)
        const avgBass = lowFreqSum / 4;
        setBassIntensity(avgBass / 255);
        setDynamicFrequencies(newFreqs);
        
        animationFrameIdRef.current = requestAnimationFrame(updateFrequencies);
      };
      
      // Cancelar cualquier loop previo antes de iniciar uno nuevo
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      updateFrequencies();
      
    } catch (e) {
      console.warn("La inicialización de Web Audio API falló (CORS o restricción de navegador):", e);
      
      // Fallback: Generador de ondas aleatorias fluidas y renderizado de WebGL 3D en modo offline
      const fallbackLoop = () => {
        // 1. ANIMAR Y RENDERIZAR WEBGL 3D (THREE.JS)
        const scene = webglSceneRef.current;
        const camera = webglCameraRef.current;
        const renderer = webglRendererRef.current;
        const particles = webglParticlesRef.current;
        const line = webglLineRef.current;
        const glow = webglGlowRef.current;

        if (scene && camera && renderer) {
          const time = Date.now() * 0.001;

          // A. Rotación continua del orbe de partículas, acelerando según bajos
          if (particles) {
            const rotSpeed = 0.005 + (bassIntensity * 0.025);
            particles.rotation.y += rotSpeed;
            particles.rotation.x = Math.sin(time * 0.1) * 0.15; // Leve inclinación orbital

            // Vibración y modulación de partículas individuales
            const geometry = particles.geometry;
            const positions = geometry.attributes.position.array as Float32Array;
            const initialPositions = geometry.userData.initialPositions as Float32Array;
            const count = positions.length / 3;

            for (let i = 0; i < count; i++) {
              const ix = i * 3;
              const iy = i * 3 + 1;
              const iz = i * 3 + 2;

              // Posiciones originales
              const x0 = initialPositions[ix];
              const y0 = initialPositions[iy];
              const z0 = initialPositions[iz];

              // Aplicar distorsión de onda basada en bajos e índice de partícula
              const noiseFactor = isPlaying ? (0.05 + bassIntensity * 0.28) : 0.02;
              const wave = Math.sin(y0 * 2.0 + time * 4.0 + i * 0.01) * noiseFactor;

              // Desplazar radialmente
              positions[ix] = x0 + (x0 * wave);
              positions[iy] = y0 + (y0 * wave);
              positions[iz] = z0 + (z0 * wave);
            }
            geometry.attributes.position.needsUpdate = true;
          }

          // B. Deformación del osciloscopio de línea 3D (Simulación de onda)
          if (line) {
            const lineGeometry = line.geometry;
            const linePositions = lineGeometry.attributes.position.array as Float32Array;
            const count = linePositions.length / 3;

            for (let i = 0; i < count; i++) {
              const iy = i * 3 + 1;

              // Simular datos de forma de onda senoidal orgánica compleja en fallback
              let deviation = 0;
              if (isPlaying) {
                deviation = Math.sin(i * 0.15 - time * 5.0) * 0.35 + 
                            Math.cos(i * 0.08 + time * 7.5) * 0.18 + 
                            Math.sin(i * 0.35 - time * 3.5) * 0.06;
              }

              // Atenuación de campana en los bordes para fundirse con la esfera
              const edgeAttenuation = Math.sin((i / (count - 1)) * Math.PI);
              
              // Deformación vertical (Y)
              linePositions[iy] = deviation * 2.8 * edgeAttenuation;
            }
            lineGeometry.attributes.position.needsUpdate = true;
          }

          // C. Pulsación física del orbe de brillo central
          if (glow) {
            const scale = 1.0 + (bassIntensity * 0.35);
            glow.scale.set(scale, scale, scale);
            const glowMaterial = glow.material as THREE.MeshBasicMaterial;
            if (glowMaterial) {
              glowMaterial.opacity = 0.05 + (bassIntensity * 0.15); // Más brillante con los bajos
            }
          }

          // D. Renderizar escena en la GPU
          renderer.render(scene, camera);
        }
        
        if (isPlaying) {
          setDynamicFrequencies(prev => prev.map(() => Math.max(8, Math.floor(Math.random() * 38) + 8)));
          setBassIntensity(Math.random() * 0.4 + 0.1);
        } else {
          setDynamicFrequencies(prev => prev.map(val => Math.max(8, val - 1)));
          setBassIntensity(0);
        }
        animationFrameIdRef.current = requestAnimationFrame(fallbackLoop);
      };
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(fallbackLoop);
    }
  };

  // Limpiar loop de animación al desmontar
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // --- INICIALIZACIÓN Y CONTROL DE WEBGL (THREE.JS) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Inicializar Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    webglSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 15;
    webglCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    webglRendererRef.current = renderer;

    // 2. Crear Orbe de Partículas Holográficas (1500 partículas en 3D)
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3); // Para recordar la órbita original

    const colorBlue = new THREE.Color("#06b6d4"); // Cyan neón
    const colorOrange = new THREE.Color("#f97316"); // Naranja neón

    for (let i = 0; i < particleCount; i++) {
      // Distribución esférica aleatoria
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.5 + Math.random() * 0.5; // Radio aproximado del orbe

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      // Degradado cromático basado en la posición Y
      const mixRatio = (y + r) / (r * 2); // 0 a 1
      const mixedColor = new THREE.Color().lerpColors(colorBlue, colorOrange, mixRatio);

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.userData = { initialPositions }; // Guardar posiciones originales

    // Material de partículas con brillo suave
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    webglParticlesRef.current = particles;

    // 3. Crear el Osciloscopio 3D (Línea de neón naranja)
    const lineSegmentCount = 128;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(lineSegmentCount * 3);

    for (let i = 0; i < lineSegmentCount; i++) {
      const pct = i / (lineSegmentCount - 1);
      const x = (pct - 0.5) * 8.5; // Cruzar el orbe horizontalmente
      linePositions[i * 3] = x;
      linePositions[i * 3 + 1] = 0;
      linePositions[i * 3 + 2] = 0;
    }

    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf97316, // Naranja neón principal
      linewidth: 3, // Depende del soporte de WebGL de la GPU
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    webglLineRef.current = line;

    // 4. Crear un Orbe de Brillo Central de Neón Suave
    const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      wireframe: false
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);
    webglGlowRef.current = glowMesh;

    // 5. Manejar el redimensionamiento del lienzo de WebGL
    const handleResize = () => {
      if (!canvas || !webglRendererRef.current || !webglCameraRef.current) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      webglCameraRef.current.aspect = w / h;
      webglCameraRef.current.updateProjectionMatrix();

      webglRendererRef.current.setSize(w, h);
    };

    // Registrar el ResizeObserver para detectar cambios de tamaño del canvas al colapsar el panel
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvas);

    window.addEventListener("resize", handleResize);

    // Limpieza al desmontar
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      
      webglSceneRef.current = null;
      webglCameraRef.current = null;
      webglRendererRef.current = null;
      webglParticlesRef.current = null;
      webglLineRef.current = null;
      webglGlowRef.current = null;
    };
  }, [isRightPanelOpen]);

  // Eliminamos la inicialización automática de AudioContext al montar para evitar el bloqueo por políticas de Autoplay del navegador.
  // El AudioContext se creará y reanudará estrictamente tras un gesto del usuario (hacer clic en Play).

  // Manejar cambios en la reproducción del elemento <audio> con inicialización diferida de AudioContext
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Inicializar/Reanudar analizador de audio estrictamente antes de reproducir para asegurar que el contexto de audio esté activo en el mismo hilo de ejecución del gesto de usuario
      initAudioAnalyser();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Fallo al iniciar reproducción de audio:", error);
          if (gatewayIndex < IPFS_GATEWAYS.length - 1) {
            setGatewayIndex((prev) => prev + 1);
          } else {
            setGatewayIndex(0);
          }
          setIsPlaying(false);
          toast.error("Error al cargar la pista desde IPFS", {
            description: "Intentando reconectar con un nodo alternativo de IPFS. Por favor presiona ESCUCHAR de nuevo."
          });
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, gatewayIndex]);

  // Sincronizar volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // --- CONTROLADORES DE AUDIO ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
      if (audioRef.current.duration) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(Math.floor(audioRef.current.duration || currentTrack.duration));
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    handleNext();
  };

  const handlePlayPause = () => {
    if (!currentTrack.is_streamable_free && !purchasedTracks.includes(currentTrack.track_id)) {
      toast.error("Esta pista requiere compra previa para streaming (Licencia Digital).", {
        description: "Adquiere la licencia digital para desbloquear la reproducción completa."
      });
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const currentIndex = tracks.findIndex(t => t.track_id === currentTrack.track_id);
    if (currentIndex < tracks.length - 1) {
      setCurrentTrack(tracks[currentIndex + 1]);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const handlePrev = () => {
    const currentIndex = tracks.findIndex(t => t.track_id === currentTrack.track_id);
    if (currentIndex > 0) {
      setCurrentTrack(tracks[currentIndex - 1]);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- COMPRA DIRECTA CON SPLIT DE PAGOS (85% Artista / 15% Plataforma) ---
  const handlePurchase = async (track: Track, currency: "SOL" | "USDC" | "USDT" | "ETH" | "BTC") => {
    if (!connected && currency === "SOL") {
      toast.error("Por favor conecta tu wallet de Solana.");
      return;
    }

    setIsProcessingTx(true);
    const price = currency === "SOL" ? track.price_sol : 
                  currency === "USDC" ? track.price_usdc :
                  currency === "USDT" ? track.price_usdt :
                  currency === "ETH" ? track.price_eth : track.price_btc;

    const platformShare = Number((price * 0.15).toFixed(6));
    const artistShare = Number((price - platformShare).toFixed(6));

    setTxSplitDetails({
      artistShare,
      platformShare,
      currency
    });

    try {
      if (currency === "SOL" && publicKey) {
        const artistPubkey = new PublicKey(track.artist_wallet.startsWith("Art") ? "Hw8N9gYg4W7Pq6rX7y7K9gYg4W7Pq6rX7y7K9gYg4W7P" : track.artist_wallet);
        const platformPubkey = new PublicKey("Hw8N9gYg4W7Pq6rX7y7K9gYg4W7Pq6rX7y7K9gYg4W7P");

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: artistPubkey,
            lamports: Math.floor(artistShare * LAMPORTS_PER_SOL),
          }),
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: platformPubkey,
            lamports: Math.floor(platformShare * LAMPORTS_PER_SOL),
          })
        );

        const signature = await sendTransaction(transaction, connection);
        
        toast.info("Transacción enviada", {
          description: "Esperando confirmación en Solana Devnet..."
        });
        
        await connection.confirmTransaction(signature, "processed");

        setPurchasedTracks(prev => [...prev, track.track_id]);
        setTracks(prev => prev.map(t => {
          if (t.track_id === track.track_id) {
            return { ...t, sales_count: t.sales_count + 1 };
          }
          return t;
        }));

        // Generar cNFT de Licencia Digital (Metaplex Bubblegum) simulado
        const cnftAddress = "cNFT" + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
        const merkleTree = "Tree" + Math.random().toString(36).substr(2, 9);

        setUserHistory(prev => [
          {
            track_id: track.track_id,
            title: track.title,
            artist_name: track.artist_name,
            ipfs_cover_hash: track.ipfs_cover_hash,
            amount_paid: price,
            currency: "SOL",
            timestamp: Date.now(),
            cnft_address: cnftAddress,
            merkle_tree: merkleTree
          },
          ...prev
        ]);

        toast.success(`¡Licencia Digital Adquirida Exitosamente!`, {
          description: `cNFT Emitido: ${cnftAddress.substring(0, 8)}... en el árbol de Merkle de Solana.`
        });
      } else {
        // Simulación para USDT, ETH, BTC y USDC
        setTimeout(() => {
          setPurchasedTracks(prev => [...prev, track.track_id]);
          setTracks(prev => prev.map(t => {
            if (t.track_id === track.track_id) {
              return { ...t, sales_count: t.sales_count + 1 };
            }
            return t;
          }));

          // Generar cNFT de Licencia Digital (Metaplex Bubblegum) simulado
          const cnftAddress = "cNFT" + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
          const merkleTree = "Tree" + Math.random().toString(36).substr(2, 9);

          setUserHistory(prev => [
            {
              track_id: track.track_id,
              title: track.title,
              artist_name: track.artist_name,
              ipfs_cover_hash: track.ipfs_cover_hash,
              amount_paid: price,
              currency,
              timestamp: Date.now(),
              cnft_address: cnftAddress,
              merkle_tree: merkleTree
            },
            ...prev
          ]);

          // Descontar del balance simulado correspondiente
          if (currency === "USDC") setUsdcBalance(prev => Number((prev - price).toFixed(2)));
          if (currency === "USDT") setUsdtBalance(prev => Number((prev - price).toFixed(2)));
          if (currency === "ETH") setEthBalance(prev => Number((prev - price).toFixed(4)));
          if (currency === "BTC") setBtcBalance(prev => Number((prev - price).toFixed(6)));

          toast.success(`¡Licencia Digital Adquirida (${currency})!`, {
            description: `cNFT Emitido: ${cnftAddress.substring(0, 8)}... como recibo digital.`
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error en la transacción:", error);
      toast.error("Error al procesar la compra", {
        description: error?.message || "La transacción fue cancelada o falló."
      });
    } finally {
      setIsProcessingTx(false);
      setTxSplitDetails(null);
    }
  };

  // --- SUBIDA DE ARCHIVOS REAL A PINATA IPFS ---
  const handleFileUpload = async (file: File, type: "audio" | "cover") => {
    setIsUploadingIPFS(true);
    if (type === "audio") setIsUploadingAudio(true);
    else setIsUploadingCover(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://ancstrmusic-plataform-1.onrender.com'}/ipfs/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Fallo en la subida a Pinata");
      }

      const data = await response.json();
      
      if (type === "audio") {
        setUploadedAudioHash(data.ipfs_hash);
        toast.success("¡Archivo de audio subido con éxito a IPFS!", {
          description: `CID de audio guardado: ${data.ipfs_hash.slice(0, 15)}...`
        });
      } else {
        setUploadedCoverHash(data.ipfs_hash);
        toast.success("¡Imagen de portada subida con éxito a IPFS!", {
          description: `CID de portada guardado: ${data.ipfs_hash.slice(0, 15)}...`
        });
      }
    } catch (error) {
      console.error("Error al subir archivo a IPFS:", error);
      const simulatedHash = "QmSimulated" + Math.random().toString(36).substring(2, 15);
      if (type === "audio") {
        setUploadedAudioHash(simulatedHash);
        toast.info("Modo local: Generado hash simulado para el audio", {
          description: simulatedHash
        });
      } else {
        setUploadedCoverHash("QmSimulatedCoverHashPlaceholder");
        toast.info("Modo local: Generado hash simulado para la portada");
      }
    } finally {
      setIsUploadingIPFS(false);
      setIsUploadingAudio(false);
      setIsUploadingCover(false);
    }
  };

  const handleUploadTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newArtist || !newGenre) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    if (!uploadedAudioHash) {
      toast.error("Falta subir el archivo de audio a IPFS.");
      return;
    }

    const newTrack: Track = {
      track_id: `track-${tracks.length + 1}`,
      title: newTitle,
      artist_name: newArtist,
      artist_wallet: publicKey ? publicKey.toBase58() : "Hw8N9gYg4W7Pq6rX7y7K9gYg4W7Pq6rX7y7K9gYg4W7P",
      album: "Digital Single",
      genre: newGenre,
      duration: 180,
      ipfs_audio_hash: uploadedAudioHash,
      ipfs_cover_hash: uploadedCoverHash 
        ? `https://gateway.pinata.cloud/ipfs/${uploadedCoverHash}` 
        : "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_history-iKDCRAzXkDSabWpUUxBDQ8.webp",
      price_sol: parseFloat(newPriceSol) || 0.1,
      price_usdc: parseFloat(newPriceUsdc) || 3.0,
      price_usdt: parseFloat(newPriceUsdt) || 3.0,
      price_eth: parseFloat(newPriceEth) || 0.001,
      price_btc: parseFloat(newPriceBtc) || 0.00005,
      sales_count: 0,
      is_streamable_free: true,
      likes: 0
    };

    setTracks(prev => [newTrack, ...prev]);
    setCurrentTrack(newTrack);
    
    // Limpiar campos
    setNewTitle("");
    setNewArtist("");
    setNewGenre("");
    setUploadedAudioHash("");
    setUploadedCoverHash("");

    toast.success("¡Licencia digital publicada con éxito!", {
      description: "Los metadatos se han indexado en el catálogo descentralizado de ANCSTR MUSIC."
    });
  };

  // --- MÓDULO SOCIAL: ME GUSTA Y PROPINAS ---
  const handleLike = (trackId: string) => {
    if (likedTracks.includes(trackId)) {
      setLikedTracks(prev => prev.filter(id => id !== trackId));
      setTracks(prev => prev.map(t => {
        if (t.track_id === trackId) {
          return { ...t, likes: Math.max(0, (t.likes || 0) - 1) };
        }
        return t;
      }));
    } else {
      setLikedTracks(prev => [...prev, trackId]);
      setTracks(prev => prev.map(t => {
        if (t.track_id === trackId) {
          return { ...t, likes: (t.likes || 0) + 1 };
        }
        return t;
      }));
      toast.success("Añadido a tus favoritos");
    }
  };

  const handleSendTip = async () => {
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto de propina válido.");
      return;
    }

    setIsProcessingTip(true);
    const platformShare = Number((amount * 0.15).toFixed(6));
    const artistShare = Number((amount - platformShare).toFixed(6));

    try {
      if (tipCurrency === "SOL" && connected && publicKey) {
        const artistPubkey = new PublicKey(currentTrack.artist_wallet.startsWith("Art") ? "Hw8N9gYg4W7Pq6rX7y7K9gYg4W7Pq6rX7y7K9gYg4W7P" : currentTrack.artist_wallet);
        const platformPubkey = new PublicKey("Hw8N9gYg4W7Pq6rX7y7K9gYg4W7Pq6rX7y7K9gYg4W7P");

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: artistPubkey,
            lamports: Math.floor(artistShare * LAMPORTS_PER_SOL),
          }),
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: platformPubkey,
            lamports: Math.floor(platformShare * LAMPORTS_PER_SOL),
          })
        );

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "processed");

        toast.success(`¡Propina enviada a ${currentTrack.artist_name}!`, {
          description: `Split 85/15 aplicado: ${artistShare} SOL al artista, ${platformShare} SOL de soporte de red.`
        });
      } else {
        // Simulación para otras monedas
        setTimeout(() => {
          if (tipCurrency === "USDC") setUsdcBalance(prev => Number((prev - amount).toFixed(2)));
          if (tipCurrency === "USDT") setUsdtBalance(prev => Number((prev - amount).toFixed(2)));
          if (tipCurrency === "ETH") setEthBalance(prev => Number((prev - amount).toFixed(4)));
          if (tipCurrency === "BTC") setBtcBalance(prev => Number((prev - amount).toFixed(6)));

          toast.success(`¡Propina enviada a ${currentTrack.artist_name}!`, {
            description: `Split 85/15 aplicado: ${artistShare} ${tipCurrency} al artista, ${platformShare} ${tipCurrency} de soporte de red.`
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error al enviar propina:", error);
      toast.error("Error al procesar la propina");
    } finally {
      setIsProcessingTip(false);
    }
  };

  // Filtrar catálogo por tendencias (más ventas)
  const trendingTracks = [...tracks].sort((a, b) => b.sales_count - a.sales_count);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030508] text-slate-200 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-400 relative">
      
      {/* 1. LIENZO GENERAL: Visualizador WebGL 3D como Fondo Interactivo Absoluto de Pantalla Completa */}
      {/* Usamos z-0 en lugar de -z-10 para evitar que el fondo bg-[#030508] del contenedor principal oculte el Canvas 3D */}
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none overflow-hidden bg-transparent">
        <HoloSphereVisualizer 
          analyserNode={analyserRef.current}
          isPlaying={isPlaying}
          bassIntensity={bassIntensity}
        />
        {/* Efecto de líneas de escaneo animadas sobre el visualizador holográfico */}
        <div className="scanlines-overlay opacity-25"></div>
      </div>
      
      {/* Rejilla holográfica de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-40" />
      
      {/* Orbes de iluminación dual asimétrica de fondo para potenciar el efecto Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none z-0" />

      {/* 2. CONTENEDOR PRINCIPAL FLOTANTE DE PANTALLA COMPLETA */}
      <div className="relative z-10 flex flex-col h-full w-full justify-between p-6">
        
        {/* CABECERA MINIMALISTA */}
        <header className="flex justify-between items-center w-full h-14 px-4 bg-[#0a0f16]/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg shadow-black/40 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">ANCSTR NETWORK: ONLINE / SOLANA MAINNET</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Wallet Multi Button */}
            <div className="scale-90 transform origin-right">
              <WalletMultiButton className="!bg-gradient-to-r !from-orange-600 !to-orange-500 hover:!from-orange-500 hover:!to-orange-400 !transition-all !duration-300 !rounded-xl !h-9 !px-4 !text-xs !font-bold !border !border-orange-500/30 !shadow-[0_0_15px_rgba(255,100,0,0.3)]" />
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL: Layout de 3 bloques (Izquierda w-72, Centro vacío, Derecha w-96) */}
        <main className="flex-1 w-full flex gap-6 overflow-hidden mb-4 relative">
          
          {/* ========================================================================= */}
          {/* BLOQUE IZQUIERDO (w-72): Sidebar de Cristal con Iluminación Cian */}
          {/* ========================================================================= */}
          <section className="w-72 flex flex-col justify-between h-full bg-[#0a0f16]/60 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_30px_-5px_rgba(0,180,255,0.15)] overflow-y-auto no-scrollbar">
            
            <div className="flex flex-col gap-6">
              {/* Logo ANCSTR */}
              <div className="w-full h-14 flex items-center justify-center">
                <img src="/logo-ancstr.svg" alt="ANCSTR" className="h-full w-auto object-contain" />
              </div>

              {/* Menú de Navegación Vertical */}
              <nav className="flex flex-col gap-2">
                {[
                  { id: "player", label: "ANCSTR ERA", icon: Disc },
                  { id: "catalog", label: "DISCOVER", icon: Music },
                  { id: "trending", label: "FEED", icon: TrendingUp },
                  { id: "history", label: "MY LIBRARY", icon: History },
                  { id: "upload", label: "STAKE & EARN", icon: Upload },
                  { id: "wallet", label: "WALLET", icon: Coins }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-300 group ${
                        isActive
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,180,255,0.15)]"
                          : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-all duration-300 ${
                        isActive ? "text-cyan-400 scale-110" : "text-slate-400 group-hover:text-slate-200"
                      }`} />
                      <span className="text-xs font-bold tracking-widest font-mono">{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00b4ff]" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Parte Inferior: Balance y Perfil de Usuario */}
            <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-white/5">
              {/* Tarjeta de Balance */}
              <div className="bg-[#0a0f16]/40 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2 relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">WALLET BALANCE</span>
                  <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md border border-green-500/20 font-bold">+12.5%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-mono font-extrabold text-cyan-400 tracking-tight">ANC 12,450.75</span>
                  <span className="text-[10px] font-mono text-slate-500">≈ $8,745.20 USD</span>
                </div>
                {/* Mini Gráfico Sparkline */}
                <div className="w-full h-8 mt-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0,25 Q15,5 30,20 T60,10 T80,22 T100,12 L100,30 L0,30 Z" fill="url(#sparkline-grad)" opacity="0.15" />
                    <path d="M0,25 Q15,5 30,20 T60,10 T80,22 T100,12" fill="none" stroke="#00b4ff" strokeWidth="1.5" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00b4ff" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Perfil de Usuario */}
              <div className="flex items-center gap-3 bg-[#0a0f16]/40 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-500/40 p-0.5 shadow-[0_0_10px_rgba(0,180,255,0.2)] bg-cyan-950 flex items-center justify-center overflow-hidden">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a0f16] shadow-[0_0_8px_#22c55e]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold font-mono text-slate-200 truncate">0xEchoSoul</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-mono text-orange-400 bg-orange-500/10 px-1 py-0.2 rounded font-bold uppercase border border-orange-500/20">OG LISTENER</span>
                    <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded font-bold uppercase border border-cyan-500/20">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* BLOQUE CENTRAL: Espacio central interactivo que revela el fondo WebGL 3D a pantalla completa */}
          {/* ========================================================================= */}
          <section className="flex-1 h-full flex flex-col justify-center items-center relative overflow-hidden">
            {/* Espacio vacío interactivo que reacciona a los bajos cuando la pestaña es el reproductor */}
            {(activeTab === "player" || activeTab === "ancstr_era") && (
              <div 
                className="relative flex items-center justify-center w-full h-full max-w-3xl max-h-[600px] md:max-h-[650px] transition-all duration-500 ease-in-out pointer-events-none"
                style={{
                  transform: `scale(${1 + bassIntensity * 0.05})`
                }}
              >
                {/* Resplandor holográfico de fondo reactivo a los bajos para enfatizar la presencia del planeta 3D de fondo */}
                <div 
                  className="absolute w-[350px] h-[350px] rounded-full filter blur-[100px] opacity-25 transition-all duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 ${100 + bassIntensity * 150}px rgba(255, 119, 0, ${0.2 + bassIntensity * 0.5})`,
                    transform: `scale(${1 + bassIntensity * 0.15})`
                  }}
                />
              </div>
            )}

            {activeTab !== "player" && (
              /* Tarjeta de Cristal flotante para otras vistas que no sean el reproductor de la esfera */
              <div className="w-full h-full bg-[#0a0f16]/75 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-2xl shadow-black/80 flex flex-col overflow-y-auto no-scrollbar relative z-10">
                
                {/* --- VISTA: DISCOVER (CATÁLOGO) --- */}
                {activeTab === "catalog" && (
                  <div className="flex flex-col gap-6 h-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                      <div>
                        <h2 className="text-xl font-mono font-extrabold text-orange-400 uppercase tracking-widest">DESCENTRALIZED CATALOG</h2>
                        <p className="text-xs text-slate-400 mt-1">Explora licencias de música digital indexadas en la blockchain de Solana.</p>
                      </div>
                      {/* Buscador */}
                      <div className="relative w-full md:w-64">
                        <Input
                          type="text"
                          placeholder="Buscar por canción, artista..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-[#03050a]/60 border-white/10 text-xs rounded-xl pl-9 h-9 text-slate-200 focus:border-cyan-500/50"
                        />
                        <div className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 flex items-center justify-center">🔍</div>
                      </div>
                    </div>

                    {/* Filtro por Género */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      <Button
                        variant={selectedGenre === "" ? "default" : "outline"}
                        onClick={() => setSelectedGenre("")}
                        className={`h-7 px-3 text-[10px] font-mono rounded-full border transition-all ${
                          selectedGenre === "" 
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" 
                            : "bg-transparent border-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ALL GENRES
                      </Button>
                      {SPOTIFY_GENRES.slice(0, 10).map((genre) => (
                        <Button
                          key={genre}
                          variant={selectedGenre === genre ? "default" : "outline"}
                          onClick={() => setSelectedGenre(genre)}
                          className={`h-7 px-3 text-[10px] font-mono rounded-full border transition-all ${
                            selectedGenre === genre 
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" 
                              : "bg-transparent border-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {genre.toUpperCase()}
                        </Button>
                      ))}
                    </div>

                    {/* Grid de Canciones */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tracks
                          .filter(track => {
                            const matchesGenre = selectedGenre === "Todos" || track.genre === selectedGenre;
                            const matchesSearch = 
                              track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              track.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              track.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase()));
                            return matchesGenre && matchesSearch;
                          })
                          .map((track) => {
                            const isCurrent = currentTrack.track_id === track.track_id;
                            const isPurchased = purchasedTracks.includes(track.track_id);
                            return (
                            <div 
                              key={track.track_id}
                              className={`bg-[#0a0f16]/40 border rounded-xl p-3.5 flex gap-4 transition-all duration-300 group hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,180,255,0.08)] ${
                                isCurrent ? "border-cyan-500/40 bg-cyan-500/5" : "border-white/5"
                              }`}
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/40 border border-white/5 flex-shrink-0 relative">
                                <img src={track.ipfs_cover_hash} alt={track.title} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => {
                                    setCurrentTrack(track);
                                    setIsPlaying(true);
                                  }}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                                >
                                  <Play className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                                </button>
                              </div>
                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  <h4 className="text-xs font-bold font-mono text-slate-200 truncate group-hover:text-cyan-400 transition-colors">{track.title}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{track.artist_name}</p>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-2">
                                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{track.price_sol} SOL</span>
                                  {isPurchased ? (
                                    <span className="text-[8px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md font-bold uppercase">LICENSED</span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handlePurchase(track, "SOL")}
                                      disabled={isProcessingTx}
                                      className="h-6 px-2.5 text-[9px] font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg"
                                    >
                                      BUY LICENSE
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- VISTA: TRENDING (FEED) --- */}
                {activeTab === "trending" && (
                  <div className="flex flex-col gap-4 h-full">
                    <div>
                      <h2 className="text-xl font-mono font-extrabold text-orange-400 uppercase tracking-widest">TRENDING CHARTS</h2>
                      <p className="text-xs text-slate-400 mt-1">Las licencias más vendidas y reproducidas de la semana en ANCSTR.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-1 flex flex-col gap-3">
                      {trendingTracks.map((track, index) => (
                        <div 
                          key={track.track_id}
                          className="bg-[#0a0f16]/40 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-4 group hover:border-cyan-500/20"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-mono font-extrabold text-slate-500 w-6 text-center group-hover:text-cyan-400">{index + 1}</span>
                            <img src={track.ipfs_cover_hash} alt={track.title} className="w-12 h-12 rounded-lg object-cover bg-black/40 border border-white/5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold font-mono text-slate-200">{track.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">{track.artist_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">SALES</span>
                              <span className="text-xs font-mono text-cyan-400 font-extrabold">{track.sales_count} LICENSES</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setCurrentTrack(track);
                                setIsPlaying(true);
                              }}
                              className="h-8 w-8 bg-white/5 hover:bg-cyan-500 hover:text-black rounded-xl flex items-center justify-center p-0 border border-white/5 transition-all duration-300"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- VISTA: HISTORY (MY LIBRARY) --- */}
                {activeTab === "history" && (
                  <div className="flex flex-col gap-4 h-full">
                    <div>
                      <h2 className="text-xl font-mono font-extrabold text-orange-400 uppercase tracking-widest">MY WEB3 LIBRARY</h2>
                      <p className="text-xs text-slate-400 mt-1">Historial de licencias de música digital inmutables adquiridas en Solana.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-1 flex flex-col gap-3">
                      {userHistory.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                          <Disc className="w-12 h-12 text-slate-600 animate-spin [animation-duration:10s] mb-3" />
                          <span className="text-xs font-mono text-slate-400">AÚN NO HAS ADQUIRIDO NINGUNA LICENCIA</span>
                          <p className="text-[10px] text-slate-500 max-w-xs mt-1">Explora el catálogo y adquiere tu primera licencia musical Web3.</p>
                        </div>
                      ) : (
                        userHistory.map((record) => (
                          <div 
                            key={record.track_id}
                            className="bg-[#0a0f16]/40 border border-white/5 rounded-xl p-3.5 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <img src={record.ipfs_cover_hash} alt={record.title} className="w-12 h-12 rounded-lg object-cover bg-black/40 border border-white/5" />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold font-mono text-slate-200">{record.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{record.artist_name}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[8px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase">CNFT SECURED</span>
                              <span className="text-[10px] font-mono text-slate-400">{record.amount_paid} {record.currency}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* --- VISTA: UPLOAD (STAKE & EARN) --- */}
                {activeTab === "upload" && (
                  <div className="flex flex-col gap-4 h-full overflow-y-auto no-scrollbar">
                    <div>
                      <h2 className="text-xl font-mono font-extrabold text-orange-400 uppercase tracking-widest">PUBLISH DIGITAL LICENSE</h2>
                      <p className="text-xs text-slate-400 mt-1">Registra y acuña tu licencia musical de forma inmutable en Solana con almacenamiento IPFS.</p>
                    </div>
                    
                    <form onSubmit={handleUploadTrack} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Título de la Canción *</label>
                          <Input
                            type="text"
                            required
                            placeholder="Ej: Decentralized Dreams"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="bg-[#03050a]/60 border-white/10 text-xs rounded-xl h-9 text-slate-200"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Nombre del Artista *</label>
                          <Input
                            type="text"
                            required
                            placeholder="Ej: Satoshi Sound"
                            value={newArtist}
                            onChange={(e) => setNewArtist(e.target.value)}
                            className="bg-[#03050a]/60 border-white/10 text-xs rounded-xl h-9 text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Género Musical *</label>
                          <select
                            required
                            value={newGenre}
                            onChange={(e) => setNewGenre(e.target.value)}
                            className="bg-[#03050a]/60 border border-white/10 text-xs rounded-xl h-9 px-3 text-slate-200 focus:border-cyan-500/50 font-mono font-bold"
                          >
                            <option value="" disabled className="bg-[#0a0f16]">Selecciona un género</option>
                            {SPOTIFY_GENRES.map((g) => (
                              <option key={g} value={g} className="bg-[#0a0f16]">{g}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Precio de Licencia (SOL) *</label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Ej: 0.15"
                            value={newPriceSol}
                            onChange={(e) => setNewPriceSol(e.target.value)}
                            className="bg-[#03050a]/60 border-white/10 text-xs rounded-xl h-9 text-slate-200"
                          />
                        </div>
                      </div>

                      {/* Subida de Archivos a IPFS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* Audio */}
                        <div className="border border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-[#03050a]/20 relative">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-[10px] font-mono text-slate-300 font-bold uppercase">AUDIO FILE (MP3/WAV)</span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "audio");
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={isUploadingAudio}
                          />
                          {isUploadingAudio ? (
                            <div className="flex items-center gap-2 mt-2">
                              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                              <span className="text-[9px] font-mono text-cyan-400">SUBIENDO A IPFS...</span>
                            </div>
                          ) : uploadedAudioHash ? (
                            <span className="text-[8px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded mt-2 font-bold truncate max-w-[200px]">✓ IPFS: {uploadedAudioHash}</span>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-500 mt-1">Arrastra o haz clic para subir</span>
                          )}
                        </div>

                        {/* Cover */}
                        <div className="border border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-[#03050a]/20 relative">
                          <Image className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-[10px] font-mono text-slate-300 font-bold uppercase">COVER ART (JPG/PNG)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "cover");
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={isUploadingCover}
                          />
                          {isUploadingCover ? (
                            <div className="flex items-center gap-2 mt-2">
                              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                              <span className="text-[9px] font-mono text-cyan-400">SUBIENDO A IPFS...</span>
                            </div>
                          ) : uploadedCoverHash ? (
                            <span className="text-[8px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded mt-2 font-bold truncate max-w-[200px]">✓ IPFS: {uploadedCoverHash}</span>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-500 mt-1">Arrastra o haz clic para subir</span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isUploadingAudio || isUploadingCover || !uploadedAudioHash}
                        className="w-full h-10 mt-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-extrabold font-mono text-xs tracking-widest rounded-xl border border-orange-500/30 shadow-[0_0_15px_rgba(255,100,0,0.2)]"
                      >
                        PUBLISH BLOCKCHAIN LICENSE
                      </Button>
                    </form>
                  </div>
                )}

                {/* --- VISTA: WALLET (SOPORTE / SPLIT) --- */}
                {activeTab === "wallet" && (
                  <div className="flex flex-col gap-6 h-full">
                    <div>
                      <h2 className="text-xl font-mono font-extrabold text-orange-400 uppercase tracking-widest">ATOMIC REVENUE SPLIT</h2>
                      <p className="text-xs text-slate-400 mt-1">Cada adquisición de licencia digital o propina realiza una distribución de fondos inmutable de forma instantánea.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto no-scrollbar">
                      {/* Gráfico del Split */}
                      <div className="bg-[#03050a]/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                        <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">REVENUE DISTRIBUTION (85/15)</span>
                        <div className="flex-1 flex flex-col justify-center gap-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-cyan-400 font-bold">ARTISTA (Soberanía Directa)</span>
                              <span className="text-cyan-400 font-extrabold">85%</span>
                            </div>
                            <Progress value={85} className="h-2 bg-white/5 [&>div]:bg-cyan-500" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-orange-400 font-bold">PLATAFORMA (Soporte de Red)</span>
                              <span className="text-orange-400 font-extrabold">15%</span>
                            </div>
                            <Progress value={15} className="h-2 bg-white/5 [&>div]:bg-orange-500" />
                          </div>
                        </div>
                      </div>

                      {/* Panel de Enviar Propina */}
                      <div className="bg-[#03050a]/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                        <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">ENVIAR PROPINA AL ARTISTA</span>
                        <div className="flex flex-col gap-3 mt-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={tipAmount}
                              onChange={(e) => setTipAmount(e.target.value)}
                              className="bg-[#03050a]/60 border-white/10 text-xs rounded-xl h-9 text-slate-200"
                            />
                            <select
                              value={tipCurrency}
                              onChange={(e) => setTipCurrency(e.target.value)}
                              className="bg-[#03050a]/60 border border-white/10 text-xs rounded-xl h-9 px-3 text-slate-200 focus:border-cyan-500/50 font-mono font-bold"
                            >
                              <option value="SOL">SOL</option>
                              <option value="USDC">USDC</option>
                              <option value="USDT">USDT</option>
                              <option value="ETH">ETH</option>
                              <option value="BTC">BTC</option>
                            </select>
                          </div>
                          <Button
                            onClick={handleSendTip}
                            disabled={isProcessingTip}
                            className="w-full h-9 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono text-xs tracking-widest rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(0,180,255,0.2)]"
                          >
                            {isProcessingTip ? "PROCESANDO SPLIT..." : "ENVIAR PROPINA"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* BLOQUE DERECHO (w-96): Contenidos y Playlist con Iluminación Naranja */}
          {/* ========================================================================= */}
          <section className={`flex flex-col justify-between h-full bg-[#0a0f16]/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_0_30px_-5px_rgba(255,100,0,0.15)] overflow-y-auto no-scrollbar transition-all duration-500 ease-in-out transform origin-right ${
            isRightPanelOpen 
              ? "w-96 p-5 opacity-100 translate-x-0" 
              : "w-0 p-0 opacity-0 translate-x-full border-0 shadow-none pointer-events-none"
          }`}>
            
            {/* ANCSTR ERA (Álbumes Destacados) - Colapsable Interactiva */}
            <div className="flex flex-col gap-4">
              <div 
                onClick={() => setIsAncstrEraOpen(!isAncstrEraOpen)}
                className="flex justify-between items-center pb-2 border-b border-white/5 cursor-pointer select-none group/header"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-orange-400 font-extrabold uppercase tracking-widest group-hover/header:text-orange-300 transition-colors">ANCSTR ERA</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-orange-400/70 group-hover/header:text-orange-400 transition-transform duration-500 ${
                      isAncstrEraOpen ? "transform rotate-180" : ""
                    }`} 
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que abra/cierre el acordeón al hacer clic en VIEW ALL
                    }}
                    className={`text-[10px] font-mono text-slate-400 hover:text-slate-200 tracking-wider transition-all duration-500 ${
                      isAncstrEraOpen 
                        ? "opacity-100 translate-x-0" 
                        : "opacity-0 translate-x-4 pointer-events-none"
                    }`}
                  >
                    VIEW ALL →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que abra/cierre el acordeón
                      setIsRightPanelOpen(false);
                      toast.info("Panel colapsado. Usa la pestaña derecha para expandir.");
                    }}
                    className="p-1 rounded-lg bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-orange-500/10 text-slate-400 hover:text-orange-400 transition-all duration-300 cursor-pointer"
                    title="Colapsar panel derecho"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div 
                className={`grid grid-cols-2 gap-3 transition-all duration-500 ease-in-out overflow-hidden ${
                  isAncstrEraOpen 
                    ? "max-h-[1000px] opacity-100 mt-1" 
                    : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                {[
                  { title: "The Genesis", vol: "Vol. 1", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop" }, // Abstract premium glass/neon
                  { title: "Cyber Echoes", vol: "Vol. 2", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop" }, // Neon abstract cube
                  { title: "Into the Abyss", vol: "Vol. 3", img: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=300&auto=format&fit=crop" }, // Deep space abstract
                  { title: "Ethereal Rebirth", vol: "Vol. 4", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=300&auto=format&fit=crop" } // Magma orange gradient abstract
                ].map((album, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#0a0f16]/40 border border-white/5 hover:border-orange-500/30 rounded-xl p-2.5 flex flex-col gap-2 group transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,100,0,0.08)] cursor-pointer"
                  >
                    <div className="aspect-square rounded-md overflow-hidden bg-black/60 border border-cyan-500/20 relative">
                      {/* Portadas Holográficas con CSS Avanzado (Efecto de Luz Proyectada Monocromática Teñida) */}
                      <img 
                        src={album.img} 
                        alt={album.title} 
                        className="w-full h-full object-cover opacity-75 contrast-125 saturate-50 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500" 
                      />
                      {/* Degradado de inyección de color holográfico por encima de la imagen */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-orange-500/20 mix-blend-overlay pointer-events-none"></div>
                      
                      {/* Efecto de líneas de escaneo holográficas animadas */}
                      <div className="scanlines-overlay opacity-40"></div>
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                        <Play className="w-5 h-5 text-orange-400 fill-orange-400/20" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold font-mono text-slate-200 truncate">{album.title}</span>
                      <span className="text-[8px] font-mono text-slate-500 mt-0.5">{album.vol}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UP NEXT (Playlist / Tracklist) - Colapsable Interactiva */}
            <div className="flex flex-col gap-4 mt-6">
              <div 
                onClick={() => setIsUpNextOpen(!isUpNextOpen)}
                className="flex justify-between items-center pb-2 border-b border-white/5 cursor-pointer select-none group/header"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-orange-400 font-extrabold uppercase tracking-widest group-hover/header:text-orange-300 transition-colors">UP NEXT</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-orange-400/70 group-hover/header:text-orange-400 transition-transform duration-500 ${
                      isUpNextOpen ? "transform rotate-180" : ""
                    }`} 
                  />
                </div>
                <div 
                  className={`flex items-center gap-2 transition-all duration-500 ${
                    isUpNextOpen 
                      ? "opacity-100 translate-x-0" 
                      : "opacity-0 translate-x-4 pointer-events-none"
                  }`} 
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[9px] font-mono text-slate-400 uppercase">AUTOPLAY</span>
                  <button className="w-7 h-4 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center p-0.5 cursor-pointer">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 translate-x-3 transition-transform duration-300 shadow-[0_0_8px_#ff7700]" />
                  </button>
                </div>
              </div>
              
              <div 
                className={`flex flex-col gap-2 transition-all duration-500 ease-in-out overflow-hidden ${
                  isUpNextOpen 
                    ? "max-h-[300px] opacity-100 mt-1" 
                    : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                  {tracks.slice(0, 3).map((track) => {
                    const isCurrent = currentTrack.track_id === track.track_id;
                    return (
                      <div 
                        key={track.track_id}
                        onClick={() => {
                          setCurrentTrack(track);
                          setIsPlaying(true);
                        }}
                        className={`bg-[#0a0f16]/40 border rounded-xl p-2 flex items-center justify-between gap-3 cursor-pointer group transition-all ${
                          isCurrent ? "border-orange-500/40 bg-orange-500/5" : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={track.ipfs_cover_hash} alt={track.title} className="w-9 h-9 rounded-lg object-cover bg-black/40 border border-white/5" />
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[10px] font-bold font-mono truncate ${isCurrent ? "text-orange-400" : "text-slate-200 group-hover:text-orange-400 transition-colors"}`}>{track.title}</span>
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5 truncate">{track.artist_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCurrent && isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <div className="w-0.5 bg-orange-400 animate-music-bar-1" />
                              <div className="w-0.5 bg-orange-400 animate-music-bar-2" />
                              <div className="w-0.5 bg-orange-400 animate-music-bar-3" />
                            </div>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-500">{formatTime(track.duration)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* EARN ANC (Tarjeta de Recompensas de Progreso con Cubo 3D Giratorio) - Colapsable Interactiva */}
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-white/5">
              <div 
                onClick={() => setIsEarnAncOpen(!isEarnAncOpen)}
                className="flex justify-between items-center pb-1 cursor-pointer select-none group/header"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-orange-400 font-extrabold uppercase tracking-widest group-hover/header:text-orange-300 transition-colors">EARN ANC</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-orange-400/70 group-hover/header:text-orange-400 transition-transform duration-500 ${
                      isEarnAncOpen ? "transform rotate-180" : ""
                    }`} 
                  />
                </div>
              </div>
              
              <div 
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isEarnAncOpen 
                    ? "max-h-[300px] opacity-100 mt-1" 
                    : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <div className="bg-[#0a0f16]/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden group">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-col">
                      <span className="text-xl font-mono font-extrabold text-slate-100">3,200 ANC</span>
                      <span className="text-[9px] font-mono text-slate-500 mt-0.5">LOCKED • GOAL: 5,000 ANC</span>
                    </div>
                    {/* Barra de progreso de neón naranja */}
                    <Progress value={64} className="h-1.5 bg-white/5 [&>div]:bg-orange-500 shadow-[0_0_8px_rgba(255,100,0,0.2)]" />
                  </div>

                  {/* Cubo Tridimensional de Alambre Giratorio (Wireframe 3D Cube) */}
                  <div className="w-14 h-14 relative flex items-center justify-center overflow-visible">
                    <div className="cube-container">
                      <div className="cube">
                        <div className="face front" />
                        <div className="face back" />
                        <div className="face left" />
                        <div className="face right" />
                        <div className="face top" />
                        <div className="face bottom" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Muro Descentralizado de Comentarios (Fiel a la estética pero compacto) */}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5">
              <span className="text-[10px] font-mono text-orange-400 font-extrabold uppercase tracking-widest">MURO DESCENTRALIZADO</span>
              <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto no-scrollbar">
                {comments.slice(0, 2).map((c) => (
                  <div key={c.comment_id} className="bg-[#03050a]/40 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold font-mono text-slate-300">{c.author_name}</span>
                      <span className="text-[8px] font-mono text-slate-500">{c.author_wallet.slice(0, 4)}...{c.author_wallet.slice(-4)}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed font-mono">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  placeholder="Añadir comentario..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="bg-[#03050a]/60 border-white/10 text-[10px] rounded-xl h-8 text-slate-200"
                />
                <Button 
                  onClick={async () => {
                    if (!newCommentText.trim()) return;
                    const newCommentObj = {
                      comment_id: `comment-${comments.length + 1}`,
                      artist_wallet: currentTrack.artist_wallet,
                      author_wallet: publicKey ? publicKey.toBase58() : "Anon" + Math.floor(Math.random() * 1000000),
                      author_name: authorName.trim() || "Anon_Collector",
                      text: newCommentText,
                      timestamp: Date.now(),
                      has_license: purchasedTracks.includes(currentTrack.track_id)
                    };
                    setComments(prev => [newCommentObj, ...prev]);
                    setNewCommentText("");
                    toast.success("Comentario publicado");
                  }}
                  disabled={!newCommentText.trim()}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] h-8 px-3 rounded-xl border border-white/5"
                >
                  Enviar
                </Button>
              </div>
            </div>

          </section>

          {/* Pestaña flotante de expansión en el borde derecho cuando el panel está cerrado */}
          {!isRightPanelOpen && (
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="fixed right-0 top-1/2 -translate-y-1/2 z-40 h-24 w-6 bg-[#0a0f16]/90 backdrop-blur-md border-l border-t border-b border-orange-500/50 rounded-l-xl flex items-center justify-center text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 shadow-[-5px_0_15px_rgba(255,100,0,0.15)] transition-all duration-300 animate-pulse cursor-pointer group"
            >
              <ChevronLeft className="w-4.5 h-4.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </button>
          )}
        </main>

        {/* ========================================================================= */}
        {/* REPRODUCTOR ANALÓGICO FLOTANTE (Abajo Centro/Derecha) */}
        {/* ========================================================================= */}
        <footer className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[600px] h-20 bg-[#0a0f16]/75 backdrop-blur-2xl border border-orange-500/30 rounded-2xl p-4 shadow-[0_0_30px_-5px_rgba(255,100,0,0.2)] flex items-center justify-between gap-4">
          
          {/* Info de la pista */}
          <div className="flex items-center gap-3 w-40 min-w-0">
            <img src={currentTrack.ipfs_cover_hash} alt={currentTrack.title} className="w-12 h-12 rounded-xl object-cover bg-black/40 border border-white/5 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold font-mono text-slate-100 truncate">{currentTrack.title}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{currentTrack.artist_name}</span>
            </div>
          </div>

          {/* Controles de Reproducción */}
          <div className="flex-1 flex flex-col items-center gap-2">
            {/* Botones de Control */}
            <div className="flex items-center gap-5">
              <button onClick={() => setVolume(volume === 0 ? 80 : 0)} className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={handlePrev} className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer">
                <SkipBack className="w-4 h-4" />
              </button>
              
              {/* Botón de PLAY con círculo naranja brillante */}
              <button 
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-500 text-black flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(255,100,0,0.8)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-black fill-black" /> : <Play className="w-4 h-4 text-black fill-black translate-x-0.5" />}
              </button>

              <button onClick={handleNext} className="text-slate-400 hover:text-orange-400 transition-colors cursor-pointer">
                <SkipForward className="w-4 h-4" />
              </button>
              <button onClick={() => handleLike(currentTrack.track_id)} className={`transition-colors cursor-pointer ${likedTracks.includes(currentTrack.track_id) ? "text-red-500 hover:text-red-400" : "text-slate-400 hover:text-slate-200"}`}>
                <Heart className={`w-4 h-4 ${likedTracks.includes(currentTrack.track_id) ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full flex items-center gap-2 px-4">
              <span className="text-[9px] font-mono text-slate-500 w-8 text-right">{formatTime(currentTime)}</span>
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="flex-1 [&>span:first-child]:bg-white/5 [&>span:first-child>span]:bg-orange-500"
              />
              <span className="text-[9px] font-mono text-slate-500 w-8">{formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* Ajuste de Volumen / Calidad */}
          <div className="flex items-center gap-3 w-40 justify-end flex-shrink-0">
            <span className="text-[8px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded font-bold">HI-FI AUDIO</span>
            <div className="w-16 flex items-center gap-1">
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
                className="w-full [&>span:first-child]:bg-white/5 [&>span:first-child>span]:bg-orange-500"
              />
            </div>
          </div>

        </footer>

      </div>

      {/* Elemento de Audio Oculto de HTML5 */}
      <audio
        ref={audioRef}
        src={getAudioUrl(currentTrack.ipfs_audio_hash)}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* ========================================================================= */}
      {/* BANNER HOLOGRÁFICO DE INSTALACIÓN PWA (Instalación Inteligente) */}
      {/* ========================================================================= */}
      {showInstallBanner && (
        <div className={`fixed bottom-32 left-8 z-50 w-80 bg-[#0a0f16]/90 backdrop-blur-2xl border rounded-2xl p-4 shadow-[0_0_30px_rgba(255,100,0,0.25)] transition-all duration-500 ${
          installSuccess 
            ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-102" 
            : "border-orange-500/40 shadow-[0_0_30px_rgba(255,100,0,0.25)]"
        }`}>
          {installSuccess ? (
            /* ========================================== */
            /* PANTALLA DE ÉXITO (Conexión Establecida) */
            /* ========================================== */
            <div className="flex flex-col items-center justify-center py-4 text-center animate-fade-in font-mono">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mb-1">CONEXIÓN ESTABLECIDA</span>
              <span className="text-xs font-bold text-slate-100 mb-1">¡ANCSTR INSTALADO CON ÉXITO!</span>
              <p className="text-[9px] text-slate-400 max-w-[220px] leading-relaxed">
                Sincronización completa. Ahora puedes acceder desde tu pantalla de inicio en cualquier momento.
              </p>
            </div>
          ) : (
            /* ========================================== */
            /* PANTALLA ESTÁNDAR / GUÍA DE INSTALACIÓN */
            /* ========================================== */
            <>
              {/* Cabecera del Banner */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                    {isInstalling ? (
                      <Loader2 className="w-4.5 h-4.5 text-orange-400 animate-spin" />
                    ) : (
                      <Smartphone className="w-4.5 h-4.5 text-orange-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-orange-400 font-extrabold uppercase tracking-widest">
                      {isInstalling ? "SINCRONIZANDO" : "PWA INSTALABLE"}
                    </span>
                    <span className="text-xs font-bold text-slate-100 font-mono">
                      {isInstalling ? "Descargando Recursos..." : "Instalar ANCSTR MUSIC"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowInstallBanner(false);
                    localStorage.setItem('pwa-banner-dismissed', 'true');
                  }}
                  className="text-slate-400 hover:text-orange-400 transition-colors p-1"
                  disabled={isInstalling}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cuerpo del Banner */}
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3 font-mono">
                {isInstalling
                  ? "Estableciendo puente seguro de datos y almacenando en caché la interfaz holográfica para acceso ultra rápido offline..."
                  : isIOS 
                    ? "Instala la app en tu iPhone/iPad para escuchar música a pantalla completa, sin barras y con carga ultra rápida."
                    : "Instala nuestra aplicación nativa ligera en tu dispositivo para disfrutar de la experiencia holográfica completa sin barras de navegación."}
              </p>

              {/* Guía Visual Dinámica */}
              {isIOS ? (
                <div className="bg-[#03050a]/60 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5 font-mono text-[9px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">1</span>
                    <span>Toca el botón de <strong className="text-orange-400">Compartir</strong> en Safari (abajo).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">2</span>
                    <span>Selecciona <strong className="text-orange-400">"Añadir a pantalla de inicio"</strong>.</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!deferredPrompt) {
                        toast.error("La instalación no está disponible en este navegador actualmente.");
                        return;
                      }
                      
                      setIsInstalling(true);
                      
                      try {
                        // Mostrar el prompt de instalación nativo
                        deferredPrompt.prompt();
                        // Esperar la respuesta del usuario
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`Elección de instalación del usuario: ${outcome}`);
                        
                        if (outcome === 'accepted') {
                          toast.success("Sincronizando recursos...");
                          // Nota: El evento appinstalled se disparará y manejará el éxito final
                        } else {
                          setIsInstalling(false);
                          toast.error("Instalación rechazada por el usuario.");
                        }
                      } catch (err) {
                        setIsInstalling(false);
                        console.error("Error durante el prompt de instalación:", err);
                      }
                    }}
                    disabled={isInstalling}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold font-mono text-[10px] h-9 rounded-xl border border-orange-500/30 shadow-[0_0_15px_rgba(255,100,0,0.4)] transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        SINCRONIZANDO...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        INSTALAR AHORA
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowInstallBanner(false);
                      localStorage.setItem('pwa-banner-dismissed', 'true');
                      toast.info("Recordatorio pospuesto.");
                    }}
                    variant="outline"
                    disabled={isInstalling}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold font-mono text-[10px] h-9 px-3 rounded-xl border border-white/5 disabled:opacity-50"
                  >
                    Más tarde
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
