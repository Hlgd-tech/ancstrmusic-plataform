# Arquitectura Técnica de la dApp de Streaming de Música Descentralizada

Este documento detalla el diseño arquitectónico, el análisis de benchmark híbrido entre Audius y Bandcamp, y la infraestructura de pagos de alta escalabilidad diseñada para la plataforma.

---

## 1. Benchmark Híbrido: Audius vs. Bandcamp

Para diseñar una dApp de streaming musical de alto rendimiento, se realiza un análisis comparativo entre el modelo descentralizado de [Audius](https://audius.co/) y el modelo de venta directa de [Bandcamp](https://bandcamp.com/). El objetivo es sintetizar la soberanía del contenido y la resiliencia técnica del primero con la simplicidad financiera y el enfoque centrado en el artista del segundo.

| Característica | Audius (Protocolo Descentralizado) | Bandcamp (Venta Directa Tradicional) | Propuesta Híbrida dApp |
| :--- | :--- | :--- | :--- |
| **Almacenamiento** | Red de Nodos de Contenido (IPFS) [1] | Servidores Centralizados de la Nube | IPFS con Gateways Públicos / Arweave |
| **Indexación** | Nodos de Descubrimiento (Base de Datos) | Base de Datos Relacional Centralizada | Indexación en Cliente + Backend FastAPI |
| **Modelo de Negocio** | Distribución basada en Staking de $AUDIO | Comisión de 15% (Digital) y 10% (Físico) [2] | Split Estricto 85/15 en Contrato Inteligente |
| **Procesamiento** | Token Nativo de Utilidad ($AUDIO) | Pasarelas de Pago Tradicionales (Stripe) | Pagos Directos en SOL y USDC |
| **Soberanía de Datos** | Registro en Content Ledger (Solana) | Propiedad de la Plataforma | Metadatos y Licencias en Solana |

> **Definición de Almacenamiento Descentralizado**: El almacenamiento descentralizado en Web3 se refiere a la distribución de archivos a través de una red peer-to-peer (como IPFS), donde la integridad del archivo se valida mediante hashes criptográficos en lugar de rutas de servidor centralizadas.

---

## 2. Modelo de Negocio Clean Split (85/15)

El núcleo económico de la dApp se rige por un principio de transparencia absoluta. A diferencia de las plataformas de streaming tradicionales que diluyen los ingresos a través de intermediarios, esta arquitectura implementa un **Clean Split** donde el **85%** de cada transacción se transfiere inmediatamente al creador, mientras que el **15%** restante se destina a la tesorería de la plataforma para cubrir costos operativos y de mantenimiento.

Esta distribución de fondos se programa directamente en la lógica del contrato inteligente o del backend transaccional. Al realizar una compra, el pago del usuario se divide de forma atómica en una única transacción de la blockchain, garantizando que el artista reciba sus fondos de manera instantánea sin períodos de retención de 24 a 48 horas como ocurre en plataformas Web2 tradicionales [2].

---

## 3. Infraestructura de Pagos sin Tokens Nativos

Para mitigar la fricción de entrada asociada con los tokens de utilidad altamente volátiles, esta dApp elimina por completo los tokens nativos. En su lugar, utiliza criptomonedas líquidas y de alta adopción en redes de alta velocidad:

1.  **SOL (Solana)**: Moneda nativa utilizada para transacciones ultrarrápidas y micropagos con tarifas de red de fracciones de centavo.
2.  **USDC (USD Coin)**: Stablecoin vinculada al dólar estadounidense, proporcionando estabilidad de precios para los artistas que desean fijar tarifas predecibles para sus álbumes y sencillos.

El flujo de pago atómico se ejecuta mediante transacciones multifirma o instrucciones de transferencia dividida en Solana. El programa de Solana recibe el pago del comprador, calcula el split 85/15 en tiempo real y realiza dos transferencias salientes en la misma transacción de bloque.

---

## 4. Arquitectura de Software Propuesta

La dApp se estructura bajo una arquitectura de tres capas diseñada para garantizar escalabilidad, velocidad de respuesta y descentralización:

```
+-----------------------------------------------------------------+
|                        Frontend (React)                         |
|  - Reproductor de Audio Flotante (Estilo Audio Lab)            |
|  - Integración de Wallet (SOL/USDC)                             |
|  - Panel de Control del Artista (Subida de Música y Ventas)      |
+-----------------------------------------------------------------+
                                |
                                | API REST / JSON
                                v
+-----------------------------------------------------------------+
|                    Backend (FastAPI / Python)                   |
|  - Caché de Metadatos de Pistas y Álbumes                       |
|  - Indexador de Transacciones Blockchain                         |
|  - Generación de URLs Temporales para Streaming Seguro          |
+-----------------------------------------------------------------+
                                |
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
+-------------------------------+               +-------------------------------+
|      Capa Blockchain          |               |      Almacenamiento           |
|  - Contratos de Split (Solana)|               |  - Archivos de Audio en IPFS  |
|  - Registro de Licencias      |               |  - Imágenes de Portada        |
+-------------------------------+               +-------------------------------+
```

### 4.1. Frontend (React + Tailwind CSS)
El frontend adopta el enfoque **Dark Cyber-Minimalism** detallado en el brainstorming de diseño. Se implementará una interfaz oscura de alta fidelidad visual que prioriza la visualización de las portadas de los álbumes, formas de onda interactivas para el streaming de audio y un panel de pago intuitivo que muestra gráficamente el split 85/15 antes de confirmar la transacción.

### 4.2. Backend (FastAPI)
El backend en Python con FastAPI actúa como una capa de descubrimiento y optimización (similar a los Discovery Nodes de Audius) [3]. Su función principal es indexar las pistas musicales registradas en la blockchain, almacenar en caché los metadatos de IPFS para ofrecer búsquedas instantáneas y gestionar la autenticación de usuarios mediante firmas criptográficas.

### 4.3. Capa de Contratos Inteligentes e IPFS
El almacenamiento de los archivos de audio de alta calidad se realiza en **IPFS** para asegurar que el contenido no dependa de un servidor centralizado. Los hashes de IPFS se registran en Solana junto con la clave pública del artista y el precio de la pista, asegurando que la propiedad y los términos de distribución sean inmutables y de acceso público.

---

## 5. Referencias

*   [1] Audius Project. *Audius Whitepaper: A Decentralized Music Sharing Protocol*. Disponible en [Scribd](https://www.scribd.com/document/515948031/AudiusWhitepaper).
*   [2] Bandcamp. *Fair Trade Music Policy*. Disponible en [Bandcamp](https://bandcamp.com/fair_trade_music_policy).
*   [3] Audius Developer Docs. *Discovery Nodes and Content Nodes Architecture*. Disponible en [Audius Docs](https://docs.audius.org/learn/concepts/protocol/).
