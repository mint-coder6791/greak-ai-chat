import { useState } from 'react';

interface StickerImageProps {
  label: string;
  src: string;
}

export function StickerImage({ label, src }: StickerImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-xs text-slate-500">表情「{label}」加载失败</span>;
  }

  return (
    <img
      src={src}
      alt={label}
      onError={() => setFailed(true)}
      className="h-[120px] max-h-[120px] w-[120px] max-w-[120px] rounded-2xl object-contain"
    />
  );
}
