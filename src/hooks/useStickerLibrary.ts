import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StickerItem, StickerLibrary } from '@/lib/stickers';
import { LEGACY_STICKER_LABELS } from '@/lib/stickers';
import { deleteSticker, listStickers, putSticker } from '@/lib/stickerStore';
import { clearLegacyStickers, readLegacyStickers } from '@/lib/storage';
import { imageSourceToDataUrl } from '@/lib/imageFile';
import { errorMessage } from '@/lib/errors';

async function migrateLegacyStickers(): Promise<void> {
  const entries = Object.entries(readLegacyStickers());
  if (entries.length === 0) return;
  const existing = new Set((await listStickers()).map((item) => item.label));
  for (const [tag, dataUrl] of entries) {
    const label = LEGACY_STICKER_LABELS[tag];
    if (!label || existing.has(label)) continue;
    await putSticker({ label, dataUrl, createdAt: Date.now() });
  }
  clearLegacyStickers();
}

export function useStickerLibrary() {
  const [items, setItems] = useState<StickerItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setItems(await listStickers());
  }, []);

  useEffect(() => {
    let cancelled = false;
    migrateLegacyStickers()
      .then(() => listStickers())
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const library: StickerLibrary = useMemo(
    () => Object.fromEntries(items.map((item) => [item.label, item.dataUrl])),
    [items],
  );

  const addSticker = async (label: string, source: string): Promise<void> => {
    const dataUrl = await imageSourceToDataUrl(source);
    await putSticker({ label, dataUrl, createdAt: Date.now() });
    await refresh();
  };

  const removeSticker = async (label: string): Promise<void> => {
    await deleteSticker(label);
    await refresh();
  };

  return { items, library, error, addSticker, removeSticker };
}

export type StickerControls = ReturnType<typeof useStickerLibrary>;
