import { useState } from 'react';
import { Music, Upload, X } from 'lucide-react';
import type { AppSettings } from '@/types';
import type { BgmControls } from '@/hooks/useBgm';
import { Field, Section, Slider, Toggle, buttonClass, inputClass } from '@/components/control/ui';

interface BgmSectionProps {
  settings: AppSettings;
  bgm: BgmControls;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function BgmSection({ settings, bgm, onChange }: BgmSectionProps) {
  const [urlDraft, setUrlDraft] = useState(settings.bgmUrl);
  const urlChanged = urlDraft.trim() !== settings.bgmUrl;

  return (
    <Section index={5} icon={Music} title="背景音乐" description="音频直链或本地文件，智能避让朗读">
      <Field label="音频直链 URL" hint="需要是可直接播放的音频地址（mp3、ogg 等）">
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://example.com/music.mp3"
            spellCheck={false}
          />
          <button
            type="button"
            className={`${buttonClass} shrink-0`}
            disabled={!urlChanged}
            onClick={() => onChange({ bgmUrl: urlDraft.trim() })}
          >
            应用
          </button>
        </div>
      </Field>

      <div className="space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="text-xs font-medium text-slate-600">本地音频</p>
        {bgm.localFileName ? (
          <div className="flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-2">
            <span className="truncate text-sm text-slate-800">{bgm.localFileName}</span>
            <button
              type="button"
              onClick={bgm.clearLocalFile}
              aria-label="移除本地音频"
              className="rounded-2xl p-1 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">尚未选择本地文件</p>
        )}
        <label className={`${buttonClass} w-full cursor-pointer`}>
          <Upload className="h-4 w-4" />
          选择音频文件
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) bgm.loadLocalFile(file);
            }}
          />
        </label>
        <p className="text-[11px] leading-relaxed text-slate-500">
          本地文件体积较大，只在本次打开页面期间有效，刷新后需要重新选择。
        </p>
      </div>

      <Slider
        label="背景音量"
        value={settings.bgmVolume}
        min={0}
        max={1}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ bgmVolume: v })}
      />
      <Toggle
        checked={settings.bgmLoop}
        onChange={(checked) => onChange({ bgmLoop: checked })}
        label="循环播放"
      />
      <Toggle
        checked={settings.smartDucking}
        onChange={(checked) => onChange({ smartDucking: checked })}
        label="智能避让混音"
        description="AI 朗读时背景音乐平滑降至 20%，朗读结束或暂停后恢复原音量"
      />
      {bgm.error && (
        <p role="alert" className="text-xs text-rose-700">
          {bgm.error}
        </p>
      )}
    </Section>
  );
}
