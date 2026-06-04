# Sonic Labs dApp: dApp de Streaming de Música Descentralizada

Una dApp minimalista y de alta escalabilidad para el streaming de música y la compra directa de licencias, inspirada en la arquitectura de almacenamiento de **Audius** y el modelo de negocio transparente de **Bandcamp**.

---

## 🚀 Arquitectura Técnica y Características

### 1. Benchmark Híbrido (Audius + Bandcamp)
La dApp combina lo mejor de ambos mundos:
*   **Almacenamiento Descentralizado (Audius)**: Los archivos de audio de alta fidelidad y las portadas se cargan y encriptan de manera segura en la red **IPFS**, asegurando la soberanía absoluta del contenido del artista sin depender de servidores centralizados.
*   **Venta Directa y Transparencia (Bandcamp)**: Un flujo de compra directa donde los usuarios pueden adquirir pistas utilizando criptomonedas, desbloqueando el streaming premium lossless de 24 bits.

### 2. Modelo de Negocio Clean Split (85/15)
La plataforma aplica una regla estricta e inmutable de distribución de ingresos:
*   **85% para el Artista**: Enviado directamente a la wallet de Solana del creador en el momento de la transacción.
*   **15% para la Plataforma**: Enviado a la tesorería de la casa para cubrir el mantenimiento técnico y el gateway de IPFS.
*   **Pagos Atómicos**: La división se realiza a nivel de contrato inteligente en una sola transacción blockchain, eliminando períodos de retención o retrasos en los pagos.

### 3. Pagos Libres de Tokens Nativos
Para evitar la fricción y volatilidad de los tokens de utilidad tradicionales, la dApp opera exclusivamente con criptomonedas estables y de alta velocidad en la red de **Solana**:
*   **SOL**: Criptomoneda nativa de Solana para micropagos y transacciones ultrarrápidas con tarifas mínimas.
*   **USDC**: Stablecoin vinculada al dólar para precios predecibles y estables para los artistas.

---

## 🛠️ Estructura del Proyecto

El proyecto está dividido en componentes modulares y limpios:

```
decentralized_music_streaming_dapp/
├── client/                     # Frontend de React + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx        # Interfaz Dark Cyber-Minimalism y Reproductor
│   │   ├── index.css           # Estilos globales y tokens de color
│   │   └── App.tsx             # Enrutamiento y tema por defecto
├── contract.rs                 # Contrato inteligente de Solana (Anchor)
├── backend.py                  # API de descubrimiento en Python (FastAPI)
├── test_backend.py             # Pruebas unitarias de la API de FastAPI
└── test_split.js               # Pruebas de la lógica matemática del split 85/15
```

---

## 💻 Ejecución y Pruebas

### 1. Pruebas de la Lógica de Pagos (Node.js)
Para verificar la exactitud matemática de la división de ingresos (85/15) tanto en SOL como en USDC:
```bash
node test_split.js
```

### 2. Pruebas Unitarias del Backend (FastAPI)
Para validar todos los endpoints de descubrimiento, registro de metadatos de IPFS y validación de compras:
```bash
python3 test_backend.py
```

---

## 🎨 Filosofía de Diseño: Dark Cyber-Minimalism
La dApp adopta un diseño visual de alta gama ("High-End Audio Lab") inspirado en el hardware analógico de audio:
*   **Tipografía**: Combinación de *Space Grotesk* (geométrica y moderna para títulos) con *Plus Jakarta Sans* (limpia y legible para metadatos técnicos).
*   **Paleta de Colores**: Fondo negro profundo de laboratorio (`#09090B`) con acentos de naranja quemado analógico (`#F97316`) y verde fósforo para denotar estados de transacciones activas.
*   **Interacciones**: Efectos de elevación física en las tarjetas de las pistas, reproductor inferior unificado y visualizadores dinámicos del split de pagos.
