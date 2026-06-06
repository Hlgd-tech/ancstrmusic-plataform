import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Definición de tipos para las propiedades del componente
interface HoloSphereVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  bassIntensity: number;
}

// 1. Shaders personalizados de GLSL
const vertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uFreqs[64];
  
  varying vec3 vPosition;
  varying float vElevation;
  varying float vXPosition;

  // Función de ruido simple para simular deformación orgánica
  float sinusNoise(vec3 p) {
    return sin(p.x * 2.0 + uTime * 1.5) * cos(p.y * 2.0 + uTime * 1.5) * sin(p.z * 2.0 + uTime * 1.5);
  }

  void main() {
    vPosition = position;
    vXPosition = position.x;
    
    // Obtener la distancia desde el centro (esfera)
    float dist = length(position);
    vec3 normal = normalize(position);
    
    // Deformación de baja frecuencia (bajos/bass) para hacer que la esfera palpite físicamente
    float pulse = uBass * 0.28;
    
    // Ruido orgánico de alta tecnología
    float noise = sinusNoise(position) * (0.05 + uBass * 0.12);
    
    // Deformar los vértices a lo largo de su vector normal (deformación esférica real)
    vec3 newPosition = position + normal * (pulse + noise);
    
    vElevation = pulse + noise;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Ajustar el tamaño de las partículas basándose en la distancia a la cámara (perspectiva)
    gl_PointSize = (12.0 + uBass * 18.0) * (3.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying vec3 vPosition;
  varying float vElevation;
  varying float vXPosition;
  uniform float uTime;
  uniform float uBass;

  void main() {
    // Convertir el punto cuadrado en un círculo suave (partícula redonda)
    vec2 temp = gl_PointCoord - vec2(0.5);
    float dist = dot(temp, temp);
    if (dist > 0.25) {
      discard;
    }
    
    // Iluminación dual asimétrica de neón:
    // Cian brillante a la izquierda (x < 0) y naranja/cobre intenso a la derecha (x > 0)
    vec3 colorLeft = vec3(0.0, 0.85, 1.0);     // Cian Neón
    vec3 colorRight = vec3(1.0, 0.38, 0.0);    // Naranja Cobre Neón
    
    // Mezcla suave entre izquierda y derecha basada en la coordenada X de la partícula
    float mixFactor = smoothstep(-1.2, 1.2, vXPosition);
    vec3 baseColor = mix(colorLeft, colorRight, mixFactor);
    
    // Añadir modulación de color y resplandor basado en la deformación (pulsación)
    vec3 glowColor = baseColor * (1.5 + vElevation * 3.5 + uBass * 1.5);
    
    // Atenuación suave en los bordes de cada partícula individual para un efecto de orbe difuso
    float alpha = smoothstep(0.25, 0.0, dist);
    
    gl_FragColor = vec4(glowColor, alpha * 0.85);
  }
`;

// 2. Componente interno que renderiza la geometría y los Shaders (dentro del Canvas de R3F)
function InteractivePoints({ analyserNode, isPlaying, bassIntensity }: HoloSphereVisualizerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Array de frecuencias de respaldo para la simulación offline
  const simulatedFreqs = useMemo(() => new Float32Array(64), []);

  // Crear la geometría de la esfera
  const geometry = useMemo(() => {
    // Generar una esfera con distribución de puntos uniforme
    return new THREE.SphereGeometry(1.6, 64, 64);
  }, []);

  // Uniforms del shader personalizado
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0.0 },
      uBass: { value: 0.0 },
      uFreqs: { value: new Float32Array(64) }
    };
  }, []);

  // Bucle de animación de R3F (useFrame se ejecuta en la GPU a 60+ FPS)
  useFrame((state) => {
    const { clock } = state;
    const elapsedTime = clock.getElapsedTime();
    
    if (materialRef.current) {
      // 1. Actualizar el tiempo global
      materialRef.current.uniforms.uTime.value = elapsedTime;
      
      // 2. Obtener datos reales de la Web Audio API si está activa
      if (analyserNode && isPlaying) {
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);
        
        // Extraer la intensidad de bajos (primeras 8 bandas de frecuencia)
        let bassSum = 0;
        for (let i = 0; i < 8; i++) {
          bassSum += dataArray[i];
        }
        const currentBass = bassSum / (8 * 255); // Normalizado de 0.0 a 1.0
        materialRef.current.uniforms.uBass.value = currentBass;
        
        // Mapear 64 bandas de frecuencia a los uniforms del shader
        const freqs = materialRef.current.uniforms.uFreqs.value as Float32Array;
        for (let i = 0; i < 64; i++) {
          freqs[i] = dataArray[i * 2] / 255.0; // Normalizado
        }
      } else {
        // Simulación senoidal offline de alta gama si no hay música sonando
        const t = elapsedTime * 2.0;
        const simulatedBass = 0.15 + Math.sin(t) * 0.08 + Math.cos(t * 1.5) * 0.05;
        materialRef.current.uniforms.uBass.value = simulatedBass;
        
        const freqs = materialRef.current.uniforms.uFreqs.value as Float32Array;
        for (let i = 0; i < 64; i++) {
          freqs[i] = (0.1 + Math.sin(t + i * 0.1) * 0.08) * (1.0 - i / 64.0);
        }
      }
    }
    
    // Rotación constante y suave del orbe esférico completo
    if (pointsRef.current) {
      const speedFactor = 0.15 + (materialRef.current?.uniforms.uBass.value || 0.0) * 0.45;
      pointsRef.current.rotation.y = elapsedTime * speedFactor;
      pointsRef.current.rotation.x = Math.sin(elapsedTime * 0.1) * 0.15;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Componente principal exportable
export default function HoloSphereVisualizer({ analyserNode, isPlaying, bassIntensity }: HoloSphereVisualizerProps) {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {/* Canvas de React Three Fiber */}
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        {/* Iluminación de ambiente sutil */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        {/* Orbe holográfico interactivo */}
        <InteractivePoints
          analyserNode={analyserNode}
          isPlaying={isPlaying}
          bassIntensity={bassIntensity}
        />
        
        {/* Controles de órbita interactivos táctiles y de mouse */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          autoRotate={false}
        />
        
        {/* Post-procesamiento: Efecto de Bloom (Resplandor de Neón Fotorrealista) */}
        <EffectComposer>
          <Bloom
            intensity={1.8}          // Intensidad del brillo
            luminanceThreshold={0.15} // Umbral de brillo (qué tan brillante debe ser para brillar)
            luminanceSmoothing={0.9}  // Suavizado del resplandor
            mipmapBlur={true}         // Desenfoque mipmap de alta calidad para un glow suave
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
