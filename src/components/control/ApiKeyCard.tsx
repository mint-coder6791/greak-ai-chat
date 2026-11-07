import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Plug, RotateCcw } from 'lucide-react';
import { errorMessage } from '@/lib/errors';
import { requestCompletion } from '@/lib/openai';
import { quotaLevel, type QuotaLevel } from '@/lib/keyPool';
import { Field, buttonClass, inputClass } from '@/components/control/ui';

interface ApiKeyCardProps {
  label: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  quota: number;
  used: number;
  active: boolean;
  onKeyChange: (value: string) => void;
  onQuotaChange: (value: number) => void;
  onResetUsage: () => void;
}

type TestState = { status: 'idle' } | { status: 'testing' } | { status: 'ok' } | { status: 'error'; message: string };

const LEVEL_STYLES: Record<QuotaLevel, { dot: string; bar: string; text: string; label: string }> = {
  unset: { dot: 'bg-slate-300', bar: 'bg-slate-300', text: 'text-slate-500', label: '未设置额度' },
  normal: { dot: 'bg-emerald-400', bar: 'bg-emerald-400', text: 'text-emerald-700', label: '额度充足' },
  warning: { dot: 'bg-amber-400', bar: 'bg-amber-400', text: 'text-amber-700', label: '已用超过 80%' },
  critical: { dot: 'bg-rose-400', bar: 'bg-rose-400', text: 'text-rose-700', label: '该 Key 额度即将耗尽，请准备切换' },
};

function formatTokens(value: number): string {
  return value >= 10000 ? `${(value / 10000).toFixed(1)} 万` : `${value}`;
}

export function ApiKeyCard({
  label,
  apiKey,
  baseUrl,
  model,
  quota,
  used,
  active,
  onKeyChange,
  onQuotaChange,
  onResetUsage,
}: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>({ status: 'idle' });
  const level = quotaLevel(used, quota);
  const style = LEVEL_STYLES[level];
  const percent = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;

  const runTest = async () => {
    const key = apiKey.trim();
    if (!key || !model.trim() || !baseUrl.trim()) {
      setTest({ status: 'error', message: '请先填写 API Base URL、API Key 和模型名称' });
      return;
    }
    setTest({ status: 'testing' });
    try {
      await requestCompletion({
        config: { baseUrl, apiKey: key, model: model.trim() },
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 8,
      });
      setTest({ status: 'ok' });
    } catch (err) {
      setTest({ status: 'error', message: errorMessage(err) });
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span role="status" aria-label={`${label}：${style.label}`} className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
          <span className="text-sm font-medium text-slate-800">{label}</span>
          {active && (
            <span className="rounded-3xl bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium text-emerald-800">当前使用</span>
          )}
        </div>
        <span className={`text-[11px] ${style.text}`}>{style.label}</span>
      </div>

      <Field label="API Key">
        <div className="relative">
          <input
            className={`${inputClass} pr-11`}
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="sk-..."
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? `隐藏${label}` : `显示${label}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl p-1.5 text-slate-500 transition hover:bg-emerald-100 hover:text-slate-800"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Field label="预期总额度（Token）" hint="填写该 Key 的预计总额度，留空或填 0 则不做用量提醒">
        <input
          type="number"
          min={0}
          step={100000}
          className={inputClass}
          value={quota || ''}
          placeholder="例如 1000000"
          onChange={(e) => onQuotaChange(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
        />
      </Field>

      {quota > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              估算已用 {formatTokens(used)} / {formatTokens(quota)}
            </span>
            <span className="tabular-nums">{Math.round(percent)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">用量根据文字长度估算，与服务商账单可能有差异。</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={runTest} disabled={test.status === 'testing'} className={buttonClass}>
          {test.status === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
          测试此 Key
        </button>
        {quota > 0 && (
          <button type="button" onClick={onResetUsage} disabled={used === 0} className={buttonClass}>
            <RotateCcw className="h-4 w-4" />
            清零用量
          </button>
        )}
      </div>
      {test.status === 'ok' && (
        <p role="status" className="flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          连接成功，模型已正常响应
        </p>
      )}
      {test.status === 'error' && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-rose-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {test.message}
        </p>
      )}
    </div>
  );
}
