import { useState } from 'react';
import { Download } from 'lucide-react';
import { importGiphyStickers, MAX_GIPHY_IMPORT } from '@/lib/giphy';
import { errorMessage } from '@/lib/errors';
import { buttonClass, inputClass } from '@/components/control/ui';

type PanelNotice = { tone: 'ok' | 'error'; text: string } | null;

interface GiphyImportPanelProps {
  apiKey: string;
  onImported: () => void;
}

export function GiphyImportPanel({ apiKey, onImported }: GiphyImportPanelProps) {
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(MAX_GIPHY_IMPORT);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<PanelNotice>(null);
  const hasKey = apiKey.trim() !== '';
  const canImport = !busy && hasKey && query.trim() !== '';

  const handleImport = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const labels = await importGiphyStickers({ apiKey, query, limit: count });
      onImported();
      setNotice({ tone: 'ok', text: `已从 GIPHY 入库 ${labels.length} 张表情包` });
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-3">
      <p className="text-xs font-medium text-slate-700">GIPHY 搜索一键入库</p>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="英文关键词，例如 angry cat"
          spellCheck={false}
          autoComplete="off"
        />
        <div className="w-20 shrink-0">
          <input
            type="number"
            min={1}
            max={MAX_GIPHY_IMPORT}
            className={inputClass}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            aria-label="收藏数量"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => void handleImport()}
        disabled={!canImport}
        className={`${buttonClass} w-full px-2 py-2 text-xs`}
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? '正在搜索并入库…' : `搜索并一键入库（最多 ${MAX_GIPHY_IMPORT} 张）`}
      </button>
      {!hasKey && <p className="text-[11px] text-slate-500">填写上方的 GIPHY API Key 后即可搜索。</p>}
      {notice && (
        <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`text-xs ${notice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>
          {notice.text}
        </p>
      )}
    </div>
  );
}
