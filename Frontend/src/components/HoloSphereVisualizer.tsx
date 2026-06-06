import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

interface HoloSphereVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  bassIntensity: number;
}

// =========================================================================
// SHADERS GLSL PARA EL PLANETA NEBULA (PARTÍCULAS)
// =========================================================================

const particleVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uFreqs[64];
  
  varying vec3 vPosition;
  varying float vElevation;
  
  // Función de ruido procedural simple de 3D
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  float noise(in vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  void main() {
    vPosition = position;
    
    // Deformación del planeta basada en ruido 3D y frecuencias de bajos
    vec3 normPos = normalize(position);
    float noiseVal = noise(position * 3.5 + vec3(0.0, uTime * 0.8, 0.0));
    
    // Palpitar caótico según la intensidad de bajos
    float deformation = noiseVal * (0.05 + uBass * 0.45);
    vec3 newPosition = position + normPos * deformation;
    
    vElevation = deformation;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Tamaño de punto interactivo con atenuación por distancia física segura
    gl_PointSize = (4.5 + uBass * 10.0) * (5.0 / max(0.01, -mvPosition.z));
  }
`;

const particleFragmentShader = `
  varying vec3 vPosition;
  varying float vElevation;
  uniform float uTime;
  uniform float uBass;

  void main() {
    // Generar partículas redondas suaves
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * (0.65 + uBass * 0.35);
    
    // ILUMINACIÓN DUAL ASIMÉTRICA CON MIX() GLSL
    // Lado izquierdo (x < 0) -> Cian Neón (#00f0ff)
    // Lado derecho (x > 0) -> Naranja Cálido e Intenso (#ff5500)
    vec3 leftColor = vec3(0.0, 0.94, 1.0);  // #00f0ff
    vec3 rightColor = vec3(1.0, 0.33, 0.0); // #ff5500
    
    // Mezcla fluida en el eje X basada en la posición local de la partícula
    float mixFactor = smoothstep(-0.8, 0.8, vPosition.x);
    vec3 baseColor = mix(leftColor, rightColor, mixFactor);
    
    // Añadir brillo de alta emisión modulado por la elevación del ruido y bajos
    vec3 glowColor = baseColor * (1.2 + vElevation * 3.0 + uBass * 1.5);
    
    gl_FragColor = vec4(glowColor, alpha * 0.8);
  }
`;

// =========================================================================
// SHADERS GLSL PARA EL OSCILOSCOPIO CENTRAL (LÍNEA HORIZONTAL)
// =========================================================================

const lineVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uFreqs[64];
  
  varying float vXPos;
  varying float vFreqVal;

  void main() {
    vXPos = position.x;
    
    // Mapear la coordenada X (-3.0 a 3.0) a un índice en el array de frecuencias (0 a 63)
    float normX = (position.x + 3.0) / 6.0; // Normalizado de 0.0 a 1.0
    int index = int(clamp(normX * 64.0, 0.0, 63.0));
    
    // Obtener el valor de la frecuencia correspondiente
    float freqVal = 0.0;
    for(int i = 0; i < 64; i++) {
      if(i == index) {
        freqVal = uFreqs[i];
        break;
      }
    }
    
    vFreqVal = freqVal;
    
    // Generar picos verticales agresivos en el eje Y basados en la frecuencia y bajos
    float yOffset = freqVal * (0.2 + uBass * 2.5) * sin(position.x * 4.0 + uTime * 5.0);
    
    // Añadir una pequeña onda senoidal base si no hay audio (respiración)
    if (uBass < 0.05) {
      yOffset = sin(position.x * 6.0 + uTime * 2.0) * 0.08;
    }
    
    vec3 newPosition = vec3(position.x, position.y + yOffset, position.z);
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const lineFragmentShader = `
  varying float vXPos;
  varying float vFreqVal;
  uniform float uTime;
  uniform float uBass;

  void main() {
    // Iluminación dual asimétrica para la línea ecuatorial
    vec3 leftColor = vec3(0.0, 0.94, 1.0);  // #00f0ff
    vec3 rightColor = vec3(1.0, 0.33, 0.0); // #ff5500
    
    float mixFactor = smoothstep(-1.5, 1.5, vXPos);
    vec3 baseColor = mix(leftColor, rightColor, mixFactor);
    
    // Brillo de emisión agresivo en los picos de frecuencia
    vec3 glowColor = baseColor * (1.5 + vFreqVal * 4.0 + uBass * 2.0);
    
    gl_FragColor = vec4(glowColor, 0.9);
  }
`;

// =========================================================================
// COMPONENTE INTERNO DE RENDERIZADO WEBGL
// =========================================================================

function InteractiveHoloScene({ analyserNode, isPlaying }: HoloSphereVisualizerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.Line>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  
  const particleMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // 1. GENERACIÓN PROCEDURAL DE 60,000 PARTÍCULAS DENTRO DE UN VOLUMEN ESFÉRICO
  const { particleGeometry, lineGeometry } = useMemo(() => {
    const particleCount = 60000;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Distribución uniforme dentro de un volumen esférico usando coordenadas polares aleatorias
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      // Radio concentrado en el centro (empaquetamiento denso hacia el núcleo)
      const r = 1.3 * Math.pow(Math.random(), 1.5); 
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // 2. GEOMETRÍA PARA EL OSCILOSCOPIO CENTRAL (LÍNEA HORIZONTAL ECUATORIAL)
    const linePointsCount = 180;
    const linePositions = new Float32Array(linePointsCount * 3);
    for (let i = 0; i < linePointsCount; i++) {
      const x = -3.0 + (i / (linePointsCount - 1)) * 6.0; // Cruza de -3.0 a 3.0 en el eje X
      linePositions[i * 3] = x;
      linePositions[i * 3 + 1] = 0.0;
      linePositions[i * 3 + 2] = 0.0;
    }
    
    const lGeom = new THREE.BufferGeometry();
    lGeom.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    return { particleGeometry: pGeom, lineGeometry: lGeom };
  }, []);

  // 3. UNIFORMS COMPARTIDOS PARA AMBOS SHADERS
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0.0 },
      uBass: { value: 0.0 },
      uFreqs: { value: new Float32Array(64) }
    };
  }, []);

  // Limpieza estricta de memoria GPU
  useEffect(() => {
    return () => {
      if (particleGeometry) particleGeometry.dispose();
      if (lineGeometry) lineGeometry.dispose();
      if (particleMaterialRef.current) particleMaterialRef.current.dispose();
      if (lineMaterialRef.current) lineMaterialRef.current.dispose();
    };
  }, [particleGeometry, lineGeometry]);

  // 4. BUCLE DE ANIMACIÓN DE R3F (useFrame se ejecuta a 60+ FPS)
  useFrame((state) => {
    const { clock } = state;
    const elapsedTime = clock.getElapsedTime();
    
    // Actualizar tiempo en ambos materiales
    if (particleMaterialRef.current) {
      particleMaterialRef.current.uniforms.uTime.value = elapsedTime;
    }
    if (lineMaterialRef.current) {
      lineMaterialRef.current.uniforms.uTime.value = elapsedTime;
    }

    let audioDataAvailable = false;
    
    // Capturar datos reales de la Web Audio API si está activa
    if (analyserNode && isPlaying) {
      try {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        
        if (dataArray.length > 0 && dataArray[0] !== undefined) {
          audioDataAvailable = true;
          
          // Calcular intensidad de bajos (primeras 8 bandas)
          let bassSum = 0;
          for (let i = 0; i < 8; i++) {
            bassSum += dataArray[i];
          }
          const currentBass = bassSum / (8 * 255); // Normalizado 0.0 a 1.0
          const safeBass = isNaN(currentBass) || !isFinite(currentBass) ? 0.0 : Math.min(1.0, Math.max(0.0, currentBass));

          // Inyectar bajos normalizados a los uniforms
          if (particleMaterialRef.current) particleMaterialRef.current.uniforms.uBass.value = safeBass;
          if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uBass.value = safeBass;

          // Inyectar 64 bandas de frecuencia normalizadas
          const freqs = new Float32Array(64);
          for (let i = 0; i < 64; i++) {
            const val = dataArray[i * 2] / 255.0;
            freqs[i] = isNaN(val) || !isFinite(val) ? 0.0 : val;
          }
          
          if (particleMaterialRef.current) particleMaterialRef.current.uniforms.uFreqs.value = freqs;
          if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uFreqs.value = freqs;
        }
      } catch (e) {
        audioDataAvailable = false;
      }
    }

    // Fallback senoidal fluido si el audio no está disponible (Estado Idle activo)
    if (!audioDataAvailable) {
      const t = elapsedTime * 1.5;
      const simulatedBass = 0.12 + Math.sin(t) * 0.06 + Math.cos(t * 1.3) * 0.04;
      
      if (particleMaterialRef.current) particleMaterialRef.current.uniforms.uBass.value = simulatedBass;
      if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uBass.value = simulatedBass;

      const freqs = new Float32Array(64);
      for (let i = 0; i < 64; i++) {
        freqs[i] = (0.08 + Math.sin(t + i * 0.12) * 0.05) * (1.0 - i / 64.0);
      }
      
      if (particleMaterialRef.current) particleMaterialRef.current.uniforms.uFreqs.value = freqs;
      if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uFreqs.value = freqs;
    }

    // 5. ROTACIONES Y DEFORMACIONES FÍSICAS DE LOS COMPONENTES
    const currentBassVal = particleMaterialRef.current?.uniforms.uBass.value || 0.0;
    
    // Rotación asimétrica de la nebulosa de polvo estelar
    if (pointsRef.current) {
      const rotSpeed = 0.06 + currentBassVal * 0.25;
      pointsRef.current.rotation.y = elapsedTime * rotSpeed;
      pointsRef.current.rotation.x = Math.sin(elapsedTime * 0.1) * 0.08;
    }

    // Rotación del osciloscopio central (para que gire con el planeta)
    if (lineRef.current) {
      lineRef.current.rotation.y = elapsedTime * (0.06 + currentBassVal * 0.25);
    }

    // Rotación contra-giratoria de los anillos del pedestal holográfico
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = elapsedTime * 0.3;
      ring1Ref.current.scale.setScalar(1.0 + currentBassVal * 0.12);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -elapsedTime * 0.18;
      ring2Ref.current.scale.setScalar(1.0 + currentBassVal * 0.08);
    }
  });

  return (
    <group scale={[2.0, 2.0, 2.0]}> {/* Escalado de impacto global */}
      
      {/* A. NEBULOSA DE POLVO ESTELAR (60,000 Partículas) */}
      <points ref={pointsRef} geometry={particleGeometry}>
        <shaderMaterial
          ref={particleMaterialRef}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* B. OSCILOSCOPIO CENTRAL REACTIVO (Línea Horizontal) */}
      <line ref={lineRef as any} geometry={lineGeometry}>
        <shaderMaterial
          ref={lineMaterialRef}
          vertexShader={lineVertexShader}
          fragmentShader={lineFragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* C. PEDESTAL HOLOGRÁFICO (Dos Torus Concéntricos en la Base) */}
      <group position={[0, -1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh ref={ring1Ref}>
          <torusGeometry args={[1.5, 0.03, 8, 64]} />
          <meshBasicMaterial 
            color="#ff5500" 
            transparent={true} 
            opacity={0.4} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={ring2Ref}>
          <torusGeometry args={[1.2, 0.02, 8, 64]} />
          <meshBasicMaterial 
            color="#00f0ff" 
            transparent={true} 
            opacity={0.3} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      
    </group>
  );
}

// =========================================================================
// EXPORTACIÓN DEL COMPONENTE PRINCIPAL
// =========================================================================

export default function HoloSphereVisualizer({ analyserNode, isPlaying, bassIntensity }: HoloSphereVisualizerProps) {
  return (
    <div className="w-full h-full relative flex items-center justify-center bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          premultipliedAlpha: false
        }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <color attach="background" args={["transparent"]} />
        
        {/* Escena interactiva */}
        <InteractiveHoloScene 
          analyserNode={analyserNode}
          isPlaying={isPlaying}
          bassIntensity={bassIntensity}
        />
        
        {/* Post-procesamiento con Bloom fotorrealista de neón */}
        <EffectComposer>
          <Bloom 
            mipmapBlur={true}
            intensity={0.65} 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
