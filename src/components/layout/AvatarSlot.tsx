import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AvatarSlotProps {
  src: string;
  className?: string;
}

export function AvatarSlot({ src, className = 'h-11 w-11' }: AvatarSlotProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  return (
    <div
      className={`${className} shrink-0 overflow-hidden rounded-full bg-emerald-100 shadow-[0_4px_14px_rgba(16,185,129,0.2)] ring-2 ring-white`}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center">
          <Sparkles className="h-1/2 w-1/2 text-emerald-500" />
        </div>
      ) : (
        <img
          src={src}
          alt="GREAK"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover object-center"
        />
      )}
    </div>
  );
}
