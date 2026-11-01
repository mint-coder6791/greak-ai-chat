import { Music, Pause, Play, Repeat } from 'lucide-react';
import type { BgmControls } from '@/hooks/useBgm';

interface BgmWidgetProps {
  bgm: BgmControls;
  volume: number;
  loop: boolean;
  onVolumeChange: (volume: number) => void;
  onLoopChange: (loop: boolean) => void;
}

export function BgmWidget({ bgm, volume, loop, onVolumeChange, onLoopChange }: BgmWidgetProps) {
  const label = bgm.playing ? '暂停背景音乐' : '播放背景音乐';
  return (
    <div
      className="glass fixed right-3 top-3 z-40 flex items-center gap-1 rounded-3xl py-1.5 pl-1.5 pr-2 md:right-5 md:top-5"
      title={bgm.error ?? undefined}
    >
      <button
        type="button"
        onClick={bgm.togglePlay}
        aria-label={label}
        className={`flex h-8 w-8 items-center justify-center rounded-3xl transition active:scale-95 ${
          bgm.playing ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {bgm.playing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
      </button>
      <Music className={`ml-1 hidden h-3.5 w-3.5 sm:block ${bgm.ducked ? 'text-emerald-600' : 'text-slate-400'}`} />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        aria-label="背景音乐音量"
        className="hidden w-20 accent-emerald-400 sm:block"
      />
      <button
        type="button"
        onClick={() => onLoopChange(!loop)}
        aria-label={loop ? '关闭循环播放' : '开启循环播放'}
        aria-pressed={loop}
        className={`flex h-8 w-8 items-center justify-center rounded-3xl transition hover:bg-emerald-50 ${
          loop ? 'text-emerald-600' : 'text-slate-400'
        }`}
      >
        <Repeat className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
