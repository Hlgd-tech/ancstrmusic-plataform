import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AudioSphereProps {
  isPlaying: boolean;
  progress: number;
  analyserNode?: AnalyserNode | null;
}

const SPHERE_RADIUS = 1.6;
const PARTICLE_COUNT = 2400;
const BAR_COUNT = 72;

// Pre-generate waveform envelope for the bar ring
const BAR_ENVELOPE = Array.from({ length: BAR_COUNT }, (_, i) => {
  return 0.15 + Math.abs(
    Math.sin(i * 0.7) * 0.35 +
    Math.sin(i * 0.25) * 0.25 +
    Math.sin(i * 1.8) * 0.12
  );
});

export default function AudioSphere({ isPlaying, progress, analyserNode }: AudioSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  // Buffer de datos de frecuencia para el analizador de audio
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Mutable animation state (not reactive – read inside useFrame)
  const energyRef = useRef(0);
  const bassEnergyRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const progressRef = useRef(progress);
  isPlayingRef.current = isPlaying;
  progressRef.current = progress;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const instanceColor = useMemo(() => new THREE.Color(), []);

  // ── Gravity Floating Particles (Anillos -> Esfera) ───────────────
  const GRAVITY_PARTICLE_COUNT = 150;
  const gravityParticlesRef = useRef<THREE.Points>(null);
  
  // Datos iniciales de las partículas de gravedad
  const [gravityPositions, gravityData] = useMemo(() => {
    const pos = new Float32Array(GRAVITY_PARTICLE_COUNT * 3);
    const data = new Float32Array(GRAVITY_PARTICLE_COUNT * 3); // [velocidad_base, fase, radio_orbita]
    
    for (let i = 0; i < GRAVITY_PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 2.2; // Distribuidas entre el radio de la esfera y el borde de los anillos
      
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = -2.8 + Math.random() * 2.5; // Alturas iniciales escalonadas
      pos[i * 3 + 2] = Math.sin(angle) * r;
      
      data[i * 3] = 0.15 + Math.random() * 0.35; // Velocidad base de ascenso
      data[i * 3 + 1] = Math.random() * Math.PI * 2; // Fase de oscilación horizontal
      data[i * 3 + 2] = r; // Guardar radio para órbita
    }
    return [pos, data];
  }, []);

  // ── Fibonacci sphere particles ──────────────────────────────────
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const goldenAngle = Math.PI * (1 + Math.sqrt(5));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(1 - (2 * i) / PARTICLE_COUNT);
      const theta = goldenAngle * i;
      const jitter = 0.06;

      const x = Math.sin(phi) * Math.cos(theta) * SPHERE_RADIUS + (Math.random() - 0.5) * jitter;
      const y = Math.cos(phi) * SPHERE_RADIUS + (Math.random() - 0.5) * jitter;
      const z = Math.sin(phi) * Math.sin(theta) * SPHERE_RADIUS + (Math.random() - 0.5) * jitter;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Left hemisphere (x < 0) → cyan; right → magma
      const normalizedX = x / SPHERE_RADIUS; // -1 to 1
      const t = (normalizedX + 1) / 2; // 0 = full cyan, 1 = full magma

      // Smooth gradient across the split
      col[i * 3] = t * 0.95;            // R
      col[i * 3 + 1] = (1 - t) * 0.82 + t * 0.22; // G
      col[i * 3 + 2] = (1 - t) * 0.95;  // B
    }
    return [pos, col];
  }, []);

  // ── Initialize instanced mesh colors ──────────────────────────
  useEffect(() => {
    if (!barsRef.current) return;
    const c = new THREE.Color();
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      const isCyan = Math.cos(angle) < 0;
      c.set(isCyan ? '#00eeff' : '#ff5500');
      barsRef.current.setColorAt(i, c);
    }
    if (barsRef.current.instanceColor) {
      barsRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  // ── Animation loop ─────────────────────────────────────────────
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const playing = isPlayingRef.current;
    const prog = progressRef.current;

    // Recuperar el AnalyserNode de la prop o el global como fallback
    const analyser = analyserNode || (window as any).__AUDIO_ANALYSER__;
    let bass = 0;
    let mid = 0;

    if (analyser && playing) {
      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArrayRef.current);

      // Calcular promedio de graves (Bass: primeros 12 bins ~ 20-150Hz)
      let bassSum = 0;
      const bassBins = 12;
      for (let i = 0; i < bassBins; i++) {
        bassSum += dataArrayRef.current[i];
      }
      bass = (bassSum / bassBins) / 255;

      // Calcular promedio de medios (Mids: bins 12 a 60 ~ 150-750Hz)
      let midSum = 0;
      const midBins = 48;
      for (let i = 12; i < 12 + midBins; i++) {
        midSum += dataArrayRef.current[i];
      }
      mid = (midSum / midBins) / 255;
    }

    // Lerp de energía con alta velocidad de respuesta para reactividad real
    const targetEnergy = playing ? (bass * 0.65 + mid * 0.35) : 0.08;
    energyRef.current = THREE.MathUtils.lerp(
      energyRef.current,
      targetEnergy,
      delta * 12.0 // Mayor velocidad de interpolación para golpes rápidos de bombo
    );
    const energy = energyRef.current;

    // Lerp de energía de graves para la escala física (Erupción)
    bassEnergyRef.current = THREE.MathUtils.lerp(
      bassEnergyRef.current,
      playing ? bass : 0,
      delta * 15.0 // Súper rápido para el "estallido" físico instantáneo
    );
    const bassEnergy = bassEnergyRef.current;

    // Física de Erupción: la esfera estalla y pulsa dinámicamente con los graves (Bass)
    const bassMultiplier = playing ? bassEnergy * 0.55 : 0;
    const eruptionScale = 1.0 + bassMultiplier;
    if (groupRef.current) {
      groupRef.current.scale.set(eruptionScale, eruptionScale, eruptionScale);
      // Rotación acelerada dinámicamente según la energía general y el bombo
      groupRef.current.rotation.y += delta * 0.04 * (1 + energy * 3.5 + bassEnergy * 2.5);
    }

    // Pulse particle opacity and size with energy
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.35 + energy * 0.55;
      mat.size = 0.022 + energy * 0.018;
    }

    // Animate waveform bar ring
    if (barsRef.current) {
      const playheadBar = Math.floor(prog * BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * Math.PI * 2;
        const r = SPHERE_RADIUS + 0.22;

        dummy.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        dummy.rotation.y = -angle;

        // Waveform height: base envelope + wave driven by progress + energy (reactiva drásticamente al Bass)
        const distFromHead = Math.abs(i - playheadBar);
        const nearBoost = Math.max(0, 1 - distFromHead / 6);
        const wavePhase = prog * Math.PI * 24;
        const wave = (Math.sin(t * 5 + i * 0.55 + wavePhase) * 0.5 + 0.5);
        // Usamos el multiplicador de energía de bajos para alterar drásticamente la altura de las barras
        const bassBoost = playing ? bassEnergy * 1.8 : 0.05;
        const h = Math.max(0.008, (BAR_ENVELOPE[i] + wave * 0.35 + nearBoost * 0.5) * (energy * 0.4 + bassBoost) * 1.1);

        dummy.scale.set(0.02, h, 0.02);
        dummy.updateMatrix();
        barsRef.current.setMatrixAt(i, dummy.matrix);

        const isCyan = Math.cos(angle) < 0;
        instanceColor.set(isCyan ? '#00eeff' : '#ff5500');
        barsRef.current.setColorAt(i, instanceColor);
      }
      barsRef.current.instanceMatrix.needsUpdate = true;
      if (barsRef.current.instanceColor) barsRef.current.instanceColor.needsUpdate = true;
    }

    // Animate holo rings (reubicados y girando lentamente en direcciones opuestas)
    const ringRefs = [ring1Ref, ring2Ref, ring3Ref];
    ringRefs.forEach((ref, i) => {
      if (!ref.current) return;
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(t * 0.8 + i * 1.4) * 0.5 + 0.5;
      // Opacidad reactiva al volumen y graves
      mat.opacity = (0.22 + energy * 0.48) * (1 - i * 0.08) * (0.7 + pulse * 0.3);
      // Brillo emisivo reactivo en tiempo real al bombo/graves (Bass)
      mat.emissiveIntensity = (2.0 + (playing ? bass * 4.5 : 0)) * (1 - i * 0.15);
      // Escala reactiva al ritmo
      const scl = 1 + pulse * 0.015 * energy + (playing ? bass * 0.04 : 0);
      ref.current.scale.set(scl, scl, scl);

      // Rotación continua lenta en direcciones opuestas para efecto de maquinaria futurista (Eje Z e Y)
      const dir = i % 2 === 0 ? 1 : -1;
      ref.current.rotation.z += delta * 0.18 * dir;
      ref.current.rotation.y += delta * 0.08 * -dir;
    });

    // Animar Partículas de Gravedad (Flujo ascendente reactivo al Bass)
    if (gravityParticlesRef.current) {
      const geo = gravityParticlesRef.current.geometry;
      const posArr = geo.attributes.position.array as Float32Array;
      
      // Velocidad de ascenso influenciada drásticamente por el Bass
      const speedMultiplier = 1.0 + (playing ? bassEnergy * 4.5 : 0);
      
      for (let i = 0; i < GRAVITY_PARTICLE_COUNT; i++) {
        const baseSpeed = gravityData[i * 3];
        const phase = gravityData[i * 3 + 1];
        const r = gravityData[i * 3 + 2];
        
        // Ascender en el eje Y
        posArr[i * 3 + 1] += delta * baseSpeed * speedMultiplier;
        
        // Sutil oscilación horizontal helicoidal (órbita lenta)
        const angle = t * 0.25 + phase;
        posArr[i * 3] = Math.cos(angle) * r;
        posArr[i * 3 + 2] = Math.sin(angle) * r;
        
        // Si la partícula pasa el centro de la esfera, se absorbe y renace abajo
        if (posArr[i * 3 + 1] > 1.2) {
          posArr[i * 3 + 1] = -2.8 - Math.random() * 0.4; // Renace debajo de los anillos
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Grupo de la Esfera y Anillo de Barras (Escalable y Reactivo) */}
      <group ref={groupRef}>
        {/* Particle sphere */}
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={0.025}
            transparent
            opacity={0.5}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Waveform bar ring (sin vertexColors y con toneMapped={false} para Bloom emisivo puro) */}
        <instancedMesh ref={barsRef} args={[undefined, undefined, BAR_COUNT]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            transparent
            opacity={1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </instancedMesh>
      </group>

      {/* Holographic ground rings - Estáticos, reubicados y expandidos para evitar colisiones */}
      <mesh ref={ring1Ref} rotation-x={Math.PI / 2} position={[0, -2.8, 0]}>
        <torusGeometry args={[3.0, 0.007, 8, 128]} />
        <meshStandardMaterial
          color="#00eeff"
          emissive="#0088ff"
          emissiveIntensity={2.5}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation-x={Math.PI / 2} position={[0, -3.0, 0]}>
        <torusGeometry args={[3.5, 0.005, 8, 128]} />
        <meshStandardMaterial
          color="#ff5500"
          emissive="#ff2200"
          emissiveIntensity={2.5}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring3Ref} rotation-x={Math.PI / 2} position={[0, -3.2, 0]}>
        <torusGeometry args={[4.0, 0.003, 8, 128]} />
        <meshStandardMaterial
          color="#00eeff"
          emissive="#0088ff"
          emissiveIntensity={2.0}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>



      {/* Sistema de Partículas de Gravedad (Flujo ascendente de datos) */}
      <points ref={gravityParticlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gravityPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#00eeff"
          size={0.018}
          transparent
          opacity={0.4 + (energyRef.current * 0.4)} // Brillar más con la energía del audio
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Subtle ambient fill from below (Estático, fuera del grupo escalable) */}
      <pointLight position={[0, -3.5, 0]} color="#ff4400" intensity={0.4} distance={5} />
      <pointLight position={[-4, 0, 0]} color="#00f0ff" intensity={0.3} distance={6} />
      <pointLight position={[4, 0, 0]} color="#ff6600" intensity={0.3} distance={6} />
    </group>
  );
}
