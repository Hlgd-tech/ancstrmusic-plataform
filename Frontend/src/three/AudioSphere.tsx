import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AudioSphereProps {
  isPlaying: boolean;
  progress: number;
  analyserNode?: AnalyserNode | null;
}

// ── AUDIO-DRIVEN ICOSAHEDRON WIREFRAME ──────────────────────────────────
// UNA sola malla persistente: Icosaedro de alambre
// Material Base: <meshStandardMaterial wireframe={true} transparent={true} opacity={0.8} />
// Standby (!isPlaying): Color Cian (#002bb8), rotación lenta constante.
// Playing (isPlaying): NO desaparece. Bass altera escala dinámica.
//                      Velocidad rotación aumenta. Emissive transiciona a Naranja Magma (#ff5500) en picos.
export default function AudioSphere({ isPlaying, progress, analyserNode }: AudioSphereProps) {
  const icoRef = useRef<THREE.Mesh>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Mutable state (no reactiva, lee dentro de useFrame)
  const bassRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Base geometry: Icosaedro
  const icoGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.6, 1), []);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const playing = isPlayingRef.current;

    // Obtener AnalyserNode
    const analyser = analyserNode || (window as any).__AUDIO_ANALYSER__;
    let bass = 0;
    if (analyser && playing) {
      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArrayRef.current);

      // Bass: primeros 12 bins ~ 20-150Hz
      let bassSum = 0;
      const bassBins = 12;
      for (let i = 0; i < bassBins; i++) {
        bassSum += dataArrayRef.current[i];
      }
      bass = (bassSum / bassBins) / 255;
    }
    bassRef.current = THREE.MathUtils.lerp(bassRef.current, bass, delta * 15);

    const bassVal = bassRef.current;
    const bassScale = 1 + bassVal * 0.55;

    // Material: Base wireframe
    const mat = icoRef.current?.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.opacity = 0.8;
      mat.transparent = true;
      mat.wireframe = true;

      if (playing) {
        // Playing: Bass escala dinámica
        if (icoRef.current) {
          icoRef.current.scale.set(bassScale, bassScale, bassScale);
          // Rotación rápida según energía
          icoRef.current.rotation.y += delta * 0.8 * (1 + bassVal * 2.5);
        }
        // Emissive: Transición desde Cian a Naranja Magma según picos de volumen
        // Bass alto → Naranja Magma (#ff5500)
        // Bass bajo → Cian (#002bb8)
        const t = THREE.MathUtils.clamp(bassVal, 0, 1);
        const r = 1 - t; // Cian component
        const g = (1 - t) * 0.93 + t * 0.33;
        const b = 1 - t; // Cian component
        mat.color.setRGB(r, g, b);
        mat.emissive.set(bassVal > 0.8 ? '#ff5500' : '#002bb8');
        mat.emissiveIntensity = 2 + bassVal * 6;
      } else {
        // Standby: Sin escala, rotación lenta constante
        if (icoRef.current) {
          icoRef.current.scale.set(1, 1, 1);
          icoRef.current.rotation.y += delta * 0.1;
        }
        // Color Cian constante
        mat.color.set('#002bb8');
        mat.emissive.set('#0088ff');
        mat.emissiveIntensity = 1.5;
      }
    }
  });

  // ── UNA sola malla persistente: Icosaedro de alambre ────────────────────
  return (
    <mesh ref={icoRef} geometry={icoGeometry}>
        <meshStandardMaterial
        wireframe={true}
        transparent={true}
        opacity={0.8}
          color="#002bb8"
          emissive="#0088ff"
        emissiveIntensity={1.5}
          roughness={0}
          metalness={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
  );
}

