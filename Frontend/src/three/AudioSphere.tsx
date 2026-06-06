import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AudioSphereProps {
  isPlaying: boolean;
  progress: number;
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

export default function AudioSphere({ isPlaying, progress }: AudioSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  // Mutable animation state (not reactive – read inside useFrame)
  const energyRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const progressRef = useRef(progress);
  isPlayingRef.current = isPlaying;
  progressRef.current = progress;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const instanceColor = useMemo(() => new THREE.Color(), []);

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

    // Lerp audio energy
    energyRef.current = THREE.MathUtils.lerp(
      energyRef.current,
      playing ? 1.0 : 0.08,
      delta * 2.2
    );
    const energy = energyRef.current;

    // Rotate whole group
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04 * (1 + energy * 1.2);
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

        // Waveform height: base envelope + wave driven by progress + energy
        const distFromHead = Math.abs(i - playheadBar);
        const nearBoost = Math.max(0, 1 - distFromHead / 6);
        const wavePhase = prog * Math.PI * 24;
        const wave = (Math.sin(t * 5 + i * 0.55 + wavePhase) * 0.5 + 0.5);
        const h = Math.max(0.008, (BAR_ENVELOPE[i] + wave * 0.35 + nearBoost * 0.5) * energy * 0.75);

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

    // Animate holo rings
    const ringRefs = [ring1Ref, ring2Ref, ring3Ref];
    ringRefs.forEach((ref, i) => {
      if (!ref.current) return;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(t * 0.8 + i * 1.4) * 0.5 + 0.5;
      mat.opacity = (0.1 + energy * 0.28) * (1 - i * 0.08) * (0.7 + pulse * 0.3);
      const scl = 1 + pulse * 0.015 * energy;
      ref.current.scale.set(scl, scl, scl);
    });
  });

  return (
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

      {/* Waveform bar ring */}
      <instancedMesh ref={barsRef} args={[undefined, undefined, BAR_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Holographic ground rings */}
      <mesh ref={ring1Ref} rotation-x={Math.PI / 2} position={[0, -1.55, 0]}>
        <torusGeometry args={[1.85, 0.007, 8, 128]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation-x={Math.PI / 2} position={[0, -1.65, 0]}>
        <torusGeometry args={[2.2, 0.005, 8, 128]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring3Ref} rotation-x={Math.PI / 2} position={[0, -1.75, 0]}>
        <torusGeometry args={[2.55, 0.003, 8, 128]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle ambient fill from below */}
      <pointLight position={[0, -2.5, 0]} color="#ff4400" intensity={0.4} distance={5} />
      <pointLight position={[-3, 0, 0]} color="#00f0ff" intensity={0.3} distance={6} />
      <pointLight position={[3, 0, 0]} color="#ff6600" intensity={0.3} distance={6} />
    </group>
  );
}
