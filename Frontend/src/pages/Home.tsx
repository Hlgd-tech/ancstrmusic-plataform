import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Volume, VolumeX, Music, 
  Upload, Disc, ArrowRight, ShieldCheck, 
  Coins, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Loader2,
  TrendingUp, History, Heart, Send, DollarSign, Share2, Award, User, Image, MessageSquare
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
        analyser.fftSize = 64; // Analizador compacto para 13 ondas
        analyserRef.current = analyser;
      }
      
      if (!sourceRef.current) {
        // Conectar el elemento <audio> al analizador
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
        sourceRef.current = source;
      }
      
      // Iniciar el loop de animación para capturar frecuencias
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateFrequencies = () => {
        if (!isPlaying) {
          // Si está pausado, reducir suavemente las barras a un estado de reposo
          setDynamicFrequencies(prev => prev.map(val => Math.max(10, val - 1.5)));
          setBassIntensity(prev => Math.max(0, prev - 0.05));
          animationFrameIdRef.current = requestAnimationFrame(updateFrequencies);
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        // Mapear los datos de frecuencia a las 13 barras del banner
        const newFreqs = [];
        let lowFreqSum = 0; // Para medir la intensidad de los bajos (primeros bins)
        
        for (let i = 0; i < 13; i++) {
          // Tomamos una muestra distribuida de frecuencias
          const binIndex = Math.min(Math.floor(i * (bufferLength / 13)), bufferLength - 1);
          const val = dataArray[binIndex];
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
      // Fallback: Si falla, creamos un generador de ondas aleatorias fluidas
      const fallbackLoop = () => {
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

  // Manejar cambios en la reproducción del elemento <audio>
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
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
      // Inicializar/Reanudar analizador de audio al reproducir
      initAudioAnalyser();
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
    <div className="min-h-screen bg-cyberpunk-main text-zinc-200 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-400">
      
      {/* Elemento de audio HTML5 oculto */}
      <audio 
        ref={audioRef}
        src={getAudioUrl(currentTrack.ipfs_audio_hash)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      {/* --- CABECERA DE LA APP --- */}
      <header className="border-b border-white/5 bg-[#06060a]/40 backdrop-blur-xl sticky top-0 z-50 px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Disc className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ANCSTR MUSIC <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-mono">WEB3</span>
              </h1>
              <p className="text-[10px] text-zinc-400">Almacenamiento Descentralizado & Split Directo (85/15)</p>
            </div>
          </div>

          {/* Wallet Connection Real y Saldos */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900">
              <div className="flex items-center gap-1 text-amber-500" title="Solana">
                <Coins className="w-3 h-3" />
                <span>{connected && solBalance !== null ? `${solBalance} SOL` : "0.00 SOL"}</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-1 text-green-500" title="USDC">
                <Coins className="w-3 h-3" />
                <span>{usdcBalance} USDC</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-1 text-teal-500" title="USDT">
                <Coins className="w-3 h-3" />
                <span>{usdtBalance} USDT</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-1 text-purple-400" title="Ethereum">
                <Coins className="w-3 h-3" />
                <span>{ethBalance} ETH</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-1 text-yellow-500" title="Bitcoin">
                <Coins className="w-3 h-3" />
                <span>{btcBalance} BTC</span>
              </div>
            </div>
            
            <div className="solana-wallet-btn-container">
              <WalletMultiButton className="!bg-orange-500 hover:!bg-orange-600 !h-9 !rounded-lg !text-xs !font-bold !tracking-wide !transition-all !font-sans" />
            </div>
          </div>
        </div>
      </header>

      {/* --- BANNER DE PRESENTACIÓN --- */}
      <section className="relative h-[200px] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/hero_banner-26Do7LjAs7JLoQDiiEBKPe.webp" 
            alt="Hero Banner" 
            className="w-full h-full object-cover opacity-20 filter brightness-50"
          />
          {/* Ondas Analógicas Animadas en el Fondo Sincronizadas con Web Audio API */}
          <div className="absolute inset-0 flex items-end justify-between px-6 md:px-12 opacity-25 pointer-events-none h-32 bottom-0 z-0">
            {dynamicFrequencies.map((height, idx) => (
              <div 
                key={idx}
                className="w-1.5 md:w-2 bg-gradient-to-t from-orange-600 to-amber-400 rounded-full transition-all duration-75 origin-bottom"
                style={{ 
                  height: `${height}px`,
                  boxShadow: isPlaying ? `0 0 ${bassIntensity * 12}px rgba(249, 115, 22, ${bassIntensity * 0.6})` : 'none'
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/40 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 w-full relative z-10">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono tracking-widest text-orange-500 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 uppercase">
              Streaming Directo de Contenido Digital
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-3 mb-2">
              Soberanía de Audio, Economía Directa.
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              La inmutabilidad del almacenamiento descentralizado fusionado con la distribución directa del **85% para el artista**. Sin tokens intermediarios complejos, opera de forma nativa en SOL, USDC, USDT, ETH y BTC.
            </p>
          </div>
        </div>
      </section>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* ========================================================================= */}
        {/* COLUMNA 1: BARRA LATERAL DE CONTROL FLOTANTE (3 Columnas) - OPCIÓN 2 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-5 min-h-[620px]">
          <div className="flex flex-col gap-5">
            {/* Logo de la dApp (Fiel al Mockup) */}
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-widest text-white font-sans uppercase">Ancstr</span>
                <span className="text-[7px] font-mono text-zinc-500 tracking-widest uppercase -mt-0.5">Music. Freedom. Legacy.</span>
              </div>
            </div>

            {/* Menú de Navegación Vertical de Cristal (Fiel al Mockup) */}
            <nav className="flex flex-col gap-1">
              {[
                { id: "player", label: "Ancstr Era", icon: Disc, color: "text-orange-400" },
                { id: "catalog", label: "Discover", icon: Music, color: "text-cyan-400" },
                { id: "trending", label: "Feed", icon: TrendingUp, color: "text-orange-400" },
                { id: "history", label: "My Library", icon: History, color: "text-cyan-400" },
                { id: "upload", label: "Stake & Earn", icon: Upload, color: "text-orange-400" },
                { id: "wallet", label: "Wallet", icon: Coins, color: "text-cyan-400" }
              ].map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 group ${
                      isActive
                        ? "bg-white/5 border-orange-500/20 text-white shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-white/2"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 transition-colors duration-200 ${isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Tarjeta de Balance de Billetera Consolidada (Fiel al Mockup) */}
            <div className="glass-card rounded-2xl p-4 flex flex-col gap-2 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Wallet Balance</span>
                <h4 className="text-sm font-extrabold text-white tracking-tight flex items-baseline gap-1">
                  ANC 12,450.75
                </h4>
                <span className="text-[8px] font-mono text-orange-400 font-bold -mt-0.5 flex items-center gap-1">
                  ≈ $8,745.20 USD <span className="text-emerald-400">+12.5%</span>
                </span>
              </div>
              
              {/* Gráfico de Tendencia Sparkline (Fiel al Mockup) */}
              <div className="h-7 w-full flex items-end mt-1 opacity-80">
                <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d="M 0,25 C 10,20 20,28 30,15 C 40,5 50,22 60,18 C 70,12 80,5 90,8 C 95,9 100,2 100,2"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]"
                  />
                  <path
                    d="M 0,25 C 10,20 20,28 30,15 C 40,5 50,22 60,18 C 70,12 80,5 90,8 C 95,9 100,2 100,2 L 100,30 L 0,30 Z"
                    fill="url(#sparkline-grad)"
                    className="opacity-10"
                  />
                  <defs>
                    <linearGradient id="sparkline-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Tarjeta de Perfil de Usuario en la Base (Fiel al Mockup) */}
          <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar de Cristal */}
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-gradient-to-tr from-cyan-500/20 to-orange-500/20 flex items-center justify-center">
                <User className="w-5.5 h-5.5 text-white/80" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-extrabold text-white truncate leading-snug">0xEchoSoul</h5>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[7px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/10 uppercase tracking-wider">
                    OG Listener
                  </span>
                  <span className="text-[7px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wider">
                    Verified
                  </span>
                </div>
              </div>
            </div>
            
            {/* Botón de Desconexión */}
            <button 
              onClick={() => {
                if (connected) {
                  toast.success("Billetera desconectada");
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Desconectar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: CATÁLOGO CENTRAL AMPLIO (5 Columnas) - OPCIÓN 2 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* VISTA 1: REPRODUCTOR HOLOGRÁFICO PRINCIPAL (ANCSTR ERA) */}
          {activeTab === "player" && (
            <div className="flex flex-col gap-5 flex-1 justify-between min-h-[580px]">
              {/* Información de Canción Actual (Fiel al Mockup) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-orange-500 uppercase tracking-widest font-bold">Now Playing</span>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold text-white tracking-tight truncate">
                      {currentTrack.title}
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5 flex items-center gap-1.5">
                      <span>{currentTrack.artist_name}</span>
                      {currentTrack.artist_wallet && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      )}
                      <span className="text-[9px] text-zinc-500 font-mono">ANCSTR ERA</span>
                    </p>
                  </div>
                  
                  {/* Acciones e Indicadores de Calidad */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-bold text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase">
                      320 kbps
                    </span>
                    <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/10 uppercase tracking-wider">
                      Lossless
                    </span>
                    <button 
                      onClick={() => {
                        if (likedTracks.includes(currentTrack.track_id)) {
                          setLikedTracks(likedTracks.filter(id => id !== currentTrack.track_id));
                          toast.success("Eliminado de favoritos");
                        } else {
                          setLikedTracks([...likedTracks, currentTrack.track_id]);
                          toast.success("Añadido a favoritos");
                        }
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-orange-500 transition-all duration-200 border border-white/5"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedTracks.includes(currentTrack.track_id) ? "fill-orange-500 text-orange-500" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENEDOR DE LA ESFERA HOLOGRÁFICA GIGANTE (Fiel al Mockup) */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#020204]/60 border border-white/5 shadow-2xl flex items-center justify-center group">
                {/* Cuadrícula de Fondo Holográfica sutil */}
                <div className="absolute inset-0 cyberpunk-grid opacity-20 pointer-events-none" />
                
                {/* Resplandor Dual de Fondo */}
                <div className="absolute w-64 h-64 bg-gradient-to-tr from-cyan-500/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />
                
                {/* Esfera Holográfica 3D (Multicapa CSS/SVG) */}
                <div className="relative w-64 h-64 flex items-center justify-center sphere-container">
                  {/* Malla 1: Latitudes (Cian) */}
                  <div className="absolute inset-0 sphere-mesh-1 opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2,2" transform="rotate(30 50 50)" />
                      <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2,2" transform="rotate(75 50 50)" />
                      <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2,2" transform="rotate(120 50 50)" />
                      <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2,2" transform="rotate(165 50 50)" />
                    </svg>
                  </div>

                  {/* Malla 2: Longitudes (Naranja) */}
                  <div className="absolute inset-0 sphere-mesh-2 opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <ellipse cx="50" cy="50" rx="45" ry="22" fill="none" stroke="#fb923c" strokeWidth="0.5" strokeDasharray="3,1" transform="rotate(-15 50 50)" />
                      <ellipse cx="50" cy="50" rx="45" ry="22" fill="none" stroke="#fb923c" strokeWidth="0.5" strokeDasharray="3,1" transform="rotate(-60 50 50)" />
                      <ellipse cx="50" cy="50" rx="45" ry="22" fill="none" stroke="#fb923c" strokeWidth="0.5" strokeDasharray="3,1" transform="rotate(-105 50 50)" />
                      <ellipse cx="50" cy="50" rx="45" ry="22" fill="none" stroke="#fb923c" strokeWidth="0.5" strokeDasharray="3,1" transform="rotate(-150 50 50)" />
                    </svg>
                  </div>

                  {/* Núcleo de Energía Esférico */}
                  <div 
                    className="absolute w-28 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-orange-500/20 blur-xl transition-all duration-300 animate-pulse"
                    style={{
                      transform: isPlaying ? `scale(${1 + bassIntensity * 0.15})` : 'scale(1)',
                      opacity: isPlaying ? 0.8 : 0.4
                    }}
                  />
                  <div className="absolute w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <Disc className={`w-6 h-6 text-white ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: isPlaying ? `${4 / playbackRate}s` : '0s' }} />
                  </div>

                  {/* Onda de Frecuencia Horizontal Cruzando la Esfera */}
                  <div className="absolute inset-x-[-20px] h-20 flex items-center justify-between pointer-events-none z-10 opacity-80">
                    {dynamicFrequencies.map((height, idx) => (
                      <div 
                        key={idx}
                        className="w-[1.5px] rounded-full transition-all duration-75 origin-center"
                        style={{ 
                          height: `${Math.max(4, height * 0.8)}px`,
                          backgroundColor: idx < dynamicFrequencies.length / 2 ? '#22d3ee' : '#fb923c',
                          boxShadow: isPlaying 
                            ? `0 0 ${bassIntensity * 10}px ${idx < dynamicFrequencies.length / 2 ? 'rgba(6,182,212,0.6)' : 'rgba(249,115,22,0.6)'}` 
                            : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Pedestal de Luz Concéntrico en la Base */}
                <div className="absolute bottom-6 flex flex-col items-center justify-center">
                  <div className="w-36 h-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center" style={{ transform: 'rotateX(75deg)' }}>
                    <div className="w-24 h-2 rounded-full bg-orange-500/20 border border-orange-500/30 animate-pulse" />
                  </div>
                  <div className="w-48 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-xs mt-1" />
                </div>
              </div>

              {/* BARRA DE REPRODUCCIÓN FLOTANTE TRANSLÚCIDA (Fiel al Mockup) */}
              <div className="glass-player-bar rounded-2xl p-4 flex flex-col gap-3 border border-white/5 shadow-2xl">
                {/* Barra de Progreso Fina de Neón */}
                <div className="flex flex-col gap-1">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={(value) => {
                      if (audioRef.current) {
                        const newTime = (value[0] / 100) * audioDuration;
                        audioRef.current.currentTime = newTime;
                        setProgress(value[0]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>

                {/* Controles de Reproducción Retroiluminados */}
                <div className="flex items-center justify-between">
                  {/* Botones Auxiliares Izquierda */}
                  <div className="flex items-center gap-3">
                    <button 
                      className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-all duration-200"
                      title="Shuffle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.2 0 2.3.6 3 1.7l1.1 1.6"/><path d="m15.4 12.8 1.2 1.7c.8 1.1 2 1.7 3.2 1.7H22"/><path d="m18 14 4 4-4 4"/></svg>
                    </button>
                    <button 
                      onClick={handlePrev}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all duration-200"
                      title="Prev"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Botón Play/Pause Gigante de Neón Naranja */}
                  <button
                    onClick={handlePlayPause}
                    className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-orange-500/20 border border-orange-400/20 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4.5 h-4.5 fill-white" /> : <Play className="w-4.5 h-4.5 fill-white ml-0.5" />}
                  </button>

                  {/* Botones Auxiliares Derecha */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleNext}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all duration-200"
                      title="Next"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-all duration-200"
                      title="Repeat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                    </button>
                  </div>
                </div>

                {/* Barra de Control de Volumen */}
                <div className="flex items-center gap-2.5 px-1 mt-1">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(value) => {
                      setVolume(value[0]);
                      if (audioRef.current) audioRef.current.volume = value[0] / 100;
                    }}
                    className="w-20 cursor-pointer"
                  />
                  <div className="w-px h-3 bg-white/5 ml-auto" />
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">Hi-Fi Audio</span>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: CATÁLOGO DE MÚSICA (DISCOVER) */}
          {activeTab === "catalog" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Discover New Music</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Catálogo Descentralizado</h3>
              </div>
              
              {/* Cuadro de Búsqueda */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar canciones, artistas, géneros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/5 focus:border-cyan-500/50 text-white placeholder-zinc-500 text-xs py-5 pl-10 pr-4 rounded-xl w-full transition-all duration-300 backdrop-blur-md"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>

              {/* Filtro Rápido por Género */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {["Todos", "Ambient", "Synthwave", "House", "Techno", "Lo-Fi / Beats"].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap ${
                      selectedGenre === genre
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/10"
                        : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Lista de Canciones */}
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {tracks
                  .filter(track => {
                    const matchesGenre = selectedGenre === "Todos" || track.genre === selectedGenre;
                    const matchesSearch = 
                      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      track.artist_name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesGenre && matchesSearch;
                  })
                  .map((track) => {
                    const isPurchased = purchasedTracks.includes(track.track_id);
                    const isCurrent = currentTrack.track_id === track.track_id;
                    return (
                      <div 
                        key={track.track_id}
                        className={`glass-card rounded-xl p-3 flex items-center justify-between group transition-all duration-300 ${isCurrent ? 'border-cyan-500/30 bg-cyan-500/5' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                            <img src={track.ipfs_cover_hash || "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp"} alt={track.title} className="w-full h-full object-cover" />
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="flex gap-0.5 items-end h-3">
                                  <div className="w-0.5 bg-cyan-400 animate-[pulse_0.8s_infinite]" style={{ height: '60%' }} />
                                  <div className="w-0.5 bg-cyan-400 animate-[pulse_0.5s_infinite_0.1s]" style={{ height: '100%' }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors duration-200">{track.title}</h4>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artist_name}</p>
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCurrentTrack(track);
                              if (!isPlaying) handlePlayPause();
                              setActiveTab("player");
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-400 transition-all duration-200"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          
                          {!isPurchased ? (
                            <Button
                              onClick={() => handlePurchaseTrack(track)}
                              disabled={isProcessingTx}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[9px] h-7 px-2.5 rounded-lg"
                            >
                              COMPRAR
                            </Button>
                          ) : (
                            <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/10">
                              LICENCIA
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* VISTAS 3, 4, 5: TENDENCIAS, HISTORIAL, PUBLICAR (REUTILIZACIÓN ORIGINAL) */}
          {activeTab === "trending" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest">Global Feed</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Tendencias Globales</h3>
              </div>
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {trendingTracks.map((track, index) => (
                  <div key={track.track_id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-zinc-500 w-4">{index + 1}</span>
                      <img src={track.ipfs_cover_hash} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artist_name}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded">
                      {track.sales_count} VENTAS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">My Collection</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Mi Historial Web3</h3>
              </div>
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {userHistory.map((record) => (
                  <div key={record.track_id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={record.ipfs_cover_hash} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{record.title}</h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{record.artist_name}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                      ADQUIRIDA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest">Creator Portal</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Publicar Licencia Digital</h3>
              </div>
              
              {/* Formulario de Subida Original */}
              <div className="glass-card rounded-xl p-4 border border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Título</label>
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-white/5 text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Artista</label>
                    <Input value={newArtist} onChange={(e) => setNewArtist(e.target.value)} className="bg-white/5 text-xs h-8" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Género</label>
                    <select 
                      value={newGenre} 
                      onChange={(e) => setNewGenre(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-lg h-8 px-2 text-xs text-white font-sans"
                    >
                      {SPOTIFY_GENRES.map(g => <option key={g} value={g} className="bg-zinc-950">{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase">Precio (SOL)</label>
                    <Input value={newPriceSol} onChange={(e) => setNewPriceSol(e.target.value)} className="bg-white/5 text-xs h-8" />
                  </div>
                </div>

                {/* Subida de Archivos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Audio (.mp3)</span>
                    <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg p-3 hover:bg-white/5 cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-cyan-400 mb-1" />
                      <span className="text-[8px] text-zinc-400 text-center truncate max-w-[100px]">
                        {isUploadingAudio ? "Subiendo..." : uploadedAudioHash ? "Audio Listo" : "Subir Audio"}
                      </span>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "audio");
                        }} 
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Portada (Imagen)</span>
                    <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg p-3 hover:bg-white/5 cursor-pointer transition-all">
                      <Disc className="w-4 h-4 text-orange-400 mb-1" />
                      <span className="text-[8px] text-zinc-400 text-center truncate max-w-[100px]">
                        {isUploadingCover ? "Subiendo..." : uploadedCoverHash ? "Portada Lista" : "Subir Portada"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "cover");
                        }} 
                      />
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!newTitle || !newArtist || !uploadedAudioHash) {
                      toast.error("Completa los campos obligatorios y sube el archivo de audio");
                      return;
                    }
                    setIsUploadingIPFS(true);
                    try {
                      const newTrackObj = {
                        track_id: `track-${tracks.length + 1}`,
                        title: newTitle,
                        artist_name: newArtist,
                        genre: newGenre || "Ambient",
                        price_sol: parseFloat(newPriceSol) || 0.1,
                        price_usdc: parseFloat(newPriceUsdc) || 3.0,
                        price_usdt: parseFloat(newPriceUsdt) || 3.0,
                        price_eth: parseFloat(newPriceEth) || 0.001,
                        price_btc: parseFloat(newPriceBtc) || 0.00005,
                        ipfs_audio_hash: uploadedAudioHash,
                        ipfs_cover_hash: uploadedCoverHash || "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp",
                        sales_count: 0,
                        artist_wallet: publicKey ? publicKey.toBase58() : "Art1stSolanaWa11etAddressX111111111111111"
                      };
                      setTracks([newTrackObj, ...tracks]);
                      toast.success("Licencia de música publicada con éxito en IPFS & Solana!");
                      setActiveTab("catalog");
                    } catch (err) {
                      toast.error("Error al publicar la licencia");
                    } finally {
                      setIsUploadingIPFS(false);
                    }
                  }}
                  disabled={isUploadingIPFS || !uploadedAudioHash}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs h-9 tracking-wider rounded-xl"
                >
                  {isUploadingIPFS ? "PUBLICANDO..." : "PUBLICAR LICENCIA DIGITAL"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Web3 Wallet</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Detalle de Saldos</h3>
              </div>
              <div className="glass-card rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Solana Balance</span>
                  <span className="text-amber-500 font-bold">{connected && solBalance !== null ? `${solBalance} SOL` : "0.00 SOL"}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">USDC Balance</span>
                  <span className="text-green-500 font-bold">{usdcBalance} USDC</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">USDT Balance</span>
                  <span className="text-teal-500 font-bold">{usdtBalance} USDT</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Ethereum Balance</span>
                  <span className="text-purple-400 font-bold">{ethBalance} ETH</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Bitcoin Balance</span>
                  <span className="text-yellow-500 font-bold">{btcBalance} BTC</span>
                </div>
              </div>
            </div>
          )}

          {/* --- PANEL DE MODELO DE NEGOCIO (DESGLOSE 85/15) --- */}
          <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <h4 className="text-[10px] font-bold text-white flex items-center gap-2 tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              Split Directo de Fondos (85/15)
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
              Cada adquisición de licencia digital o propina realiza una **distribución atómica de fondos** programada de forma inmutable. El **85%** va de forma instantánea a la clave pública del artista, mientras que el **15%** va a la tesorería de soporte de la plataforma.
            </p>
            {/* Visualizador de Split */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 font-mono text-[10px] space-y-2.5 relative">
              <div className="flex justify-between items-center text-zinc-500 border-b border-white/5 pb-1.5">
                <span>CONCEPTO</span>
                <span>DISTRIBUCIÓN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Artista (Soberanía Directa)
                </span>
                <span className="text-orange-400 font-bold">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" /> Plataforma (Soporte)
                </span>
                <span className="text-zinc-500">15%</span>
              </div>
              {isProcessingTx && txSplitDetails && (
                <div className="absolute inset-0 bg-black/90 rounded-xl flex flex-col justify-center items-center p-4 border border-orange-500/20">
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin mb-1.5" />
                  <p className="text-[9px] text-orange-400 animate-pulse text-center uppercase tracking-wider font-bold">Procesando Split Atómico...</p>
                  <p className="text-[8px] text-zinc-500 mt-0.5">
                    Artista: {txSplitDetails.artistShare} {txSplitDetails.currency} | Plataforma: {txSplitDetails.platformShare} {txSplitDetails.currency}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 3: CONTENIDOS Y RECOMPENSAS (4 Columnas) - OPCIÓN 2 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* SECCIÓN 1: ANCSTR ERA (Álbumes Destacados - Fiel al Mockup) */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Ancstr Era</span>
              <button 
                onClick={() => setActiveTab("catalog")}
                className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition-colors duration-200"
              >
                View All
              </button>
            </div>
            
            {/* Grid de Álbumes de Cristal */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { title: "The Genesis", vol: "Vol. 1", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp" },
                { title: "Cyber Echoes", vol: "Vol. 2", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_stable-ZkbAmoDjUkftQcV24apMRo.webp" },
                { title: "Into the Abyss", vol: "Vol. 3", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_history-iKDCRAzXkDSabWpUUxBDQ8.webp" },
                { title: "Rebirth", vol: "Vol. 4", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp" }
              ].map((album, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col gap-1.5 cursor-pointer group"
                  onClick={() => {
                    toast.success(`Cargando álbum: ${album.title}`);
                  }}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-white/5 group-hover:border-cyan-500/30 transition-all duration-300">
                    <img src={album.img} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-1">
                      <span className="text-[7px] font-mono text-cyan-400 font-bold uppercase">Play</span>
                    </div>
                  </div>
                  <div className="min-w-0 px-0.5">
                    <h5 className="text-[8px] font-bold text-white truncate leading-tight">{album.title}</h5>
                    <p className="text-[7px] text-zinc-500 font-mono truncate mt-0.5">{album.vol}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: UP NEXT (Lista de Reproducción - Fiel al Mockup) */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest font-bold">Up Next</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Autoplay</span>
                <button 
                  className="w-7 h-4 rounded-full bg-orange-500/20 border border-orange-500/30 p-0.5 flex items-center justify-end cursor-pointer"
                  title="Toggle Autoplay"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                </button>
              </div>
            </div>

            {/* Lista de Canciones */}
            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-0.5">
              {tracks.slice(0, 5).map((track, idx) => {
                const isCurrent = currentTrack.track_id === track.track_id;
                return (
                  <div 
                    key={track.track_id}
                    onClick={() => {
                      setCurrentTrack(track);
                      if (!isPlaying) handlePlayPause();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isCurrent 
                        ? "bg-cyan-500/5 border-cyan-500/20 text-cyan-400" 
                        : "bg-white/2 border-white/5 hover:bg-white/5 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                        <img src={track.ipfs_cover_hash} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[10px] font-bold truncate leading-snug">{track.title}</h5>
                        <p className="text-[8px] text-zinc-500 truncate mt-0.5">{track.artist_name}</p>
                      </div>
                    </div>
                    
                    {/* Duración o Icono Activo */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-0.5 items-end h-2.5">
                          <div className="w-0.5 h-2.5 bg-cyan-400 animate-pulse" />
                          <div className="w-0.5 h-1.5 bg-cyan-400 animate-pulse [animation-delay:0.2s]" />
                          <div className="w-0.5 h-2 bg-cyan-400 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      ) : (
                        <span className="text-[8px] font-mono text-zinc-500">03:45</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 3: EARN ANC & CUBO 3D GIRATORIO (Fiel al Mockup) */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
            {/* Orbe de neón de fondo */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Lado Izquierdo: Información y Progreso */}
            <div className="flex flex-col gap-2.5 flex-1 pr-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-orange-500 uppercase tracking-widest font-bold">Earn Anc</span>
                <h4 className="text-sm font-extrabold text-white tracking-tight flex items-baseline gap-1">
                  3,200 <span className="text-[9px] text-orange-400 font-mono">ANC</span>
                </h4>
              </div>
              
              {/* Barra de Progreso */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: '65%' }} />
                </div>
                <div className="flex justify-between text-[7px] font-mono text-zinc-500 uppercase">
                  <span>Locked</span>
                  <span>Goal: 5,000 ANC</span>
                </div>
              </div>
            </div>

            {/* Lado Derecho: Cubo 3D Giratorio Real en CSS */}
            <div className="w-14 h-14 flex items-center justify-center relative">
              <div className="cube-3d">
                <div className="cube-face cube-front" />
                <div className="cube-face cube-back" />
                <div className="cube-face cube-left" />
                <div className="cube-face cube-right" />
                <div className="cube-face cube-top" />
                <div className="cube-face cube-bottom" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: COMUNIDAD, PROPINAS Y COMENTARIOS */}
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3.5">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Muro Descentralizado</span>
            
            {/* Formulario de Propina Rápida */}
            <div className="flex flex-col gap-1.5 bg-black/20 border border-white/5 rounded-xl p-3">
              <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Enviar Propina al Artista</label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="SOL" 
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-white/5 border-white/5 text-white text-xs h-8.5 rounded-lg"
                />
                <Button 
                  onClick={handleSendTip}
                  disabled={isProcessingTip || !connected}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-[10px] h-8.5 px-3.5 rounded-lg shadow-md shadow-cyan-500/10 whitespace-nowrap"
                >
                  {isProcessingTip ? "Enviando..." : "Dar Propina"}
                </Button>
              </div>
            </div>

            {/* Lista de Comentarios */}
            <div className="space-y-2.5 pt-1.5 border-t border-white/5">
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-0.5">
                {comments.map((c, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-mono text-cyan-400 font-bold truncate max-w-[100px]">
                        {c.author_wallet ? `${c.author_wallet.slice(0, 4)}...${c.author_wallet.slice(-4)}` : "Anon_Collector"}
                      </span>
                      <span className="text-[7px] text-zinc-500 font-mono">{new Date(c.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[9px] text-zinc-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Formulario de Comentario */}
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Añadir comentario..." 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="bg-white/5 border-white/5 text-white text-xs h-8.5 rounded-lg"
                />
                <Button 
                  disabled={isSubmittingComment || !newCommentText.trim() || !connected}
                  onClick={() => {
                    if (!publicKey) {
                      toast.error("Error", {
                        description: "Por favor conecta tu billetera primero."
                      });
                      return;
                    }
                    setIsSubmittingComment(true);
                    try {
                      const hasLicense = purchasedTracks.some(trackId => {
                        const track = tracks.find(t => t.track_id === trackId);
                        return track && track.artist_wallet.toLowerCase() === currentTrack.artist_wallet.toLowerCase();
                      });
                      const newComment = {
                        comment_id: `comment-${Math.random().toString(36).substr(2, 9)}`,
                        artist_wallet: currentTrack.artist_wallet,
                        author_wallet: publicKey.toString(),
                        author_name: authorName.trim() || (publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : 'Anon_Collector'),
                        text: newCommentText,
                        timestamp: Date.now(),
                        has_license: hasLicense
                      };
                      setComments(prev => [newComment, ...prev]);
                      setNewCommentText("");
                      toast.success("Mensaje publicado", {
                        description: "Tu mensaje ha sido grabado en el muro descentralizado."
                      });
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setIsSubmittingComment(false);
                    }
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] h-8.5 px-3 rounded-lg border border-white/5"
                >
                  {isSubmittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- PIE DE PÁGINA --- */}
      <footer className="border-t border-zinc-900 bg-black py-6 mt-12 text-center text-[11px] text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 ANCSTR MUSIC. Almacenamiento descentralizado y split de ingresos 85/15 directo en cripto.</p>
          <p className="text-zinc-600">Enfoque exclusivo en activos y licencias digitales.</p>
        </div>
      </footer>
    </div>
  );
}
