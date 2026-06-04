import unittest
from fastapi.testclient import TestClient
from backend import app

client = TestClient(app)

class TestMusicBackend(unittest.TestCase):

    def test_root_endpoint(self):
        """Verifica que el endpoint raíz responda correctamente."""
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["benchmark"], "Audius (Almacenamiento/Descubrimiento) + Bandcamp (Split de Pago 85/15)")

    def test_get_tracks(self):
        """Verifica que se obtenga el catálogo de pistas iniciales."""
        response = client.get("/tracks")
        self.assertEqual(response.status_code, 200)
        tracks = response.json()
        self.assertTrue(len(tracks) >= 3)
        self.assertEqual(tracks[0]["track_id"], "track-1")

    def test_get_track_by_id(self):
        """Verifica que se obtengan los detalles de una pista específica."""
        response = client.get("/tracks/track-1")
        self.assertEqual(response.status_code, 200)
        track = response.json()
        self.assertEqual(track["title"], "Decentralized Dreams")
        self.assertEqual(track["artist_name"], "Satoshi Sound")

    def test_get_track_not_found(self):
        """Verifica el error 404 al buscar una pista inexistente."""
        response = client.get("/tracks/non-existent-track")
        self.assertEqual(response.status_code, 404)

    def test_register_track(self):
        """Verifica el registro exitoso de una nueva pista musical."""
        new_track_data = {
            "track_id": "track-4",
            "title": "FastAPI Flow",
            "artist_name": "Pythonic DJ",
            "artist_wallet": "Art4stSolanaWa11etAddressZ444444444444444",
            "album": "API Anthems",
            "genre": "Lo-Fi",
            "duration": 180,
            "ipfs_audio_hash": "QmFastAPIFlowAudioHash1111111111111111111111",
            "ipfs_cover_hash": "QmFastAPIFlowCoverHash1111111111111111111111",
            "price_sol": 0.05,
            "price_usdc": 1.50
        }
        response = client.post("/tracks", json=new_track_data)
        self.assertEqual(response.status_code, 201)
        track = response.json()
        self.assertEqual(track["title"], "FastAPI Flow")
        self.assertEqual(track["sales_count"], 0)

    def test_purchase_track_and_split(self):
        """Verifica el procesamiento de una compra y la correcta aplicación del split 85/15."""
        purchase_data = {
            "track_id": "track-1",
            "buyer_wallet": "BuyerSolanaWa11etAddress9999999999999999",
            "tx_signature": "5V1P6eG9Y...fake_solana_signature...z7X8y9W",
            "currency": "SOL",
            "amount_paid": 0.15
        }
        response = client.post("/purchase", json=purchase_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verificar split exacto: 15% de 0.15 SOL = 0.0225 SOL (plataforma), 85% = 0.1275 SOL (artista)
        self.assertEqual(data["platform_share"], 0.0225)
        self.assertEqual(data["artist_share"], 0.1275)

if __name__ == "__main__":
    unittest.main()
