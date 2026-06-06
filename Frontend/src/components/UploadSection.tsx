import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music, Image, ShieldCheck, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Lista de géneros predefinida para consistencia
const GENRES = ['Ambient', 'Synthwave', 'Techno', 'Electronic', 'DnB', 'House', 'Cyberpunk', 'Lo-Fi'];

interface UploadSectionProps {
  walletConnected: boolean;
  onUploadSuccess?: (track: any) => void;
}

export default function UploadSection({ walletConnected, onUploadSuccess }: UploadSectionProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [priceSol, setPriceSol] = useState('0.1');
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'ipfs-audio' | 'ipfs-cover' | 'solana-tx' | 'success'>('idle');
  const [ipfsAudioHash, setIpfsAudioHash] = useState('');
  const [ipfsCoverHash, setIpfsCoverHash] = useState('');

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        toast.error('El archivo de audio supera el límite de 15MB.');
        return;
      }
      setAudioFile(file);
      toast.success(`Audio cargado: ${file.name}`);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen de portada supera el límite de 5MB.');
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success(`Portada cargada: ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      toast.error('Por favor, conecta tu wallet de Solana para registrar la licencia.');
      return;
    }
    if (!title || !artist || !genre || !audioFile || !coverFile) {
      toast.error('Por favor, completa todos los campos y sube ambos archivos.');
      return;
    }

    setIsUploading(true);
    try {
      // Paso 1: Subir audio a IPFS (Simulado)
      setUploadStep('ipfs-audio');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockAudioHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo' + Math.random().toString(36).substring(2, 8);
      setIpfsAudioHash(mockAudioHash);
      toast.success('Audio subido con éxito a IPFS.');

      // Paso 2: Subir portada a IPFS (Simulado)
      setUploadStep('ipfs-cover');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockCoverHash = coverPreview || 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg';
      setIpfsCoverHash(mockCoverHash);
      toast.success('Portada subida con éxito a IPFS.');

      // Paso 3: Registrar transacción de licencia en Solana (Simulado)
      setUploadStep('solana-tx');
      await new Promise((resolve) => setTimeout(resolve, 2500));
      toast.success('¡Licencia registrada de forma inmutable en Solana!');

      setUploadStep('success');
      // Crear una URL de objeto local para que el archivo de audio real subido suene de verdad
      const realAudioUrl = URL.createObjectURL(audioFile);

      const newTrack = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        artist,
        artistHandle: `@${artist.toLowerCase().replace(/\s+/g, '')}.sol`,
        cover: mockCoverHash,
        duration: 240, // Mock duration
        plays: '0',
        priceUSDC: parseFloat(priceSol) * 140, // Conversión mock SOL -> USDC
        genre,
        quality: 'LOSSLESS',
        kbps: 320,
        ipfs_audio_hash: realAudioUrl, // Usar la URL de objeto local real
      };

      if (onUploadSuccess) {
        onUploadSuccess(newTrack);
      }

      // Reset form
      setTimeout(() => {
        setTitle('');
        setArtist('');
        setGenre('');
        setAudioFile(null);
        setCoverFile(null);
        setCoverPreview(null);
        setUploadStep('idle');
        setIsUploading(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error durante el proceso de registro.');
      setUploadStep('idle');
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#030508] p-6 lg:p-10 select-none">
      {/* Encabezado Holográfico */}
      <div className="mb-8 relative">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-magma-500 glow-magma-sm" />
        <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-[0.18em] text-white/90 font-sans">
          CREATOR STUDIO
        </h1>
        <p className="text-[10px] lg:text-xs font-mono tracking-wider text-white/30 mt-1 uppercase">
          Registra y acuña tu licencia musical de forma inmutable en Solana con almacenamiento IPFS.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Formulario Principal (Neumórfico Oscuro) */}
        <div className="xl:col-span-7 bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-6 lg:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
          {/* Luz de ambiente de fondo */}
          <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-magma-500/5 blur-[80px]" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Título y Artista */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Título de la Canción *
                </label>
                <input
                  type="text"
                  required
                  disabled={isUploading}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Echoes of the Void"
                  className="w-full h-11 bg-[#030508]/60 border border-white/[0.06] rounded-xl px-4 text-xs font-mono text-white/90 placeholder-white/20 focus:outline-none focus:border-magma-500/40 focus:shadow-[0_0_15px_rgba(255,85,0,0.15)] transition-all duration-300"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Nombre del Artista *
                </label>
                <input
                  type="text"
                  required
                  disabled={isUploading}
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ej. SYNTHRIX"
                  className="w-full h-11 bg-[#030508]/60 border border-white/[0.06] rounded-xl px-4 text-xs font-mono text-white/90 placeholder-white/20 focus:outline-none focus:border-magma-500/40 focus:shadow-[0_0_15px_rgba(255,85,0,0.15)] transition-all duration-300"
                />
              </div>
            </div>

            {/* Género y Precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Género Musical *
                </label>
                <select
                  required
                  disabled={isUploading}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full h-11 bg-[#030508]/60 border border-white/[0.06] rounded-xl px-4 text-xs font-mono text-white/90 focus:outline-none focus:border-magma-500/40 focus:shadow-[0_0_15px_rgba(255,85,0,0.15)] transition-all duration-300"
                >
                  <option value="" disabled className="bg-[#030508]">Selecciona un género</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g} className="bg-[#0a0f16]">{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Precio de Licencia (SOL) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  disabled={isUploading}
                  value={priceSol}
                  onChange={(e) => setPriceSol(e.target.value)}
                  className="w-full h-11 bg-[#030508]/60 border border-white/[0.06] rounded-xl px-4 text-xs font-mono text-white/90 focus:outline-none focus:border-magma-500/40 focus:shadow-[0_0_15px_rgba(255,85,0,0.15)] transition-all duration-300"
                />
              </div>
            </div>

            {/* Carga de Archivos IPFS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Carga de Audio */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Archivo de Audio (Max 15MB) *
                </label>
                <div className="relative h-28 bg-[#030508]/40 border border-dashed border-white/[0.08] hover:border-magma-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 group">
                  <input
                    type="file"
                    accept="audio/*"
                    disabled={isUploading}
                    onChange={handleAudioChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Music className="w-5 h-5 text-white/20 group-hover:text-magma-400 transition-colors duration-300 mb-2" />
                  <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors duration-300 text-center px-4 truncate max-w-full">
                    {audioFile ? audioFile.name : 'Arrastra o selecciona tu archivo'}
                  </span>
                  <span className="text-[8px] font-mono text-white/20 mt-1">MP3, WAV, FLAC</span>
                </div>
              </div>

              {/* Carga de Portada */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Portada del Álbum (Max 5MB) *
                </label>
                <div className="relative h-28 bg-[#030508]/40 border border-dashed border-white/[0.08] hover:border-magma-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 group">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleCoverChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Image className="w-5 h-5 text-white/20 group-hover:text-magma-400 transition-colors duration-300 mb-2" />
                  <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors duration-300 text-center px-4 truncate max-w-full">
                    {coverFile ? coverFile.name : 'Arrastra o selecciona la portada'}
                  </span>
                  <span className="text-[8px] font-mono text-white/20 mt-1">PNG, JPG, WEBP</span>
                </div>
              </div>
            </div>

            {/* Advertencia de Conexión de Wallet */}
            {!walletConnected && (
              <div className="flex items-center gap-3 p-3.5 bg-magma-500/5 border border-magma-500/15 rounded-xl">
                <AlertCircle className="w-4 h-4 text-magma-400 shrink-0" />
                <p className="text-[10px] font-mono text-magma-300/80 leading-relaxed uppercase">
                  Wallet desconectada. Debes conectar tu wallet para firmar el registro de la licencia en la red de Solana.
                </p>
              </div>
            )}

            {/* Botón de Envío Neumórfico Emisivo */}
            <button
              type="submit"
              disabled={isUploading || !walletConnected}
              className="w-full h-12 bg-gradient-to-r from-magma-600 to-magma-500 hover:from-magma-500 hover:to-magma-400 text-black font-extrabold font-mono text-xs tracking-[0.2em] uppercase rounded-xl border border-magma-500/30 shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:shadow-[0_0_30px_rgba(255,85,0,0.5)] active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:pointer-events-none"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PROCESANDO REGISTRO...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  FIRMAR Y REGISTRAR LICENCIA
                </>
              )}
            </button>
          </form>
        </div>

        {/* Panel de Vista Previa Holográfica (Neumórfico con Efecto Scanlines) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-cyan-500/5 blur-[80px]" />
            
            <div>
              <p className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 uppercase mb-4">
                Vista Previa de Proyección
              </p>

              {/* Portada Holográfica con Efecto Scanlines y Luz Cónica */}
              <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-xl overflow-hidden border-2 border-magma-500/30 shadow-[0_0_25px_rgba(255,85,0,0.25)] group">
                {coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="w-full h-full object-cover opacity-80 contrast-[1.2] saturate-50 mix-blend-screen"
                    />
                    {/* Haz de Proyección Cónica */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-magma-500/20 to-transparent pointer-events-none opacity-60 transition-opacity duration-500" style={{ clipPath: 'polygon(15% 100%, 85% 100%, 50% 0%)' }} />
                    {/* Líneas de Holograma (Scanlines) */}
                    <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(255,85,0,0.12)_3px,rgba(255,85,0,0.12)_4px)] animate-scanlines" />
                    {/* Tinte Emisivo */}
                    <div className="absolute inset-0 mix-blend-color pointer-events-none bg-magma-500/20" />
                  </>
                ) : (
                  <div className="w-full h-full bg-[#030508]/60 flex flex-col items-center justify-center text-white/10 gap-3 border border-white/5">
                    <Music className="w-10 h-10 stroke-[1]" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Esperando Portada</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles Dinámicos */}
            <div className="mt-6 pt-6 border-t border-white/[0.04] space-y-3 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-white/20 uppercase">Canción:</span>
                <span className="text-white/80 font-bold truncate max-w-[180px]">{title || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/20 uppercase">Artista:</span>
                <span className="text-magma-400 font-bold truncate max-w-[180px]">{artist ? `@${artist.toLowerCase().replace(/\s+/g, '')}.sol` : '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/20 uppercase">Género:</span>
                <span className="text-cyan-400 font-bold">{genre || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/20 uppercase">Licencia:</span>
                <span className="text-green-400 font-bold">{priceSol} SOL</span>
              </div>
            </div>
          </div>

          {/* Estado del Proceso de Carga IPFS/Solana (Feedback de Alta Fidelidad) */}
          <AnimatePresence mode="wait">
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-8 h-8 rounded-lg bg-magma-500/10 border border-magma-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-magma-400 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0 font-mono">
                    <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
                      {uploadStep === 'ipfs-audio' && 'Sincronizando Audio con IPFS...'}
                      {uploadStep === 'ipfs-cover' && 'Sincronizando Portada con IPFS...'}
                      {uploadStep === 'solana-tx' && 'Firmando Transacción en Solana...'}
                      {uploadStep === 'success' && '¡Proceso Completado con Éxito!'}
                    </p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 truncate">
                      {uploadStep === 'ipfs-audio' && 'Subiendo paquete de datos cifrado...'}
                      {uploadStep === 'ipfs-cover' && 'Acuñando metadatos visuales...'}
                      {uploadStep === 'solana-tx' && 'Inscribiendo hash inmutable en la blockchain...'}
                      {uploadStep === 'success' && 'Tu licencia ya está en vivo en la red.'}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso animada */}
                <div className="mt-4 h-1 bg-[#030508] rounded-full overflow-hidden relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-magma-600 to-magma-400"
                    initial={{ width: '0%' }}
                    animate={{
                      width: 
                        uploadStep === 'ipfs-audio' ? '30%' :
                        uploadStep === 'ipfs-cover' ? '60%' :
                        uploadStep === 'solana-tx' ? '90%' : '100%'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
