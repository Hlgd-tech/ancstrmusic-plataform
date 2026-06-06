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

// 1. Shaders personalizados de GLSL optimizados y seguros matemáticamente
const vertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uFreqs[64];
  
  varying vec3 vPosition;
  varying float vElevation;
  varying float vXPosition;

  // Función de ruido simple para simular deformación orgánica
  float sinusNoise(vec3 p) {
    return sin(p.x * 2.5 + uTime * 1.2) * cos(p.y * 2.5 + uTime * 1.2) * sin(p.z * 2.5 + uTime * 1.2);
  }

  void main() {
    vPosition = position;
    vXPosition = position.x;
    
    vec3 normal = normalize(position);
    
    // Deformación de baja frecuencia (bajos/bass) para hacer que la esfera palpite físicamente
    float pulse = clamp(uBass, 0.0, 1.0) * 0.25;
    
    // Ruido orgánico de alta tecnología
    float noise = sinusNoise(position) * (0.04 + clamp(uBass, 0.0, 1.0) * 0.08);
    
    // Deformar los vértices a lo largo de su vector normal (deformación esférica real)
    vec3 newPosition = position + normal * (pulse + noise);
    
    vElevation = pulse + noise;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Ajustar el tamaño de las partículas basándose en la distancia a la cámara (perspectiva)
    // Se añade un épsilon de seguridad (0.01) para prevenir divisiones por cero o valores NaN que causen Context Lost
    float safeZ = max(0.01, -mvPosition.z);
    gl_PointSize = (6.0 + clamp(uBass, 0.0, 1.0) * 10.0) * (3.0 / safeZ);
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
    vec3 colorLeft = vec3(0.0, 0.8, 1.0);     // Cian Neón
    vec3 colorRight = vec3(1.0, 0.35, 0.0);    // Naranja Cobre Neón
    
    // Mezcla suave entre izquierda y derecha basada en la coordenada X de la partícula
    float mixFactor = smoothstep(-1.0, 1.0, vXPosition);
    vec3 baseColor = mix(colorLeft, colorRight, mixFactor);
    
    // Añadir modulación de color y resplandor basado en la deformación (pulsación)
    // Se limita el brillo multiplicador máximo para evitar sobreexposición a blanco (blowout)
    float safeElevation = clamp(vElevation, 0.0, 1.0);
    float safeBass = clamp(uBass, 0.0, 1.0);
    vec3 glowColor = baseColor * (0.85 + safeElevation * 1.2 + safeBass * 0.6);
    
    // Atenuación suave en los bordes de cada partícula individual para un efecto de orbe difuso
    float alpha = smoothstep(0.25, 0.0, dist);
    
    gl_FragColor = vec4(glowColor, alpha * 0.7);
  }
`;

// 2. Componente interno que renderiza la geometría y los Shaders (dentro del Canvas de R3F)
function InteractivePoints({ analyserNode, isPlaying, bassIntensity }: HoloSphereVisualizerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Crear la geometría de la esfera con radio reducido para evitar zoom excesivo
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(1.2, 48, 48);
  }, []);

  // Uniforms del shader personalizado
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0.0 },
      uBass: { value: 0.0 },
      uFreqs: { value: new Float32Array(64) }
    };
  }, []);

  // Limpieza estricta de memoria de la GPU al desmontar el componente
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [geometry]);

  // Bucle de animación de R3F (useFrame se ejecuta en la GPU a 60+ FPS)
  useFrame((state) => {
    const { clock } = state;
    const elapsedTime = clock.getElapsedTime();
    
    if (materialRef.current) {
      // 1. Actualizar el tiempo global
      materialRef.current.uniforms.uTime.value = elapsedTime;
      
      // 2. Obtener datos reales de la Web Audio API si está activa y tiene un estado de reproducción válido
      let audioDataAvailable = false;
      
      if (analyserNode && isPlaying) {
        try {
          const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
          analyserNode.getByteFrequencyData(dataArray);
          
          if (dataArray.length > 0 && dataArray[0] !== undefined) {
            audioDataAvailable = true;
            
            // Extraer la intensidad de bajos (primeras 8 bandas de frecuencia)
            let bassSum = 0;
            for (let i = 0; i < 8; i++) {
              bassSum += dataArray[i];
            }
            const currentBass = bassSum / (8 * 255); // Normalizado de 0.0 a 1.0
            
            // Estabilización matemática estricta contra NaN/Infinity
            materialRef.current.uniforms.uBass.value = isNaN(currentBass) || !isFinite(currentBass) 
              ? 0.0 
              : Math.min(1.0, Math.max(0.0, currentBass));
            
            // Mapear 64 bandas de frecuencia a los uniforms del shader
            const freqs = materialRef.current.uniforms.uFreqs.value as Float32Array;
            for (let i = 0; i < 64; i++) {
              const val = dataArray[i * 2] / 255.0;
              freqs[i] = isNaN(val) || !isFinite(val) ? 0.0 : val;
            }
          }
        } catch (e) {
          // Captura silenciosa de errores de audio para evitar caídas de WebGL
          audioDataAvailable = false;
        }
      }
      
      // Fallback de simulación senoidal fluida de respaldo si el audio no está listo o falló
      if (!audioDataAvailable) {
        const t = elapsedTime * 1.5;
        const simulatedBass = 0.12 + Math.sin(t) * 0.06 + Math.cos(t * 1.3) * 0.04;
        materialRef.current.uniforms.uBass.value = simulatedBass;
        
        const freqs = materialRef.current.uniforms.uFreqs.value as Float32Array;
        for (let i = 0; i < 64; i++) {
          const val = (0.08 + Math.sin(t + i * 0.12) * 0.05) * (1.0 - i / 64.0);
          freqs[i] = val;
        }
      }
    }
    
    // Rotación constante y suave del orbe esférico completo
    if (pointsRef.current) {
      const speedFactor = 0.12 + (materialRef.current?.uniforms.uBass.value || 0.0) * 0.35;
      pointsRef.current.rotation.y = elapsedTime * speedFactor;
      pointsRef.current.rotation.x = Math.sin(elapsedTime * 0.08) * 0.12;
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
    <div className="w-full h-full relative flex items-center justify-center bg-transparent">
      {/* Canvas de React Three Fiber con Transparencia Estricta y Rendimiento Óptimo */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }} // Cámara alejada para ver la esfera en perspectiva real
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          premultipliedAlpha: false
        }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        {/* Iluminación de ambiente sutil */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        
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
          rotateSpeed={0.5}
          autoRotate={false}
        />
        
        {/* Post-procesamiento: Bloom controlado para evitar sobreexposición */}
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={0.65}          // Brillo balanceado elegante
            luminanceThreshold={0.2}  // Umbral ajustado para mantener naranja/cian definidos
            luminanceSmoothing={0.8}  // Suavizado del resplandor
            mipmapBlur={true}         // Glow suave fotorrealista
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
