import type { SpeechStatus } from '@/hooks/useSpeech';

type IndicatorState = 'idle' | 'thinking' | SpeechStatus;

const STATE_STYLES: Record<IndicatorState, { label: string; dot: string; pulse: boolean; ripple: boolean }> = {
  idle: { label: '待命中', dot: 'bg-emerald-400', pulse: false, ripple: false },
  thinking: { label: 'AI 正在思考', dot: 'bg-emerald-400', pulse: true, ripple: true },
  speaking: { label: 'AI 正在说话', dot: 'bg-teal-400', pulse: true, ripple: true },
  paused: { label: '朗读已暂停', dot: 'bg-amber-400', pulse: false, ripple: false },
};

interface StatusIndicatorProps {
  state: IndicatorState;
}

export function StatusIndicator({ state }: StatusIndicatorProps) {
  const style = STATE_STYLES[state];
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center gap-2 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-slate-600"
    >
      <span className="relative flex h-2.5 w-2.5">
        {style.ripple && <span className={`absolute inset-0 rounded-full ${style.dot} animate-ripple`} />}
        <span className={`relative h-2.5 w-2.5 rounded-full ${style.dot} ${style.pulse ? 'animate-breathe' : ''}`} />
      </span>
      <span className="hidden sm:inline">{style.label}</span>
    </div>
  );
}
