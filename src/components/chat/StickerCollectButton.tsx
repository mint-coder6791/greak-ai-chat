import { useState } from 'react';
import { Check, Heart } from 'lucide-react';
import { errorMessage } from '@/lib/errors';

interface StickerCollectButtonProps {
  label: string;
  collected: boolean;
  onCollect: () => Promise<void>;
}

export function StickerCollectButton({ label, collected, onCollect }: StickerCollectButtonProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (collected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-3xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        已收藏为「{label}」
      </span>
    );
  }

  const handleClick = async () => {
    setSaving(true);
    setError(null);
    try {
      await onCollect();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-3xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-60"
      >
        <Heart className="h-3.5 w-3.5 fill-current" />
        {saving ? '收藏中…' : '收藏表情包'}
      </button>
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
