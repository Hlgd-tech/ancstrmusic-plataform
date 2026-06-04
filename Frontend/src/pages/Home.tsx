import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Music, 
  Upload, Disc, ArrowRight, ShieldCheck, 
  Coins, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Loader2,
  TrendingUp, History, Heart, Send, DollarSign, Share2, Award, User
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
      return `http://localhost:8000/ipfs/stream/${hash}`;
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
      const response = await fetch("http://localhost:8000/ipfs/upload", {
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
    <div className="min-h-screen bg-[#09090B] text-zinc-200 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-400">
      
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
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
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
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: Explorador y Acciones (8 Columnas) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <Tabs defaultValue="catalog" className="w-full">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-6">
              <TabsList className="bg-zinc-950 p-1 rounded-lg border border-zinc-900 flex h-auto">
                <TabsTrigger 
                  value="catalog" 
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all font-medium"
                >
                  Catálogo
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all font-medium flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Tendencias
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all font-medium flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" /> Mi Historial
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all font-medium"
                >
                  Publicar (Artista)
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: CATÁLOGO */}
            <TabsContent value="catalog" className="mt-0 outline-none">
              {/* Cuadro de Búsqueda Global */}
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Buscar canciones, artistas, géneros, álbumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-900 focus:border-orange-500/50 text-white placeholder-zinc-500 text-xs py-5 pl-10 pr-4 rounded-lg w-full transition-all duration-300"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
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
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {["Todos", "Ambient", "Synthwave", "House", "Techno", "Lo-Fi / Beats", "Pop", "Hip Hop", "Rock", "Acoustic / Indie"].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap ${
                      selectedGenre === genre
                        ? "bg-orange-500 border-orange-500 text-white font-bold shadow-lg shadow-orange-500/10"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

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
                  const isPurchased = purchasedTracks.includes(track.track_id);
                  const isCurrent = currentTrack.track_id === track.track_id;
                  
                  return (
                    <Card 
                      key={track.track_id} 
                      className={`bg-zinc-950/40 border transition-all duration-300 hover:border-zinc-800 group ${
                        isCurrent ? "border-orange-500/50 bg-zinc-950/80 shadow-lg shadow-orange-500/5" : "border-zinc-900"
                      }`}
                    >
                      <CardContent className="p-4 flex gap-4 items-center relative">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={track.ipfs_cover_hash} 
                            alt={track.title} 
                            className="w-full h-full object-cover"
                          />
                          <button 
                            onClick={() => {
                              setCurrentTrack(track);
                              setIsPlaying(isCurrent ? !isPlaying : true);
                            }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="w-6 h-6 text-orange-500 fill-orange-500" />
                            ) : (
                              <Play className="w-6 h-6 text-white fill-white" />
                            )}
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                            {isPurchased && (
                              <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-mono uppercase">Adquirida</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 truncate">{track.artist_name}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded font-mono">{track.genre}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{formatTime(track.duration)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-[11px] font-mono font-bold text-amber-500">{track.price_sol} SOL</p>
                            <p className="text-[9px] font-mono text-zinc-500">${track.price_usdc} USDC</p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleLike(track.track_id)}
                              className={`p-1.5 rounded-md transition-colors ${likedTracks.includes(track.track_id) ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${likedTracks.includes(track.track_id) ? 'fill-red-500' : ''}`} />
                            </button>
                            
                            {isPurchased ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setCurrentTrack(track);
                                  setIsPlaying(isCurrent ? !isPlaying : true);
                                }}
                                className="h-7 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800"
                              >
                                ESCUCHAR
                              </Button>
                            ) : (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => handlePurchase(track, "SOL")}
                                  className="h-7 text-[9px] bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                >
                                  SOL
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handlePurchase(track, "USDC")}
                                  className="h-7 text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800"
                                >
                                  USDC
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB: TENDENCIAS */}
            <TabsContent value="trending" className="mt-0 outline-none">
              <div className="flex flex-col gap-3">
                {trendingTracks.map((track, index) => {
                  const isPurchased = purchasedTracks.includes(track.track_id);
                  const isCurrent = currentTrack.track_id === track.track_id;
                  
                  return (
                    <div 
                      key={track.track_id}
                      className={`flex items-center gap-4 bg-zinc-950/30 border border-zinc-900 p-3 rounded-lg hover:border-zinc-800 transition-all ${
                        isCurrent ? "border-orange-500/30 bg-zinc-950/60" : ""
                      }`}
                    >
                      <div className="font-mono text-sm font-bold text-zinc-600 w-6 text-center">
                        {index + 1}
                      </div>
                      
                      <img src={track.ipfs_cover_hash} alt={track.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{track.artist_name}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] text-zinc-500 font-mono">Licencias Adquiridas</p>
                          <p className="text-xs font-mono font-bold text-orange-400 flex items-center justify-end gap-1">
                            <Award className="w-3.5 h-3.5" /> {track.sales_count}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {isPurchased ? (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setCurrentTrack(track);
                                setIsPlaying(isCurrent ? !isPlaying : true);
                              }}
                              className="h-8 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800"
                            >
                              ESCUCHAR
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handlePurchase(track, "SOL")}
                              className="h-8 text-[10px] bg-orange-500 hover:bg-orange-600 text-white font-bold"
                            >
                              ADQUIRIR
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB: HISTORIAL */}
            <TabsContent value="history" className="mt-0 outline-none">
              {userHistory.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-900 rounded-lg">
                  <History className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500 font-mono">No has adquirido licencias digitales aún.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {userHistory.map((record, index) => (
                    <div 
                      key={record.track_id + index}
                      className="flex items-center gap-4 bg-zinc-950/30 border border-zinc-900 p-3 rounded-lg"
                    >
                      <img src={record.ipfs_cover_hash} alt={record.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{record.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{record.artist_name}</p>
                        <p className="text-[9px] text-zinc-500 font-mono mt-1">
                          Adquirido: {new Date(record.timestamp).toLocaleDateString()}
                        </p>
                        {record.cnft_address && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <p className="text-[8px] font-mono text-orange-400/80 truncate" title={record.cnft_address}>
                              cNFT: {record.cnft_address}
                            </p>
                            {record.merkle_tree && (
                              <p className="text-[7px] font-mono text-zinc-600 truncate" title={record.merkle_tree}>
                                Árbol Merkle: {record.merkle_tree}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-mono">Precio Pagado</p>
                        <p className="text-xs font-mono font-bold text-green-500">
                          {record.amount_paid} {record.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: PUBLICAR (ARTISTA) */}
            <TabsContent value="upload" className="mt-0 outline-none">
              <Card className="bg-zinc-950 border-zinc-900">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
                    <Upload className="w-4 h-4 text-orange-500" /> Publicar Nueva Licencia Digital
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Acuña tu música de forma descentralizada. Los archivos se alojan en IPFS y la venta distribuye automáticamente los fondos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUploadTrack} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Título de la Canción *</label>
                        <Input 
                          placeholder="Ej. Decentralized Dreams" 
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Nombre del Artista *</label>
                        <Input 
                          placeholder="Ej. Satoshi Sound" 
                          value={newArtist}
                          onChange={(e) => setNewArtist(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Género *</label>
                        <select 
                          value={newGenre}
                          onChange={(e) => setNewGenre(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg h-9 px-3 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Selecciona un género</option>
                          {SPOTIFY_GENRES.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Precio en SOL *</label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.1" 
                          value={newPriceSol}
                          onChange={(e) => setNewPriceSol(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Precio en USDC *</label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="3.0" 
                          value={newPriceUsdc}
                          onChange={(e) => setNewPriceUsdc(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Precios adicionales (USDT, ETH, BTC) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-900 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Precio en USDT *</label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="3.0" 
                          value={newPriceUsdt}
                          onChange={(e) => setNewPriceUsdt(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Precio en ETH *</label>
                        <Input 
                          type="number" 
                          step="0.0001" 
                          placeholder="0.001" 
                          value={newPriceEth}
                          onChange={(e) => setNewPriceEth(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Precio en BTC *</label>
                        <Input 
                          type="number" 
                          step="0.00001" 
                          placeholder="0.00005" 
                          value={newPriceBtc}
                          onChange={(e) => setNewPriceBtc(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 text-xs focus-visible:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* SUBIDA DE AUDIO REAL A IPFS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`border border-dashed rounded-lg p-4 text-center bg-zinc-950/40 flex flex-col justify-center items-center transition-all ${isUploadingAudio ? 'border-orange-500/50 shadow-lg shadow-orange-500/5' : 'border-zinc-800'}`}>
                        {isUploadingAudio ? (
                          <div className="flex flex-col items-center justify-center py-2">
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
                            <p className="text-[10px] font-mono text-orange-400 animate-pulse">Subiendo audio...</p>
                            <div className="w-24 bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                              <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full w-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Music className="w-6 h-6 text-zinc-600 mb-2" />
                            <p className="text-[11px] text-zinc-400 font-medium">Subir Audio WAV/MP3 *</p>
                            <Input 
                              type="file" 
                              accept="audio/*" 
                              disabled={isUploadingAudio}
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "audio");
                              }}
                              className="mt-2 bg-zinc-900 border-zinc-800 text-zinc-300 text-[10px] h-8 file:text-xs file:bg-zinc-800 file:text-zinc-200"
                            />
                            {uploadedAudioHash && (
                              <p className="text-[9px] text-green-500 font-mono mt-2 truncate max-w-full">Listo en IPFS: {uploadedAudioHash.slice(0, 15)}...</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* SUBIDA DE PORTADA REAL A IPFS */}
                      <div className={`border border-dashed rounded-lg p-4 text-center bg-zinc-950/40 flex flex-col justify-center items-center transition-all ${isUploadingCover ? 'border-orange-500/50 shadow-lg shadow-orange-500/5' : 'border-zinc-800'}`}>
                        {isUploadingCover ? (
                          <div className="flex flex-col items-center justify-center py-2">
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
                            <p className="text-[10px] font-mono text-orange-400 animate-pulse">Subiendo portada...</p>
                            <div className="w-24 bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                              <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full w-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Disc className="w-6 h-6 text-zinc-600 mb-2" />
                            <p className="text-[11px] text-zinc-400 font-medium">Subir Portada del Álbum *</p>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              disabled={isUploadingCover}
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "cover");
                              }}
                              className="mt-2 bg-zinc-900 border-zinc-800 text-zinc-300 text-[10px] h-8 file:text-xs file:bg-zinc-800 file:text-zinc-200"
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
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 tracking-wider shadow-lg shadow-orange-500/10"
                    >
                      PUBLICAR LICENCIA DIGITAL EN BLOCKCHAIN
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* --- PANEL DE MODELO DE NEGOCIO (DESGLOSE 85/15) --- */}
          <Card className="bg-zinc-950 border-zinc-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2 tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                Desglose Transaccional (Split Directo 85/15)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Cada adquisición de licencia digital o propina realiza una **distribución atómica de fondos** programada de forma inmutable. El **85%** va de forma instantánea a la clave pública del artista, mientras que el **15%** va a la tesorería de soporte de la plataforma.
              </p>
              
              {/* Visualizador interactivo de Split */}
              <div className="bg-black/50 border border-zinc-900 rounded-lg p-4 font-mono text-[11px] space-y-3 relative">
                <div className="flex justify-between items-center text-zinc-500 border-b border-zinc-900 pb-2">
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
                    <span className="w-2 h-2 rounded-full bg-zinc-700" /> Plataforma (Mantenimiento de Red)
                  </span>
                  <span className="text-zinc-500">15%</span>
                </div>

                {isProcessingTx && txSplitDetails && (
                  <div className="absolute inset-0 bg-black/90 rounded-lg flex flex-col justify-center items-center p-4 border border-orange-500/20">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin mb-2" />
                    <p className="text-[10px] text-orange-400 animate-pulse text-center uppercase tracking-wider font-bold">Procesando Split Atómico...</p>
                    <p className="text-[9px] text-zinc-500 mt-1">
                      Artista: {txSplitDetails.artistShare} {txSplitDetails.currency} | Plataforma: {txSplitDetails.platformShare} {txSplitDetails.currency}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Reproductor Analógico y Módulo Social (4 Columnas) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* REPRODUCTOR ANALÓGICO CON NEÓN PULSANTE AL RITMO DE LOS BAJOS */}
          <Card 
            className="bg-zinc-950 border-zinc-900 overflow-hidden relative sticky top-24 transition-all duration-100"
            style={{
              boxShadow: isPlaying 
                ? `0 0 ${bassIntensity * 25}px rgba(249, 115, 22, ${bassIntensity * 0.45})` 
                : 'none',
              borderColor: isPlaying 
                ? `rgba(249, 115, 22, ${0.1 + bassIntensity * 0.5})` 
                : 'rgb(24, 24, 27)'
            }}
          >
            <CardHeader className="border-b border-zinc-900 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Reproductor Analógico</CardTitle>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest">LOSSLESS STREAM</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 flex flex-col items-center">
              {/* Arte de Portada */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl mb-6 group flex items-center justify-center">
                {/* Si la portada es la por defecto (cubo 3D), le aplicamos la animación 3D flotante */}
                <img 
                  src={currentTrack.ipfs_cover_hash} 
                  alt={currentTrack.title} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    currentTrack.ipfs_cover_hash.includes("album_history") || currentTrack.ipfs_cover_hash.includes("QmSimulated")
                      ? isPlaying ? "animate-cube-3d scale-90" : "scale-90"
                      : isPlaying ? "animate-spin-vinyl rounded-full max-w-[85%] max-h-[85%] border-4 border-zinc-800" : "scale-100"
                  }`}
                  style={{
                    animationDuration: isPlaying 
                      ? currentTrack.ipfs_cover_hash.includes("album_history") || currentTrack.ipfs_cover_hash.includes("QmSimulated")
                        ? `${15 / playbackRate}s` // El cubo rota más rápido con mayor pitch
                        : `${4 / playbackRate}s`  // El vinilo gira más rápido con mayor pitch
                      : '0s'
                  }}
                />
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
                  className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration || currentTrack.duration)}</span>
                </div>
              </div>

              {/* Controles de Reproducción */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <button 
                  onClick={handlePrev}
                  className="p-2 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                
                <button 
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white translate-x-0.5" />
                  )}
                </button>
                
                <button 
                  onClick={handleNext}
                  className="p-2 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Control de Volumen */}
              <div className="w-full flex items-center gap-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 mb-3">
                <Volume2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <Slider 
                  value={[volume]} 
                  max={100} 
                  onValueChange={(value) => setVolume(value[0])}
                  className="w-full [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
                />
              </div>

              {/* Control de Pitch / BPM (Velocidad de Reproducción y Rotación) */}
              <div className="w-full flex flex-col gap-1.5 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 mb-6">
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Pitch / Tempo</span>
                  <span className="text-orange-400 font-bold">{playbackRate.toFixed(2)}x ({Math.round(playbackRate * 100 - 100) >= 0 ? "+" : ""}{Math.round(playbackRate * 100 - 100)}%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-zinc-600">0.5x</span>
                  <Slider 
                    value={[playbackRate]} 
                    min={0.5}
                    max={2.0} 
                    step={0.05}
                    onValueChange={(value) => setPlaybackRate(value[0])}
                    className="w-full [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-orange-500"
                  />
                  <span className="text-[9px] font-mono text-zinc-600">2.0x</span>
                </div>
              </div>

              {/* CID de IPFS */}
              <div className="w-full text-center bg-zinc-950 p-2 rounded border border-zinc-900">
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">IPFS CID DE LA PISTA</p>
                <p className="text-[9px] font-mono text-orange-400/80 truncate mt-0.5" title={currentTrack.ipfs_audio_hash}>
                  {currentTrack.ipfs_audio_hash}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* MÓDULO SOCIAL DE ARTISTA & PROPINAS */}
          <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" /> Perfil de Artista & Soporte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentTrack.artist_name}</h4>
                  <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[180px]" title={currentTrack.artist_wallet}>
                    {currentTrack.artist_wallet}
                  </p>
                </div>
              </div>

              {/* Botón de Propina */}
              <div className="bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-900 space-y-3">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Apoyar al Artista (Tipping)
                </p>
                
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-8 text-xs focus-visible:ring-orange-500 flex-1"
                    placeholder="Monto"
                  />
                  
                  <select 
                    value={tipCurrency}
                    onChange={(e) => setTipCurrency(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg h-8 px-2 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                  </select>

                  <Button 
                    size="sm"
                    disabled={isProcessingTip}
                    onClick={handleSendTip}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 text-[10px]"
                  >
                    {isProcessingTip ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                
                <p className="text-[9px] text-zinc-500 leading-tight">
                  Las propinas aplican el split directo del 85% directo al artista y 15% de soporte técnico de la red.
                </p>
              </div>

              {/* Muro de Comentarios Descentralizados */}
              <div className="border-t border-zinc-900 pt-4 space-y-3">
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Muro de Mensajes Descentralizado
                </p>

                {/* Formulario de comentario */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      type="text" 
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="bg-zinc-950 border-zinc-900 text-zinc-200 h-7 text-[10px] focus-visible:ring-orange-500 w-1/3"
                      placeholder="Tu Alias"
                    />
                    <Input 
                      type="text" 
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="bg-zinc-950 border-zinc-900 text-zinc-200 h-7 text-[10px] focus-visible:ring-orange-500 flex-1"
                      placeholder="Escribe un mensaje de apoyo..."
                    />
                    <Button 
                      size="sm"
                      disabled={isSubmittingComment || !newCommentText.trim() || !authorName.trim()}
                      onClick={async () => {
                        if (!connected || !publicKey) {
                          toast.error("Wallet no conectada", {
                            description: "Por favor conecta tu wallet para dejar un mensaje en el muro."
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
                            author_name: authorName,
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
                      className="bg-zinc-900 hover:bg-zinc-800 text-orange-400 border border-zinc-800 font-bold h-7 text-[9px] px-2.5"
                    >
                      {isSubmittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enviar"}
                    </Button>
                  </div>
                </div>

                {/* Lista de comentarios */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-900">
                  {comments
                    .filter(c => c.artist_wallet.toLowerCase() === currentTrack.artist_wallet.toLowerCase())
                    .map((comment) => (
                      <div key={comment.comment_id} className="bg-zinc-950/50 p-2 rounded border border-zinc-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-zinc-300">{comment.author_name}</span>
                            <span className="text-[8px] font-mono text-zinc-600 truncate max-w-[60px]" title={comment.author_wallet}>
                              ({comment.author_wallet})
                            </span>
                          </div>
                          {comment.has_license && (
                            <span className="text-[7px] font-mono uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <ShieldCheck className="w-2 h-2" /> Licencia
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-snug">{comment.text}</p>
                        <p className="text-[7px] font-mono text-zinc-600 text-right">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  {comments.filter(c => c.artist_wallet.toLowerCase() === currentTrack.artist_wallet.toLowerCase()).length === 0 && (
                    <p className="text-[9px] font-mono text-zinc-600 text-center py-4">No hay mensajes en este muro aún.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
