import { useState } from 'react';
import { STICKER_FALLBACK_EMOJI, STICKER_LABELS, type StickerTag } from '@/lib/stickers';

interface StickerImageProps {
  tag: StickerTag;
  src?: string;
}

export function StickerImage({ tag, src }: StickerImageProps) {
  const [failed, setFailed] = useState(false);
  const label = STICKER_LABELS[tag];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        onError={() => setFailed(true)}
        className="h-[120px] max-h-[120px] w-[120px] max-w-[120px] rounded-2xl object-contain"
      />
    );
  }

  return (
    <span role="img" aria-label={label} className="inline-block text-6xl leading-none">
      {STICKER_FALLBACK_EMOJI[tag]}
    </span>
  );
}
