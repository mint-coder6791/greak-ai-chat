import { useState } from 'react';
import { Live2DStage, type Live2DStatus } from '@/components/chat/Live2DStage';
import { LIVE2D_MODEL_URL } from '@/lib/live2dLoader';

const PORTRAIT_MASK =
  'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)';

interface GreakPortraitProps {
  src: string;
  showWelcome: boolean;
}

export function GreakPortrait({ src, showWelcome }: GreakPortraitProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [live2dStatus, setLive2dStatus] = useState<Live2DStatus>('loading');

  if (failedSrc === src) {
    if (!showWelcome) return null;
    return (
      <div className="flex h-full w-[300px] flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-xl font-semibold text-slate-800">你来了。</h2>
        <p className="max-w-xs text-sm leading-relaxed text-slate-500">想起我了？还是遇到什么麻烦了？</p>
      </div>
    );
  }

  return (
    <div
      id="avatar-container"
      className="relative w-full h-[50vh] max-h-[500px] md:h-[65vh] md:max-h-none flex justify-center items-end overflow-hidden"
      style={{ animation: 'portraitBreathe 4s ease-in-out infinite alternate' }}
    >
      <Live2DStage modelUrl={LIVE2D_MODEL_URL} onStatusChange={setLive2dStatus} />
      {live2dStatus !== 'ready' && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setFailedSrc(src)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            WebkitMaskImage: PORTRAIT_MASK,
            maskImage: PORTRAIT_MASK,
            WebkitMaskComposite: 'source-in',
            maskComposite: 'intersect',
          }}
        />
      )}
    </div>
  );
}
