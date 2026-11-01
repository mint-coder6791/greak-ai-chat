import { useState } from 'react';
import { ImagePlus, ImageOff } from 'lucide-react';
import type { PortraitControls } from '@/hooks/usePortrait';
import { errorMessage } from '@/lib/errors';
import { saveLoadingImage } from '@/lib/loadingImage';
import { readImageAsDataUrl } from '@/lib/imageFile';
import { Section, buttonClass } from '@/components/control/ui';

type AppearanceNotice = { tone: 'ok' | 'error'; text: string } | null;

interface AppearanceSectionProps {
  portrait: PortraitControls;
}

export function AppearanceSection({ portrait }: AppearanceSectionProps) {
  const [notice, setNotice] = useState<AppearanceNotice>(null);
  const [busy, setBusy] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setNotice({ tone: 'error', text: '请选择图片文件' });
      return;
    }
    setBusy(true);
    try {
      await portrait.setPortrait(file);
      setNotice({ tone: 'ok', text: '形象已更新' });
    } catch (err) {
      setNotice({ tone: 'error', text: `形象保存失败：${errorMessage(err)}` });
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await portrait.clearPortrait();
      setNotice({ tone: 'ok', text: '已恢复默认形象' });
    } catch (err) {
      setNotice({ tone: 'error', text: `清除失败：${errorMessage(err)}` });
    } finally {
      setBusy(false);
    }
  };

  const handleLoadingImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setNotice({ tone: 'error', text: '请选择图片文件' });
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setNotice(
        saveLoadingImage(dataUrl)
          ? { tone: 'ok', text: '加载图已更新，下次打开时生效' }
          : { tone: 'error', text: '加载图太大，浏览器存储放不下，请换一张更小的图片' },
      );
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const hasCustomPortrait = portrait.portraitUrl !== null;

  return (
    <Section index={6} icon={ImagePlus} title="外观设置" description="上传自己的形象，用作侧边栏与聊天头像">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          className={`${buttonClass} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}
          aria-disabled={busy}
        >
          <ImagePlus className="h-4 w-4" />
          上传自定义形象
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handleUpload(file);
            }}
          />
        </label>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void handleClear()}
          disabled={!hasCustomPortrait || busy}
        >
          <ImageOff className="h-4 w-4" />
          恢复默认形象
        </button>
      </div>
      <label
        className={`${buttonClass} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={busy}
      >
        <ImagePlus className="h-4 w-4" />
        上传自定义加载图
        <input
          id="loading-upload"
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleLoadingImage(file);
          }}
        />
      </label>
      {notice && (
        <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`text-xs ${notice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {notice.text}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-slate-500">
        形象图保存在本浏览器的数据库中，不限制大小，刷新后依然保留。
      </p>
    </Section>
  );
}
