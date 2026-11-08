import { useState } from 'react';
import { ImagePlus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { MAX_STICKER_BYTES, STICKER_LABELS, STICKER_TAGS, type StickerTag } from '@/lib/stickers';
import { readImageAsDataUrl } from '@/lib/imageFile';
import { errorMessage } from '@/lib/errors';
import type { StickerControls } from '@/hooks/useStickerLibrary';
import { StickerImage } from '@/components/chat/StickerImage';
import { Section, buttonClass } from '@/components/control/ui';

type StickerNotice = { tone: 'ok' | 'error'; text: string } | null;

interface StickerSectionProps {
  stickers: StickerControls;
}

export function StickerSection({ stickers }: StickerSectionProps) {
  const [notice, setNotice] = useState<StickerNotice>(null);

  const handleUpload = async (tag: StickerTag, file: File) => {
    const label = STICKER_LABELS[tag];
    if (!file.type.startsWith('image/')) {
      setNotice({ tone: 'error', text: '请选择图片文件' });
      return;
    }
    if (file.size > MAX_STICKER_BYTES) {
      setNotice({ tone: 'error', text: `「${label}」图片请小于 300KB` });
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      const saved = stickers.setSticker(tag, dataUrl);
      setNotice(
        saved
          ? { tone: 'ok', text: `已保存「${label}」表情` }
          : { tone: 'error', text: '浏览器存储空间不足，请删除部分表情后再试' },
      );
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    }
  };

  const handleRemove = (tag: StickerTag) => {
    const removed = stickers.removeSticker(tag);
    setNotice(
      removed
        ? { tone: 'ok', text: `已移除「${STICKER_LABELS[tag]}」表情，将显示默认表情` }
        : { tone: 'error', text: '移除失败，请稍后再试' },
    );
  };

  return (
    <Section
      index={7}
      icon={ImageIcon}
      title="表情包库"
      description="上传专属表情，AI 发送 [STICKER:标签] 时会显示"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STICKER_TAGS.map((tag) => {
          const src = stickers.library[tag];
          return (
            <div
              key={tag}
              className="flex flex-col items-center gap-2 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-3"
            >
              <div className="flex h-[120px] w-full items-center justify-center overflow-hidden">
                <StickerImage tag={tag} src={src} />
              </div>
              <p className="text-xs font-medium text-slate-700">
                {STICKER_LABELS[tag]}
                <span className="ml-1 text-[11px] text-slate-500">{tag}</span>
              </p>
              <div className="flex w-full gap-2">
                <label className={`${buttonClass} flex-1 cursor-pointer px-2 py-2 text-xs`}>
                  <ImagePlus className="h-3.5 w-3.5" />
                  {src ? '更换' : '上传'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void handleUpload(tag, file);
                    }}
                  />
                </label>
                {src && (
                  <button
                    type="button"
                    onClick={() => handleRemove(tag)}
                    aria-label={`移除${STICKER_LABELS[tag]}表情`}
                    className={`${buttonClass} px-2 py-2`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {notice && (
        <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`text-xs ${notice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {notice.text}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-slate-500">
        图片保存在本浏览器中，建议使用 300KB 以内的正方形图片。未上传的表情会显示默认表情符号。
      </p>
    </Section>
  );
}
