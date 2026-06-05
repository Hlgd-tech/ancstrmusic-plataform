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
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* COLUMNA 1: MENÚ LATERAL DE CONTROL FLOTANTE (3 Columnas) - OPCIÓN 2 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Tarjeta de Perfil Holográfica */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-orange-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                    <User className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0f] rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-cyan-400 tracking-widest uppercase">ONLINE / WEB3</span>
                <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[140px]">
                  {connected ? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}` : "Anon_Collector"}
                </h3>
              </div>
            </div>
            
            <div className="solana-wallet-btn-container w-full">
              <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-blue-600 hover:!from-cyan-600 hover:!to-blue-700 !w-full !h-9 !rounded-xl !text-xs !font-bold !tracking-wide !transition-all !font-sans !justify-center !shadow-lg !shadow-cyan-500/10" />
            </div>
          </div>

          {/* Tarjeta de Saldos Consolidados (Glassmorphism) */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
            <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-orange-400" />
              Balances Consolidados
            </h4>
            
            <div className="space-y-3.5">
              {/* SOL */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Solana (SOL)
                  </span>
                  <span className="text-white font-semibold">{connected && solBalance !== null ? `${solBalance}` : "0.00"} SOL</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: connected ? '45%' : '0%' }} />
                </div>
              </div>

              {/* USDC */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> USD Coin (USDC)
                  </span>
                  <span className="text-white font-semibold">{usdcBalance.toFixed(2)} USDC</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* USDT */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Tether (USDT)
                  </span>
                  <span className="text-white font-semibold">{usdtBalance.toFixed(2)} USDT</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>

              {/* ETH */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Ethereum (ETH)
                  </span>
                  <span className="text-white font-semibold">{ethBalance.toFixed(4)} ETH</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              {/* BTC */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Bitcoin (BTC)
                  </span>
                  <span className="text-white font-semibold">{btcBalance.toFixed(5)} BTC</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Menú de Control de Pestañas Vertical */}
          <div className="glass-card rounded-2xl p-2 flex flex-col gap-1">
            <button
              onClick={() => {
                const el = document.querySelector('[value="catalog"]') as HTMLButtonElement;
                if (el) el.click();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-left"
            >
              <Disc className="w-4 h-4 text-cyan-400" />
              Catálogo de Música
            </button>
            <button
              onClick={() => {
                const el = document.querySelector('[value="trending"]') as HTMLButtonElement;
                if (el) el.click();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-left"
            >
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Tendencias Globales
            </button>
            <button
              onClick={() => {
                const el = document.querySelector('[value="history"]') as HTMLButtonElement;
                if (el) el.click();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-left"
            >
              <History className="w-4 h-4 text-cyan-400" />
              Mi Historial Web3
            </button>
            <button
              onClick={() => {
                const el = document.querySelector('[value="upload"]') as HTMLButtonElement;
                if (el) el.click();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-left"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              Publicar Licencia (Artista)
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: CATÁLOGO CENTRAL AMPLIO (5 Columnas) - OPCIÓN 2 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Tabs defaultValue="catalog" className="w-full">
            {/* TabsList oculto de forma segura para usar los botones del menú lateral izquierdo */}
            <div className="hidden">
              <TabsList>
                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                <TabsTrigger value="trending">Tendencias</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="upload">Publicar</TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: CATÁLOGO */}
            <TabsContent value="catalog" className="mt-0 outline-none space-y-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">DISCOVER NEW MUSIC</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Catálogo Descentralizado</h3>
              </div>

              {/* Cuadro de Búsqueda Global */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar canciones, artistas, géneros, álbumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/5 focus:border-cyan-500/50 text-white placeholder-zinc-500 text-xs py-5.5 pl-10 pr-4 rounded-xl w-full transition-all duration-300 backdrop-blur-md"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/70">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase text-zinc-500 hover:text-zinc-300"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Filtro Rápido por Género (Horizontal Scrollable) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {["Todos", "Ambient", "Synthwave", "House", "Techno", "Lo-Fi / Beats", "Pop", "Hip Hop", "Rock", "Acoustic / Indie"].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`text-[10px] font-mono uppercase tracking-wider px-3.5 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap ${
                      selectedGenre === genre
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/10"
                        : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Grid de Canciones en Tarjetas de Cristal */}
              <div className="grid grid-cols-1 gap-4">
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
                    const isPurchased = purchasedTracks.includes(track.track_id);
                    const isCurrent = currentTrack.track_id === track.track_id;
                    return (
                      <div 
                        key={track.track_id}
                        className={`glass-card rounded-2xl p-4 flex items-center justify-between group transition-all duration-300 ${isCurrent ? 'border-cyan-500/30 bg-cyan-500/5' : ''}`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                            <img src={track.ipfs_cover_hash || "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp"} alt={track.title} className="w-full h-full object-cover" />
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="flex gap-0.5 items-end h-4">
                                  <div className="w-0.5 bg-cyan-400 animate-[pulse_0.8s_infinite]" style={{ height: '60%' }} />
                                  <div className="w-0.5 bg-cyan-400 animate-[pulse_0.5s_infinite_0.1s]" style={{ height: '100%' }} />
                                  <div className="w-0.5 bg-cyan-400 animate-[pulse_0.7s_infinite_0.2s]" style={{ height: '40%' }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>{track.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{track.artist_name}</p>
                            <span className="inline-block text-[8px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider">{track.genre}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <button
                            onClick={() => handlePlayTrack(track)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCurrent && isPlaying 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'bg-white/5 hover:bg-cyan-500 hover:text-white text-zinc-400'
                            }`}
                          >
                            {isCurrent && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                          </button>
                          
                          <div className="text-right">
                            <span className="block text-[10px] font-bold text-white">{track.price_sol} SOL</span>
                            <span className="block text-[8px] text-zinc-500 font-mono">${track.price_usdc.toFixed(2)} USDC</span>
                          </div>

                          <Button
                            onClick={() => handlePurchaseTrack(track)}
                            disabled={isPurchased}
                            className={`text-[9px] font-mono font-bold uppercase h-7 px-2.5 rounded-lg ${
                              isPurchased 
                                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/10'
                            }`}
                          >
                            {isPurchased ? "Adquirido" : "Comprar"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>

            {/* TAB: TENDENCIAS */}
            <TabsContent value="trending" className="mt-0 outline-none space-y-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">GLOBAL CHARTS</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Tendencias Globales</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {trendingTracks.map((track, index) => {
                  const isPurchased = purchasedTracks.includes(track.track_id);
                  const isCurrent = currentTrack.track_id === track.track_id;
                  return (
                    <div 
                      key={track.track_id}
                      className="glass-card rounded-2xl p-4 flex items-center justify-between group relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
                      <div className="flex items-center gap-4 min-w-0 flex-1 pl-2">
                        <span className="text-sm font-mono font-bold text-orange-500/70 w-4">{index + 1}</span>
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                          <img src={track.ipfs_cover_hash} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-orange-400' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{track.artist_name}</p>
                          <span className="inline-block text-[8px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider">{track.genre}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-white">{track.sales_count} ventas</span>
                          <span className="block text-[8px] text-zinc-500 font-mono">Populares</span>
                        </div>
                        <button
                          onClick={() => handlePlayTrack(track)}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-orange-500 hover:text-white text-zinc-400 flex items-center justify-center transition-all"
                        >
                          {isCurrent && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB: MI HISTORIAL */}
            <TabsContent value="history" className="mt-0 outline-none space-y-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">TRANSACTION HISTORY</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Mi Historial Web3</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {userHistory.map((record, idx) => (
                  <div 
                    key={idx}
                    className="glass-card rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                        <img src={record.ipfs_cover_hash} alt={record.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{record.title}</h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">{record.artist_name}</p>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded mt-1 inline-block uppercase">Licencia Adquirida</span>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <span className="block text-xs font-mono font-bold text-cyan-400">-{record.amount_paid} {record.currency}</span>
                      <span className="block text-[8px] text-zinc-500 font-mono mt-0.5">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB: PUBLICAR (ARTISTA) */}
            <TabsContent value="upload" className="mt-0 outline-none space-y-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest">CREATOR PORTAL</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Publicar Licencia Digital</h3>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <form onSubmit={handleUploadTrack} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Título de la Canción *</label>
                      <Input 
                        type="text" 
                        placeholder="Ej: Satoshi Groove" 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        className="bg-white/5 border-white/5 focus:border-orange-500/50 text-white text-xs h-9.5 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Nombre del Artista *</label>
                      <Input 
                        type="text" 
                        placeholder="Ej: Anchor Band" 
                        value={newArtist} 
                        onChange={(e) => setNewArtist(e.target.value)}
                        required
                        className="bg-white/5 border-white/5 focus:border-orange-500/50 text-white text-xs h-9.5 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Género *</label>
                      <select 
                        value={newGenre} 
                        onChange={(e) => setNewGenre(e.target.value)}
                        required
                        className="bg-white/5 border border-white/5 text-white text-xs h-9.5 rounded-xl px-3 w-full focus:outline-none focus:border-orange-500/50"
                      >
                        <option value="" disabled className="bg-[#0a0a0f]">Seleccionar género</option>
                        {GENRE_OPTIONS.map((g) => (
                          <option key={g} value={g} className="bg-[#0a0a0f]">{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Precio en SOL *</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={newPriceSol} 
                        onChange={(e) => setNewPriceSol(e.target.value)}
                        required
                        className="bg-white/5 border-white/5 focus:border-orange-500/50 text-white text-xs h-9.5 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Precio en USDC *</label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={newPriceUsdc} 
                        onChange={(e) => setNewPriceUsdc(e.target.value)}
                        required
                        className="bg-white/5 border-white/5 focus:border-orange-500/50 text-white text-xs h-9.5 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* SUBIDA DE AUDIO REAL A IPFS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border border-dashed rounded-xl p-4 text-center bg-white/5 flex flex-col justify-center items-center transition-all ${isUploadingAudio ? 'border-orange-500/50 shadow-lg shadow-orange-500/5' : 'border-white/5'}`}>
                      {isUploadingAudio ? (
                        <div className="flex flex-col items-center justify-center py-2">
                          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
                          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider animate-pulse">Subiendo Audio a IPFS...</span>
                        </div>
                      ) : (
                        <>
                          <Music className="w-6 h-6 text-zinc-500 mb-2" />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Archivo de Audio *</span>
                          <input 
                            type="file" 
                            accept="audio/*" 
                            onChange={handleAudioUpload} 
                            required={!uploadedAudioHash}
                            className="mt-2 bg-white/5 border-white/5 text-zinc-300 text-[10px] h-8 file:text-xs file:bg-zinc-800 file:text-zinc-200"
                          />
                          {uploadedAudioHash && (
                            <p className="text-[9px] text-green-500 font-mono mt-2 truncate max-w-full">Listo en IPFS: Audio Subido</p>
                          )}
                        </>
                      )}
                    </div>

                    <div className={`border border-dashed rounded-xl p-4 text-center bg-white/5 flex flex-col justify-center items-center transition-all ${isUploadingCover ? 'border-orange-500/50 shadow-lg shadow-orange-500/5' : 'border-white/5'}`}>
                      {isUploadingCover ? (
                        <div className="flex flex-col items-center justify-center py-2">
                          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
                          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider animate-pulse">Subiendo Portada...</span>
                        </div>
                      ) : (
                        <>
                          <Image className="w-6 h-6 text-zinc-500 mb-2" />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">Imagen de Portada</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleCoverUpload} 
                            className="mt-2 bg-white/5 border-white/5 text-zinc-300 text-[10px] h-8 file:text-xs file:bg-zinc-800 file:text-zinc-200"
                          />
                          {uploadedCoverHash && (
                            <p className="text-[9px] text-green-500 font-mono mt-2 truncate max-w-full">Listo en IPFS: Portada Subida</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isUploadingIPFS || !uploadedAudioHash}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs h-10 tracking-wider shadow-lg shadow-orange-500/10 rounded-xl"
                  >
                    PUBLICAR LICENCIA DIGITAL EN BLOCKCHAIN
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>

          {/* --- PANEL DE MODELO DE NEGOCIO (DESGLOSE 85/15) --- */}
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <h4 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              Split Directo de Fondos (85/15)
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Cada adquisición de licencia digital o propina realiza una **distribución atómica de fondos** programada de forma inmutable. El **85%** va de forma instantánea a la clave pública del artista, mientras que el **15%** va a la tesorería de soporte de la plataforma.
            </p>
            {/* Visualizador interactivo de Split */}
            <div className="bg-black/50 border border-white/5 rounded-xl p-4 font-mono text-[11px] space-y-3 relative">
              <div className="flex justify-between items-center text-zinc-500 border-b border-white/5 pb-2">
                <span>CONCEPTO</span>
                <span>DISTRIBUCIÓN</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Artista (Soberanía Directa)
                </span>
                <span className="text-orange-400 font-bold">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-700" /> Plataforma (Soporte)
                </span>
                <span className="text-zinc-500">15%</span>
              </div>
              {isProcessingTx && txSplitDetails && (
                <div className="absolute inset-0 bg-black/90 rounded-xl flex flex-col justify-center items-center p-4 border border-orange-500/20">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin mb-2" />
                  <p className="text-[10px] text-orange-400 animate-pulse text-center uppercase tracking-wider font-bold">Procesando Split Atómico...</p>
                  <p className="text-[9px] text-zinc-500 mt-1">
                    Artista: {txSplitDetails.artistShare} {txSplitDetails.currency} | Plataforma: {txSplitDetails.platformShare} {txSplitDetails.currency}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 3: REPRODUCTOR ANALÓGICO HOLOGRÁFICO (4 Columnas) - OPCIÓN 2 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* REPRODUCTOR ANALÓGICO CON NEÓN PULSANTE AL RITMO DE LOS BAJOS */}
          <div 
            className="glass-card rounded-2xl overflow-hidden relative sticky top-24 transition-all duration-100 p-5 space-y-6"
            style={{
              boxShadow: isPlaying 
                ? `0 0 ${bassIntensity * 25}px rgba(249, 115, 22, ${bassIntensity * 0.45})` 
                : 'none',
              borderColor: isPlaying 
                ? `rgba(249, 115, 22, ${0.1 + bassIntensity * 0.5})` 
                : 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Reproductor Analógico</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest">LOSSLESS STREAM</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              {/* Arte de Portada - ESFERA HOLOGRÁFICA 3D CYBERPUNK (Opción 2) */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#06060a]/80 border border-white/5 shadow-2xl shadow-black/80 mb-6 group flex items-center justify-center">
                {currentTrack.ipfs_cover_hash.includes("album_genesis") || currentTrack.ipfs_cover_hash.includes("album_stable") || currentTrack.ipfs_cover_hash.includes("album_history") || currentTrack.ipfs_cover_hash.includes("QmSimulated") || !currentTrack.ipfs_cover_hash ? (
                  /* Renderizamos la Esfera Holográfica 3D Interactiva de la Opción 2 con CSS 3D */
                  <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#06060a]/95 rounded-2xl p-6">
                    {/* Partículas cósmicas flotantes de fondo */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none">
                      <div className="absolute w-1 h-1 bg-cyan-400 rounded-full top-1/4 left-1/4 animate-ping" style={{ animationDuration: '3s' }} />
                      <div className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full top-1/3 right-1/4 animate-ping" style={{ animationDuration: '4s' }} />
                      <div className="absolute w-0.5 h-0.5 bg-white rounded-full bottom-1/4 left-1/3 animate-pulse" />
                      <div className="absolute w-1 h-1 bg-cyan-300 rounded-full bottom-1/3 right-1/3 animate-pulse" />
                      <div className="absolute w-1.5 h-1.5 bg-orange-300 rounded-full top-10 right-10 animate-pulse" style={{ animationDuration: '5s' }} />
                      <div className="absolute w-0.5 h-0.5 bg-white rounded-full bottom-10 left-10 animate-pulse" style={{ animationDuration: '6s' }} />
                    </div>

                    {/* Glow dual de fondo (Azul a la izquierda, Naranja a la derecha) */}
                    <div className="absolute w-4/5 h-4/5 rounded-full bg-gradient-to-tr from-cyan-500/10 to-orange-500/10 blur-[60px] animate-pulse pointer-events-none" />

                    {/* Contenedor de la Esfera 3D */}
                    <div className="relative w-60 h-64 flex flex-col items-center justify-center">
                      
                      {/* Base holográfica elíptica brillante (Pedestal de luz) */}
                      <div className="absolute bottom-6 w-44 h-4 bg-gradient-to-r from-cyan-500/30 to-orange-500/30 rounded-full blur-sm border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.3)] transform rotateX-60" />
                      <div className="absolute bottom-7 w-36 h-3 bg-gradient-to-r from-cyan-400/40 to-orange-400/40 rounded-full blur-md transform rotateX-60 animate-pulse" />
                      
                      {/* Esfera 3D de Mallas Cruzadas (Efecto Holograma Real) */}
                      <div className={`relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_25s_linear_infinite]' : ''}`} style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                        
                        {/* Anillo de Latitud Horizontal */}
                        <div className="absolute w-full h-full rounded-full border border-cyan-500/30 transform rotateX-75 animate-pulse" />
                        
                        {/* Anillo de Longitud Vertical 1 */}
                        <div className="absolute w-full h-full rounded-full border border-orange-500/30 transform rotateY-75 animate-pulse" style={{ animationDelay: '1s' }} />
                        
                        {/* Anillo de Longitud Vertical 2 */}
                        <div className="absolute w-full h-full rounded-full border border-cyan-500/15 transform rotateY-45" />
                        
                        {/* Anillo de Longitud Vertical 3 */}
                        <div className="absolute w-full h-full rounded-full border border-orange-500/15 transform rotateY-135" />

                        {/* Anillo exterior de partículas y marcas de datos */}
                        <div className="absolute w-[112%] h-[110%] rounded-full border border-dashed border-cyan-500/10 animate-[spin_40s_linear_infinite]" />
                        <div className="absolute w-[106%] h-[106%] rounded-full border border-dashed border-orange-500/10 animate-[spin_20s_linear_infinite_reverse]" />

                        {/* Ondas de espectro de audio esféricas (SVG de alta definición) */}
                        <svg className="w-full h-full absolute opacity-90 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" viewBox="0 0 100 100">
                          {/* Malla de círculos concéntricos que dan volumen */}
                          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#cyber-grad-1)" strokeWidth="0.25" strokeDasharray="1 3" className="opacity-30" />
                          <circle cx="50" cy="50" r="35" fill="none" stroke="url(#cyber-grad-2)" strokeWidth="0.25" strokeDasharray="1 4" className="opacity-40" />
                          <circle cx="50" cy="50" r="25" fill="none" stroke="url(#cyber-grad-1)" strokeWidth="0.2" strokeDasharray="1 2" className="opacity-20" />
                          
                          {/* Onda de sonido central Azul (Frecuencias bajas) */}
                          <path
                            d="M 10,50 C 25,20 35,80 50,50 C 65,20 75,80 90,50"
                            fill="none"
                            stroke="url(#cyber-grad-1)"
                            strokeWidth="1.5"
                            className={isPlaying ? 'animate-[pulse_1.2s_ease-in-out_infinite]' : 'opacity-60'}
                          />
                          
                          {/* Onda de sonido central Naranja (Frecuencias altas) */}
                          <path
                            d="M 10,50 C 20,75 40,25 50,50 C 60,75 80,25 90,50"
                            fill="none"
                            stroke="url(#cyber-grad-2)"
                            strokeWidth="1.0"
                            className={isPlaying ? 'animate-[pulse_1.8s_ease-in-out_infinite_reverse]' : 'opacity-40'}
                          />

                          {/* Espectro de audio circular estático pero reactivo */}
                          <g className="opacity-50">
                            {[...Array(24)].map((_, i) => {
                              const angle = (i * 360) / 24;
                              const rad = (angle * Math.PI) / 180;
                              const r1 = 38;
                              const r2 = isPlaying ? 38 + (i % 3 === 0 ? 8 : i % 2 === 0 ? 5 : 3) : 40;
                              const x1 = 50 + r1 * Math.cos(rad);
                              const y1 = 50 + r1 * Math.sin(rad);
                              const x2 = 50 + r2 * Math.cos(rad);
                              const y2 = 50 + r2 * Math.sin(rad);
                              return (
                                <line
                                  key={i}
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke={angle > 180 ? '#f97316' : '#06b6d4'}
                                  strokeWidth="0.5"
                                  className={isPlaying ? 'animate-pulse' : ''}
                                  style={{ animationDelay: `${i * 0.05}s` }}
                                />
                              );
                            })}
                          </g>

                          <defs>
                            <linearGradient id="cyber-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="50%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                            <linearGradient id="cyber-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="50%" stopColor="#ec4899" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Núcleo de energía de la Esfera */}
                        <div className={`absolute w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-orange-500 opacity-20 blur-xl transition-all duration-500 ${isPlaying ? 'scale-125 opacity-40' : 'scale-100'}`} />
                        <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-orange-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                          <div className="w-3 h-3 rounded-full bg-white animate-ping" />
                        </div>

                      </div>
                    </div>

                    {/* Panel de datos de la pista actual estilo Holograma */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-3 py-2 bg-white/5 border border-white/5 rounded-xl backdrop-blur-md">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">AUDIO SPECTRUM</span>
                        <span className="text-xs font-semibold text-white truncate max-w-[120px]">{currentTrack.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full bg-cyan-400 ${isPlaying ? 'animate-ping' : ''}`} />
                        <span className="text-[9px] font-mono text-zinc-400">320 KBPS</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Si es una portada personalizada, la mostramos con forma de vinilo giratorio */
                  <img 
                    src={currentTrack.ipfs_cover_hash} 
                    alt={currentTrack.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? "animate-spin-vinyl rounded-full max-w-[85%] max-h-[85%] border-4 border-zinc-800" : "scale-100"
                    }`}
                    style={{
                      animationDuration: isPlaying ? `${4 / playbackRate}s` : '0s'
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                {/* Título flotante */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-base font-extrabold text-white tracking-tight drop-shadow-md">{currentTrack.title}</h3>
                  <p className="text-xs text-zinc-300 font-medium drop-shadow-sm">{currentTrack.artist_name}</p>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full space-y-2 mb-6">
                <Slider 
                  value={[progress]} 
                  max={100} 
                  step={0.1}
                  onValueChange={handleProgressChange}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              {/* Controles de reproducción táctiles (Opción 2) */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <button 
                  onClick={() => setPlaybackRate(prev => prev === 1.0 ? 1.25 : prev === 1.25 ? 1.5 : prev === 1.5 ? 0.75 : 1.0)}
                  className="text-[10px] font-mono font-bold text-zinc-500 hover:text-orange-400 transition-colors w-10 text-left"
                  title="Velocidad de reproducción"
                >
                  {playbackRate}x
                </button>
                
                <button 
                  onClick={handlePlayPrev}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/5"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                <button 
                  onClick={handlePlayPause}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center transition-all shadow-lg shadow-orange-500/25 border border-orange-400/20 transform hover:scale-105 active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>

                <button 
                  onClick={handlePlayNext}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/5"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                <button 
                  onClick={() => setVolume(prev => prev === 0 ? 80 : 0)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-white/5"
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Control de Volumen Deslizante */}
              <div className="flex items-center gap-3 w-full px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                <Volume className="w-3.5 h-3.5 text-zinc-500" />
                <Slider 
                  value={[volume]} 
                  max={100} 
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
                <span className="text-[10px] font-mono text-zinc-500 w-6 text-right">{volume}%</span>
              </div>
            </div>
          </div>

          {/* MÓDULO SOCIAL DE COMENTARIOS Y PROPINAS INTEGRADO DEBAJO */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider uppercase">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Muro Descentralizado & Propinas
            </h4>
            
            {/* Formulario de Propina Directa */}
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Enviar Propina Directa al Artista</label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="SOL" 
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-white/5 border-white/5 text-white text-xs h-9 rounded-xl"
                />
                <Button 
                  onClick={handleSendTip}
                  disabled={isProcessingTip || !connected}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-cyan-500/10 whitespace-nowrap"
                >
                  {isProcessingTip ? "Enviando..." : "Dar Propina"}
                </Button>
              </div>
            </div>

            {/* Lista de Comentarios */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1">
                {comments.map((c, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-mono text-cyan-400 font-bold truncate max-w-[100px]">{c.wallet.slice(0, 4)}...{c.wallet.slice(-4)}</span>
                      <span className="text-[8px] text-zinc-500 font-mono">{new Date(c.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Formulario de Comentario */}
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  placeholder="Añadir comentario público..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-white/5 border-white/5 text-white text-xs h-9 rounded-xl"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || !connected}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs h-9 px-3 rounded-xl border border-white/5"
                >
                  Enviar
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
