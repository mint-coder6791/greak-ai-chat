import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { AppSettings, ChatStore } from '@/types';
import type { SpeechControls } from '@/hooks/useSpeech';
import type { BgmControls } from '@/hooks/useBgm';
import type { KeyPoolControls } from '@/hooks/useKeyPool';
import type { StickerControls } from '@/hooks/useStickerLibrary';
import type { PortraitControls } from '@/hooks/usePortrait';
import type { ImportedBackup } from '@/lib/backup';
import { ModelSection } from '@/components/control/ModelSection';
import { VisionSection } from '@/components/control/VisionSection';
import { ImageSection } from '@/components/control/ImageSection';
import { PersonaMemorySection } from '@/components/control/PersonaMemorySection';
import { SpeechSection } from '@/components/control/SpeechSection';
import { BgmSection } from '@/components/control/BgmSection';
import { StickerSection } from '@/components/control/StickerSection';
import { AppearanceSection } from '@/components/control/AppearanceSection';
import { DebugSection } from '@/components/control/DebugSection';

interface ControlCenterProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  chat: ChatStore;
  onImportBackup: (data: ImportedBackup) => void;
  speech: SpeechControls;
  bgm: BgmControls;
  keyPool: KeyPoolControls;
  stickers: StickerControls;
  portrait: PortraitControls;
}

function PortraitBackdrop() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src="/greak.png"
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-top opacity-30 blur-[2px]"
    />
  );
}

export function ControlCenter({
  open,
  onClose,
  settings,
  updateSettings,
  chat,
  onImportBackup,
  speech,
  bgm,
  keyPool,
  stickers,
  portrait,
}: ControlCenterProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-emerald-900/10 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="总控设置"
        aria-hidden={!open}
        className={`glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-emerald-100 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-emerald-100">
          <PortraitBackdrop />
          <div className="relative flex items-center justify-between px-5 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">总控设置</h2>
              <p className="text-xs text-slate-500">所有修改会自动保存</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭设置"
              className="rounded-3xl bg-white/80 p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <ModelSection settings={settings} keyPool={keyPool} onChange={updateSettings} />
          <VisionSection settings={settings} onChange={updateSettings} />
          <ImageSection settings={settings} onChange={updateSettings} />
          <PersonaMemorySection
            settings={settings}
            chat={chat}
            onChange={updateSettings}
            onImportBackup={onImportBackup}
          />
          <SpeechSection settings={settings} speech={speech} onChange={updateSettings} />
          <BgmSection settings={settings} bgm={bgm} onChange={updateSettings} />
          <StickerSection
            stickers={stickers}
            giphyApiKey={settings.giphyApiKey}
            onGiphyApiKeyChange={(giphyApiKey) => updateSettings({ giphyApiKey })}
          />
          <AppearanceSection portrait={portrait} />
          <DebugSection settings={settings} onChange={updateSettings} />
        </div>
      </aside>
    </>
  );
}
