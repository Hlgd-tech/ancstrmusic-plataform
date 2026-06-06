import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import AudioSphere from './AudioSphere';

interface AudioSphereCanvasProps {
  isPlaying: boolean;
  progress: number;
  analyserNode?: AnalyserNode | null;
}

export default function AudioSphereCanvas({ isPlaying, progress, analyserNode }: AudioSphereCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.5], fov: 58 }}
      gl={{ antialias: false, alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <AudioSphere isPlaying={isPlaying} progress={progress} analyserNode={analyserNode} />
        <EffectComposer>
          <Bloom
            intensity={isPlaying ? 2.8 : 1.4}
            luminanceThreshold={0.04}
            luminanceSmoothing={0.82}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
