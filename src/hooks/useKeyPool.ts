import { useCallback, useEffect, useState } from 'react';
import type { KeySlot } from '@/types';
import { loadKeyPool, saveKeyPool } from '@/lib/storage';

export function useKeyPool() {
  const [state, setState] = useState(loadKeyPool);

  useEffect(() => {
    saveKeyPool(state);
  }, [state]);

  const setActiveSlot = useCallback((activeSlot: KeySlot) => {
    setState((prev) => ({ ...prev, activeSlot }));
  }, []);

  const recordUsage = useCallback((slot: KeySlot, tokens: number) => {
    setState((prev) => ({
      ...prev,
      usedTokens: { ...prev.usedTokens, [slot]: prev.usedTokens[slot] + tokens },
    }));
  }, []);

  const resetUsage = useCallback((slot: KeySlot) => {
    setState((prev) => ({ ...prev, usedTokens: { ...prev.usedTokens, [slot]: 0 } }));
  }, []);

  return { ...state, setActiveSlot, recordUsage, resetUsage };
}

export type KeyPoolControls = ReturnType<typeof useKeyPool>;
