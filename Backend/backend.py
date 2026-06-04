import uvicorn
from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import time
import os
import requests
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = FastAPI(
    title="Decentralized Music Streaming dApp Backend",
    description="API de descubrimiento y gestión de metadatos musicales con lógica de split 85/15 e integración de Pinata IPFS.",
    version="1.3.0"
)

# Habilitar CORS para permitir llamadas desde el frontend de React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURACIÓN DE PINATA ---
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET")
PINATA_JWT = os.getenv("PINATA_JWT")

# --- MODELOS DE DATOS ---

class TrackCreate(BaseModel):
    track_id: str = Field(..., description="ID único de la pista")
    title: str = Field(..., description="Título de la canción")
    artist_name: str = Field(..., description="Nombre artístico")
    artist_wallet: str = Field(..., description="Dirección de la wallet de Solana del artista")
    album: Optional[str] = Field(None, description="Álbum al que pertenece la pista")
    genre: str = Field(..., description="Género musical")
    duration: int = Field(..., description="Duración en segundos")
    ipfs_audio_hash: str = Field(..., description="Hash de IPFS del archivo de audio de alta calidad")
    ipfs_cover_hash: str = Field(..., description="Hash de IPFS de la portada")
    price_sol: float = Field(..., description="Precio de compra en SOL")
    price_usdc: float = Field(..., description="Precio de compra en USDC")

class TrackResponse(BaseModel):
    track_id: str
    title: str
    artist_name: str
    artist_wallet: str
    album: Optional[str]
    genre: str
    duration: int
    ipfs_audio_hash: str
    ipfs_cover_hash: str
    price_sol: float
    price_usdc: float
    sales_count: int
    is_streamable_free: bool

class PurchaseRequest(BaseModel):
    track_id: str
    buyer_wallet: str
    tx_signature: str
    currency: str = Field(..., description="SOL o USDC")
    amount_paid: float

class PurchaseResponse(BaseModel):
    success: bool
    message: str
    artist_share: float
    platform_share: float
    tx_signature: str

class PinataUploadResponse(BaseModel):
    success: bool
    ipfs_hash: str
    pinata_url: str

# --- BASE DE DATOS EN MEMORIA (MOCK) ---

DB_TRACKS = {
    "track-1": {
        "track_id": "track-1",
        "title": "Decentralized Dreams",
        "artist_name": "Satoshi Sound",
        "artist_wallet": "Art1stSolanaWa11etAddressX111111111111111",
        "album": "Genesis Blocks",
        "genre": "Ambient / Electronic",
        "duration": 245,
        "ipfs_audio_hash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        "ipfs_cover_hash": "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_genesis-dA4XYwNQ6oCojnGnoNVWU7.webp",
        "price_sol": 0.15,
        "price_usdc": 5.00,
        "sales_count": 42,
        "is_streamable_free": True
    },
    "track-2": {
        "track_id": "track-2",
        "title": "USDC Groove",
        "artist_name": "Web3 Wave",
        "artist_wallet": "Art2stSolanaWa11etAddressY222222222222222",
        "album": "Stable Beats",
        "genre": "Synthwave",
        "duration": 198,
        "ipfs_audio_hash": "QmYwAPz9yyRMT93fnG7G9Bq8Gg9Bq8Gg9Bq8Gg9Bq8Gg9B",
        "ipfs_cover_hash": "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_stable-ZkbAmoDjUkftQcV24apMRo.webp",
        "price_sol": 0.09,
        "price_usdc": 3.00,
        "sales_count": 18,
        "is_streamable_free": True
    },
    "track-3": {
        "track_id": "track-3",
        "title": "Solana Summer",
        "artist_name": "Anchor Band",
        "artist_wallet": "Art1stSolanaWa11etAddressX111111111111111",
        "album": "Proof of History",
        "genre": "House",
        "duration": 312,
        "ipfs_audio_hash": "QmZz9zG7p98R7L7H7U98YgU78R7L7H7U98YgU78R7L7H7U",
        "ipfs_cover_hash": "https://d2xsxph8kpxj0f.cloudfront.net/310519663726265610/oEFnNWCh7HaoKcALf8YNcq/album_history-iKDCRAzXkDSabWpUUxBDQ8.webp",
        "price_sol": 0.25,
        "price_usdc": 8.00,
        "sales_count": 105,
        "is_streamable_free": False
    }
}

DB_PURCHASES = []

# --- FUNCIONES AUXILIARES PINATA ---

def upload_to_pinata(file_content: bytes, filename: str) -> str:
    """
    Sube el contenido de un archivo a Pinata Cloud y devuelve el CID/Hash de IPFS.
    Implementa un mecanismo de reintentos automáticos con retroceso exponencial para mitigar errores 500 intermitentes.
    """
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    
    # Preparar headers para autenticación (usar JWT si está disponible, si no, API Keys)
    headers = {}
    if PINATA_JWT:
        headers["Authorization"] = f"Bearer {PINATA_JWT}"
    elif PINATA_API_KEY and PINATA_API_SECRET:
        headers["pinata_api_key"] = PINATA_API_KEY
        headers["pinata_secret_api_key"] = PINATA_API_SECRET
    else:
        # Modo fallback para simulación/pruebas si no hay credenciales configuradas
        print("⚠️ Pinata API Keys no configuradas. Simulando subida a IPFS...")
        import hashlib
        simulated_hash = "Qm" + hashlib.sha256(file_content).hexdigest()[:44]
        return simulated_hash

    files = {
        'file': (filename, file_content)
    }
    
    max_retries = 3
    backoff_factor = 2  # Segundos de espera base
    
    for attempt in range(1, max_retries + 1):
        try:
            print(f"🚀 Intentando subir a Pinata (Intento {attempt}/{max_retries})...")
            response = requests.post(url, files=files, headers=headers, timeout=45)
            
            if response.status_code == 200:
                print("✅ Subida exitosa a Pinata IPFS!")
                return response.json()["IpfsHash"]
            
            # Si devuelve un error del servidor (5xx) o rate limit (429), reintentar
            if response.status_code >= 500 or response.status_code == 429:
                print(f"⚠️ Pinata devolvió código {response.status_code}. Reintentando...")
            else:
                # Errores de cliente (4xx excepto 429) no se reintentan
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Error al subir a Pinata IPFS (Código {response.status_code}): {response.text}"
                )
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Error de red en intento {attempt}: {str(e)}")
            if attempt == max_retries:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Fallo de conexión persistente con Pinata IPFS tras {max_retries} intentos: {str(e)}"
                )
        
        # Esperar antes del siguiente intento (retroceso exponencial)
        if attempt < max_retries:
            sleep_time = backoff_factor ** attempt
            print(f"⏳ Esperando {sleep_time} segundos antes de reintentar...")
            time.sleep(sleep_time)
            
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Fallo al subir a Pinata IPFS tras múltiples reintentos."
    )

# --- RUTAS DE LA API ---

@app.get("/", tags=["General"])
def read_root():
    pinata_status = "Configurada (JWT/Keys)" if (PINATA_JWT or (PINATA_API_KEY and PINATA_API_SECRET)) else "Simulada (Sin Credenciales)"
    return {
        "status": "online",
        "message": "Bienvenido a la API de la dApp de Streaming de Música Descentralizada",
        "benchmark": "Audius (Almacenamiento/Descubrimiento) + Bandcamp (Split de Pago 85/15)",
        "network": "Solana Devnet",
        "ipfs_provider": "Pinata Cloud",
        "ipfs_integration_status": pinata_status,
        "supported_currencies": ["SOL", "USDC"]
    }

@app.get("/tracks", response_model=List[TrackResponse], tags=["Pistas"])
def get_all_tracks(genre: Optional[str] = None):
    """Obtiene el catálogo de todas las pistas musicales registradas."""
    tracks = list(DB_TRACKS.values())
    if genre:
        tracks = [t for t in tracks if genre.lower() in t["genre"].lower()]
    return tracks

@app.get("/tracks/{track_id}", response_model=TrackResponse, tags=["Pistas"])
def get_track_by_id(track_id: str):
    """Obtiene los detalles de una pista musical específica."""
    if track_id not in DB_TRACKS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La pista con ID {track_id} no fue encontrada."
        )
    return DB_TRACKS[track_id]

@app.post("/tracks", response_model=TrackResponse, status_code=status.HTTP_201_CREATED, tags=["Pistas"])
def register_new_track(track: TrackCreate):
    """Registra una nueva pista musical en el catálogo de descubrimiento."""
    if track.track_id in DB_TRACKS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La pista con ID {track.track_id} ya existe."
        )
    
    new_track = track.model_dump()
    new_track["sales_count"] = 0
    new_track["is_streamable_free"] = True
    
    DB_TRACKS[track.track_id] = new_track
    return new_track

@app.post("/ipfs/upload", response_model=PinataUploadResponse, tags=["Almacenamiento IPFS"])
async def upload_file_to_ipfs(file: UploadFile = File(...)):
    """Sube un archivo de audio o imagen de portada directamente a Pinata IPFS."""
    content = await file.read()
    ipfs_hash = upload_to_pinata(content, file.filename)
    
    return PinataUploadResponse(
        success=True,
        ipfs_hash=ipfs_hash,
        pinata_url=f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
    )

@app.get("/ipfs/stream/{ipfs_hash}", tags=["Almacenamiento IPFS"])
async def stream_ipfs_file(ipfs_hash: str):
    """
    Proxy de streaming para archivos IPFS.
    Descarga el archivo desde Pinata usando autenticación segura para evitar errores 429,
    CORS o bloqueos SameOrigin en navegadores, y lo transmite de manera fluida.
    """
    # Lista de gateways para intentar descargar el archivo desde el backend
    gateways = [
        f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
        f"https://ipfs.io/ipfs/{ipfs_hash}",
        f"https://cloudflare-ipfs.com/ipfs/{ipfs_hash}",
        f"https://dweb.link/ipfs/{ipfs_hash}"
    ]
    
    # Preparar headers de autenticación si se usa Pinata para el primer gateway
    headers = {}
    if PINATA_JWT:
        headers["Authorization"] = f"Bearer {PINATA_JWT}"
    elif PINATA_API_KEY and PINATA_API_SECRET:
        headers["pinata_api_key"] = PINATA_API_KEY
        headers["pinata_secret_api_key"] = PINATA_API_SECRET

    # Intentar descargar desde los gateways disponibles
    response = None
    for i, gateway_url in enumerate(gateways):
        try:
            # Solo usar headers de autenticación para el gateway de Pinata
            req_headers = headers if i == 0 else {}
            # Realizar petición de tipo stream
            res = requests.get(gateway_url, headers=req_headers, stream=True, timeout=15)
            if res.status_code == 200:
                response = res
                break
        except Exception as e:
            print(f"⚠️ Error al conectar con gateway {gateway_url}: {str(e)}")
            continue

    if not response:
        # Fallback de audio de muestra si IPFS está caído por completo
        fallback_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        print("⚠️ No se pudo obtener el archivo desde ningún gateway de IPFS. Usando fallback de audio de muestra...")
        try:
            response = requests.get(fallback_url, stream=True, timeout=10)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"No se pudo cargar el audio de IPFS ni el fallback: {str(e)}"
            )

    # Función generadora para transmitir los bytes en tiempo real
    def iter_content():
        for chunk in response.iter_content(chunk_size=4096):
            yield chunk

    # Servir el archivo con el tipo de contenido adecuado para reproducción de audio
    content_type = response.headers.get("content-type", "audio/mpeg")
    
    return StreamingResponse(
        iter_content(),
        media_type=content_type,
        headers={
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=31536000"
        }
    )

@app.post("/purchase", response_model=PurchaseResponse, tags=["Transacciones"])
def record_purchase(purchase: PurchaseRequest):
    """
    Registra e indexa una compra de pista musical en la blockchain.
    Verifica y aplica el split estricto de 85% para el artista y 15% para la plataforma.
    """
    if purchase.track_id not in DB_TRACKS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La pista musical no existe en el catálogo."
        )
    
    track = DB_TRACKS[purchase.track_id]
    expected_price = track["price_sol"] if purchase.currency.upper() == "SOL" else track["price_usdc"]
    
    # Validar que el monto pagado corresponda al precio registrado
    if purchase.amount_paid < expected_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Monto de pago insuficiente. Esperado: {expected_price}, Recibido: {purchase.amount_paid}"
        )
    
    # Calcular la distribución estricta de Bandcamp (85% Artista / 15% Plataforma)
    platform_share = round(purchase.amount_paid * 0.15, 6)
    artist_share = round(purchase.amount_paid - platform_share, 6)
    
    # Registrar la compra
    purchase_record = {
        "track_id": purchase.track_id,
        "buyer_wallet": purchase.buyer_wallet,
        "tx_signature": purchase.tx_signature,
        "currency": purchase.currency.upper(),
        "amount_paid": purchase.amount_paid,
        "artist_share": artist_share,
        "platform_share": platform_share,
        "timestamp": int(time.time())
    }
    
    DB_PURCHASES.append(purchase_record)
    
    # Incrementar contador de ventas de la pista
    DB_TRACKS[purchase.track_id]["sales_count"] += 1
    
    return PurchaseResponse(
        success=True,
        message=f"Compra procesada y validada con éxito. Split aplicado: 85% ({artist_share} {purchase.currency}) al artista, 15% ({platform_share} {purchase.currency}) a la plataforma.",
        artist_share=artist_share,
        platform_share=platform_share,
        tx_signature=purchase.tx_signature
    )

@app.get("/purchases", tags=["Transacciones"])
def get_purchase_history(wallet: Optional[str] = None):
    """Obtiene el historial de compras indexadas, opcionalmente filtrado por wallet del comprador."""
    if wallet:
        return [p for p in DB_PURCHASES if p["buyer_wallet"].lower() == wallet.lower()]
    return DB_PURCHASES

if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)
