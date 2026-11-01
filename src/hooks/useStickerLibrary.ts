import { useState } from 'react';
import type { StickerLibrary, StickerTag } from '@/lib/stickers';
import { loadStickers, saveStickers } from '@/lib/storage';

export function useStickerLibrary() {
  const [library, setLibrary] = useState<StickerLibrary>(loadStickers);

  const commit = (next: StickerLibrary): boolean => {
    if (!saveStickers(next)) return false;
    setLibrary(next);
    return true;
  };

  const setSticker = (tag: StickerTag, dataUrl: string): boolean => commit({ ...library, [tag]: dataUrl });

  const removeSticker = (tag: StickerTag): boolean => {
    const next = { ...library };
    delete next[tag];
    return commit(next);
  };

  return { library, setSticker, removeSticker };
}

export type StickerControls = ReturnType<typeof useStickerLibrary>;
