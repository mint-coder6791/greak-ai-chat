import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { ImagePlus, Send, Square, X } from 'lucide-react';
import { errorMessage } from '@/lib/errors';
import { compressImageToDataUrl } from '@/lib/imageFile';

interface ComposerProps {
  busy: boolean;
  configured: boolean;
  onSend: (text: string, image?: string) => void;
  onStop: () => void;
  onOpenSettings: () => void;
}

const MAX_HEIGHT_PX = 200;

export function Composer({ busy, configured, onSend, onStop, onOpenSettings }: ComposerProps) {
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [draft]);

  const canSend = configured && !busy && (draft.trim().length > 0 || image !== null);

  const submit = () => {
    if (!canSend) return;
    onSend(draft.trim(), image ?? undefined);
    setDraft('');
    setImage(null);
    setImageError(null);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError(null);
    try {
      setImage(await compressImageToDataUrl(file));
    } catch (err) {
      setImageError(errorMessage(err));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-2">
      {!configured && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full rounded-3xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-xs text-amber-800 transition hover:bg-amber-100"
        >
          尚未配置接口信息，点击这里打开总控设置进行填写
        </button>
      )}
      {(image || imageError) && (
        <div className="flex items-center gap-3 px-1">
          {image && (
            <div className="relative shrink-0">
              <img src={image} alt="待发送的图片" className="h-16 w-16 rounded-2xl border border-emerald-100 object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="移除图片"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white shadow transition hover:bg-slate-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {imageError && <p role="alert" className="text-xs text-rose-700">{imageError}</p>}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-3xl border border-emerald-100 bg-white p-2 shadow-[0_4px_20px_rgba(16,185,129,0.08)] transition focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="上传图片"
          title="上传图片"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={draft}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，Enter 发送，Shift + Enter 换行"
          aria-label="消息输入框"
          className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none"
        />
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="停止生成"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-rose-200 text-rose-900 transition hover:bg-rose-300 active:scale-95"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="发送消息"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-3xl bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-300/40 transition hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
