# ANCSTR MUSIC - Plataforma de Streaming de Música Descentralizada en Solana

Este documento describe detalladamente la arquitectura técnica, las decisiones de diseño visual, la evolución del desarrollo y las características principales de la plataforma **ANCSTR MUSIC**.

---

## 🌌 1. Filosofía de Diseño: High-Tech Glassmorphism (Futurista)

La interfaz de **ANCSTR MUSIC** ha sido diseñada bajo un enfoque estrictamente fotorrealista y futurista, simulando una consola holográfica flotante de grado militar/espacial en un lienzo de pantalla completa.

### 📐 Reglas Estrictas de Renderizado Visual Aplicadas:

1. **El Lienzo General (`h-screen w-screen overflow-hidden`)**:
   * La aplicación ocupa de forma estricta toda la pantalla, eliminando las barras de scroll globales y los márgenes convencionales.
   * El fondo de la dApp utiliza una imagen de alta resolución fotorrealista de un planeta holográfico en 3D (`bg-sphere.jpg`) complementado con una cuadrícula holográfica de fondo (`linear-gradient`) para emular un entorno de realidad aumentada.

2. **Materiales y Glassmorphism Translúcido**:
   * Ningún contenedor posee fondos sólidos oscuros. Todos los paneles laterales y el reproductor flotante están construidos con un cristal translúcido ultra-filtrado:
     `bg-[#0a0f16]/60 backdrop-blur-xl border border-white/5`
   * Esto permite que la luz y las formas del planeta holográfico del fondo se filtren suavemente a través de la interfaz.

3. **Iluminación Dual Asimétrica (Neón)**:
   * **Panel Izquierdo (Sidebar)**: Cuenta con un borde sutil azul y un resplandor de neón cian que simula la refracción de luz fría del holograma:
     `border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(0,180,255,0.15)]`
   * **Panel Derecho y Reproductor Flotante**: Cuentan con bordes y resplandores de neón naranja cálido para crear un contraste cromático asimétrico y sofisticado:
     `border-orange-500/30 shadow-[0_0_30px_-5px_rgba(255,100,0,0.15)]`

4. **Distribución del Layout de Tres Bloques**:
   * **Izquierda (`w-72`)**: Sidebar de control con el logo vectorial de ANCSTR, menú de navegación vertical con iconos de neón de Lucide React, tarjeta de balance de billetera consolidada con un gráfico de tendencia (sparkline) de neón cian, y el perfil del usuario `0xEchoSoul` con etiquetas de estatus Web3.
   * **Centro**: Totalmente **VACÍO** en su estado principal para permitir que la imagen del planeta holográfico de fondo se aprecie en todo su esplendor sin obstrucciones visuales. Cuando el usuario navega a otras secciones como "Discover", "Feed" o "My Library", se despliega una tarjeta de cristal translúcido flotante sobre el área central.
   * **Abajo Centro/Derecha**: El reproductor de audio analógico flota de forma absoluta en la parte inferior central (`absolute bottom-8 left-1/2 -translate-x-1/2`). El botón de **PLAY** cuenta con un círculo naranja brillante retroiluminado:
     `bg-orange-600 shadow-[0_0_20px_rgba(255,100,0,0.8)]`
   * **Derecha (`w-96`)**: Panel vertical dedicado a las portadas de álbumes de cristal de "ANCSTR ERA", el tracklist de reproducción "UP NEXT" con ecualizadores dinámicos, la tarjeta de progreso de recompensas "EARN ANC" que incorpora un **cubo 3D de alambre giratorio (wireframe)** de neón naranja hecho enteramente con CSS 3D, y el muro descentralizado de comentarios de coleccionistas.

---

## 🛠️ 2. Arquitectura Técnica y Funcionalidades Web3

**ANCSTR MUSIC** no es solo una maqueta visual; es una dApp completamente funcional conectada con la blockchain de Solana y el sistema de almacenamiento descentralizado IPFS.

### 🧱 Componentes de la Arquitectura:

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, TypeScript, Wouter | Interfaz de usuario interactiva, responsiva y de alto rendimiento. |
| **Billetera Web3** | `@solana/wallet-adapter-react` | Conexión directa con Phantom, Solflare u otras billeteras de Solana. |
| **Blockchain** | `@solana/web3.js` | Transacciones en vivo en la red de Solana, firmas de transacciones y consulta de saldos. |
| **Almacenamiento** | IPFS (Pinata / Nodos Públicos) | Almacenamiento descentralizado e inmutable de los archivos de audio y portadas. |
| **Split de Ingresos** | Splits directos 85/15 en SOL | Mecanismo financiero atómico sin tokens nativos (85% al artista, 15% soporte de red). |

### 🚀 Características Clave Implementadas:

1. **Conexión de Billetera y Consulta en Tiempo Real**:
   * Integración nativa del `WalletMultiButton` de Solana.
   * Consulta de balances de SOL en tiempo real en la red Devnet/Mainnet, con simulación de saldos de tokens (USDC, USDT, ETH, BTC) para propósitos de demostración.

2. **Publicación de Licencias Digitales (Música a IPFS)**:
   * Los artistas pueden rellenar un formulario para subir sus pistas de audio y portadas de álbum directamente a IPFS.
   * Una vez subidos los archivos, se genera una transacción de metadatos en la blockchain de Solana que registra la licencia musical de forma inmutable.

3. **Split de Pagos Atómico Directo (85/15)**:
   * Al comprar una licencia musical o enviar una propina a un artista, el contrato realiza una distribución de fondos instantánea en la blockchain:
     * **85%** se transfiere directamente a la billetera pública del artista creador de la pista.
     * **15%** se transfiere a la billetera de la plataforma para cubrir los costos de soporte y mantenimiento de la red.
   * Esto elimina por completo los intermediarios financieros convencionales.

4. **Web Audio API y Visualizador de Espectro**:
   * Conexión con la Web Audio API del navegador para analizar las frecuencias del archivo de audio de IPFS en tiempo real.
   * Generación de ondas de espectro radiales y cálculo de la intensidad de los bajos (`bassIntensity`) para hacer que los resplandores de neón de la interfaz pulsen al ritmo de la música.

5. **Muro de Comentarios Descentralizado**:
   * Los coleccionistas de música pueden dejar comentarios públicos que quedan asociados de forma permanente a la pista de audio en la blockchain.
   * Muestra la dirección recortada de la billetera del autor y una etiqueta especial si el autor posee la licencia de la canción.

---

## 📈 3. Historial de Desarrollo y Evolución

* **Hito 1: Inicialización y Estructuración Web3**: Configuración de la dApp, conexión del adaptador de billetera de Solana y el sistema de subida de archivos a IPFS.
* **Hito 2: Refactorización a Esfera Holográfica 3D (CSS/SVG)**: Creación de la esfera interactiva tridimensional mediante mallas cruzadas y rotaciones en el espacio tridimensional nativo de CSS para optimizar el rendimiento a 60 FPS en cualquier dispositivo.
* **Hito 3: Transformación Cyberpunk Glassmorphism Completa**: Rediseño de toda la interfaz bajo una cuadrícula de tres columnas flotantes con fondos de cristal y resplandores de neón cian y naranja.
* **Hito 4: Reconstrucción de Alta Fidelidad de Lienzo Completo**: Reescritura estricta del layout para cumplir con las reglas visuales del mockup: lienzo completo `h-screen`, centro totalmente vacío para lucir el planeta holográfico de fondo, paneles laterales translúcidos de `w-72` y `w-96`, reproductor analógico flotante inferior con botón de play retroiluminado, y el cubo 3D wireframe giratorio en la tarjeta de recompensas.
* **Hito 5: Esfera Holográfica 3D Real con Osciloscopio HTML5 Canvas**: Implementación en la pestaña de reproducción (ANCSTR ERA) de una esfera holográfica giratoria multicapa en 3D real mediante CSS 3D Transforms (`holographic-sphere-3d`) y un osciloscopio en tiempo real basado en HTML5 Canvas 2D. Este osciloscopio captura datos en el dominio del tiempo mediante `getByteTimeDomainData` de la Web Audio API y dibuja tres ondas de neón superpuestas (principal naranja y dos secundarias cian y magenta con desfase y desenfoque) emulando un osciloscopio analógico tridimensional de alta fidelidad.
* **Hito 6: Panel Derecho Colapsable Interactivo**: Conversión de las secciones clave del panel derecho ("ANCSTR ERA", "UP NEXT" y "EARN ANC") en acordeones/colapsables dinámicos independientes. Cada uno cuenta con su propio estado de React (`isAncstrEraOpen`, `isUpNextOpen`, `isEarnAncOpen`), botones interactivos con iconos de `ChevronDown` que rotan 180° de forma suave, y transiciones de altura máxima y opacidad ultra-fluidas mediante Tailwind CSS (`transition-all duration-500 ease-in-out overflow-hidden`). Además, se ha implementado un refinamiento estético de alta fidelidad: cuando las secciones están cerradas, los controles del extremo derecho ("VIEW ALL" y "AUTOPLAY") se desvanecen y se ocultan de forma fluida hacia la derecha (`opacity-0 translate-x-4 pointer-events-none`), logrando un acabado minimalista, limpio y profesional.
* **Hito 7: Implementación de Progressive Web App (PWA) de Alta Gama**: Transformación de la dApp en una aplicación web progresiva totalmente instalable en dispositivos móviles (iOS y Android) y de escritorio. Se diseñó un icono SVG de neón vectorial de alta resolución (`icon.svg`), se configuró el archivo de manifiesto (`manifest.json`) para el modo `standalone` a pantalla completa, se añadieron meta-etiquetas optimizadas para el ecosistema de Apple (iOS status bar translúcido y compatibilidad nativa), y se desarrolló un Service Worker (`sw.js`) personalizado con estrategia de almacenamiento en caché inteligente para garantizar una carga instantánea y funcionamiento offline básico.
* **Hito 8: Banner Holográfico Inteligente de Instalación PWA**: Diseño e implementación de un banner flotante interactivo en la esquina inferior izquierda con estética Cyberpunk Glassmorphism. El componente detecta dinámicamente el entorno de ejecución: en dispositivos Android y Escritorio, captura el evento `beforeinstallprompt` y proporciona un botón de "INSTALAR AHORA" que activa la instalación nativa con un solo clic; en dispositivos iOS (Apple Safari), detecta el sistema operativo y despliega una guía visual interactiva paso a paso para guiar al usuario a utilizar el menú de "Compartir" y "Añadir a la pantalla de inicio". El banner incluye animaciones de entrada, persistencia de descarte en `sessionStorage` para no ser intrusivo, y un diseño totalmente integrado al ecosistema de ANCSTR.

---

## 👤 Desarrolladores y Contribuidores
* **Frontend Engineer**: Elite React & Tailwind CSS Specialist (Manus AI Agent)
* **Web3 Integration**: Solana & IPFS Architect
* **Platform Owner**: ANCSTR MUSIC Team
