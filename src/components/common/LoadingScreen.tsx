import { useEffect, useState } from 'react';
import { loadLoadingImage } from '@/lib/loadingImage';

const LOAD_MS = 2500;

const DEFAULT_LOADING_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="#34D399"/></svg>',
)}`;

interface LoadingScreenProps {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [customSrc] = useState(() => loadLoadingImage());
  const [imageFailed, setImageFailed] = useState(false);
  const src = customSrc && !imageFailed ? customSrc : DEFAULT_LOADING_ICON;

  useEffect(() => {
    const timer = window.setTimeout(onDone, LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="loading-screen fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 bg-gradient-to-br from-white to-emerald-100"
      role="status"
      aria-label="加载中"
    >
      <h1 className="text-2xl font-semibold tracking-wide text-slate-800">你来了</h1>
      <div
        className="progress-bar-container"
        style={{ position: 'relative', width: '200px', height: '8px', background: '#E5E7EB', borderRadius: '4px' }}
      >
        <div
          className="progress-fill"
          style={{
            width: '100%',
            height: '100%',
            background: '#34D399',
            borderRadius: '4px',
            animation: 'fillProgress 2.5s linear forwards',
          }}
        />
        <img
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
          style={{
            position: 'absolute',
            bottom: '10px',
            width: '80px',
            height: '80px',
            objectFit: 'cover',
            borderRadius: '10px',
            animation: 'slideImage 2.5s linear forwards',
          }}
        />
      </div>
    </div>
  );
}
