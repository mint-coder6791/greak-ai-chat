import { useEffect, useState } from 'react';

const MAX_STEP = 12;
const SLOW_DIVISOR = 6;

export function useTypewriter(target: string, active: boolean): string {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!active || shown >= target.length) return;
    const backlog = target.length - shown;
    const step = Math.min(MAX_STEP, Math.max(1, Math.ceil(backlog / SLOW_DIVISOR)));
    const frame = requestAnimationFrame(() => setShown((s) => Math.min(target.length, s + step)));
    return () => cancelAnimationFrame(frame);
  }, [active, shown, target]);

  return active ? target.slice(0, shown) : target;
}
