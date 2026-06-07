import { Suspense } from 'react';
import AudioSphereCanvas from '../../three/AudioSphereCanvas';

interface AICoreProps {
  isPlaying: boolean;
  progress: number;
  analyserNode?: AnalyserNode | null;
}

export default function AICore({ isPlaying, progress, analyserNode }: AICoreProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-white/20 tracking-[0.3em] uppercase">Initializing Core...</span>
        </div>
      }>
        <AudioSphereCanvas
          isPlaying={isPlaying}
          progress={progress}
          analyserNode={analyserNode}
        />
      </Suspense>
    </div>
  );
}
