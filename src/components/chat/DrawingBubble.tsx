import { Palette } from 'lucide-react';
import { AvatarSlot } from '@/components/layout/AvatarSlot';

interface DrawingBubbleProps {
  avatarSrc: string;
}

export function DrawingBubble({ avatarSrc }: DrawingBubbleProps) {
  return (
    <div className="flex animate-fade-in-up gap-3">
      <AvatarSlot src={avatarSrc} className="mt-1 h-9 w-9" />
      <div
        role="status"
        aria-label="GREAK 正在画画"
        className="flex items-center gap-3 rounded-3xl rounded-tl-none bg-white px-4 py-3 text-[15px] text-slate-700 shadow-[0_2px_12px_rgba(15,23,42,0.08)]"
      >
        <Palette className="h-4 w-4 shrink-0 animate-breathe text-emerald-500" />
        <span>GREAK 正在画画...</span>
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-emerald-100">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
        </span>
      </div>
    </div>
  );
}
