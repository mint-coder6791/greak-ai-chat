import { useState } from 'react';
import { Image as ImageIcon, ImagePlus, Trash2 } from 'lucide-react';
import { MAX_STICKER_LABEL_LENGTH, MAX_STICKER_UPLOAD_BYTES } from '@/lib/stickers';
import { readImageAsDataUrl } from '@/lib/imageFile';
import { errorMessage } from '@/lib/errors';
import type { StickerControls } from '@/hooks/useStickerLibrary';
import { Section, buttonClass, inputClass } from '@/components/control/ui';

type StickerNotice = { tone: 'ok' | 'error'; text: string } | null;

interface StickerSectionProps {
  stickers: StickerControls;
}

export function StickerSection({ stickers }: StickerSectionProps) {
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<StickerNotice>(null);
  const trimmedName = name.trim();

  const handleUpload = async (file: File) => {
    if (!trimmedName) {
      setNotice({ tone: 'error', text: '请先填写表情名称再选择图片' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setNotice({ tone: 'error', text: '请选择图片文件' });
      return;
    }
    if (file.size > MAX_STICKER_UPLOAD_BYTES) {
      setNotice({ tone: 'error', text: '表情图片请小于 5MB' });
      return;
    }
    try {
      await stickers.addSticker(trimmedName, await readImageAsDataUrl(file));
      setName('');
      setNotice({ tone: 'ok', text: `已保存「${trimmedName}」表情` });
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    }
  };

  const handleRemove = async (label: string) => {
    if (!window.confirm(`确定删除表情「${label}」吗？`)) return;
    try {
      await stickers.removeSticker(label);
      setNotice({ tone: 'ok', text: `已删除「${label}」表情` });
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    }
  };

  const shownNotice: StickerNotice =
    notice ?? (stickers.error ? { tone: 'error', text: stickers.error } : null);

  return (
    <Section
      index={7}
      icon={ImageIcon}
      title="表情包库"
      description="收藏和上传的表情都保存在这里，AI 可以用 [STICKER: 名称] 直接调用"
    >
      <div className="space-y-2 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-3">
        <input
          className={inputClass}
          value={name}
          maxLength={MAX_STICKER_LABEL_LENGTH}
          onChange={(e) => setName(e.target.value)}
          placeholder="表情名称，例如：开心"
          spellCheck={false}
          autoComplete="off"
        />
        <label
          className={`${buttonClass} w-full cursor-pointer px-2 py-2 text-xs ${trimmedName ? '' : 'pointer-events-none opacity-50'}`}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          选择图片并保存
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={!trimmedName}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handleUpload(file);
            }}
          />
        </label>
      </div>

      {stickers.items.length === 0 ? (
        <p className="text-xs text-slate-500">还没有表情，可以在聊天中收藏，也可以在这里上传。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stickers.items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-3"
            >
              <div className="flex h-[120px] w-full items-center justify-center overflow-hidden">
                <img
                  src={item.dataUrl}
                  alt={item.label}
                  className="h-[120px] max-h-[120px] w-[120px] max-w-[120px] rounded-2xl object-contain"
                />
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-slate-700">{item.label}</p>
                <button
                  type="button"
                  onClick={() => void handleRemove(item.label)}
                  aria-label={`删除表情${item.label}`}
                  className={`${buttonClass} px-2 py-2`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shownNotice && (
        <p
          role={shownNotice.tone === 'error' ? 'alert' : 'status'}
          className={`text-xs ${shownNotice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}
        >
          {shownNotice.text}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-slate-500">
        表情图片保存在本浏览器中，支持透明背景的 PNG。收藏的表情会立即生效，AI 之后可以免费调用。
      </p>
    </Section>
  );
}
