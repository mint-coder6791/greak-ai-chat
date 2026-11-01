import { useCallback, useEffect, useState } from 'react';
import { clearPortraitBlob, loadPortraitBlob, savePortraitBlob } from '@/lib/portraitStore';

export function usePortrait() {
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPortraitBlob()
      .then((blob) => {
        if (!cancelled && blob) setPortraitUrl(URL.createObjectURL(blob));
      })
      .catch((err) => console.error('形象图读取失败', err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!portraitUrl) return;
    return () => URL.revokeObjectURL(portraitUrl);
  }, [portraitUrl]);

  const setPortrait = useCallback(async (blob: Blob) => {
    await savePortraitBlob(blob);
    setPortraitUrl(URL.createObjectURL(blob));
  }, []);

  const clearPortrait = useCallback(async () => {
    await clearPortraitBlob();
    setPortraitUrl(null);
  }, []);

  return { portraitUrl, setPortrait, clearPortrait };
}

export type PortraitControls = ReturnType<typeof usePortrait>;
