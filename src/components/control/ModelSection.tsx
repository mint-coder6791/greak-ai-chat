import { Plug } from 'lucide-react';
import type { AppSettings } from '@/types';
import type { KeyPoolControls } from '@/hooks/useKeyPool';
import { ApiKeyCard } from '@/components/control/ApiKeyCard';
import { Field, Section, inputClass } from '@/components/control/ui';

interface ModelSectionProps {
  settings: AppSettings;
  keyPool: KeyPoolControls;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function ModelSection({ settings, keyPool, onChange }: ModelSectionProps) {
  return (
    <Section index={1} icon={Plug} title="文字对话模型" description="日常聊天使用，兼容 OpenAI 格式，主备双 Key 自动容灾" defaultOpen>
      <Field label="API Base URL" hint="接口根地址，程序会自动拼接 /chat/completions。默认是通义千问，可换成豆包、Gemini 等地址">
        <input
          className={inputClass}
          value={settings.apiBaseUrl}
          onChange={(e) => onChange({ apiBaseUrl: e.target.value })}
          placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>

      <Field label="模型名称 (Model Name)" hint="日常聊天使用的模型，默认 qwen-max">
        <input
          className={inputClass}
          value={settings.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder="qwen-max"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>

      <ApiKeyCard
        label="主 Key"
        apiKey={settings.apiKey}
        baseUrl={settings.apiBaseUrl}
        model={settings.model}
        quota={settings.primaryQuota}
        used={keyPool.usedTokens.primary}
        active={keyPool.activeSlot === 'primary'}
        onKeyChange={(apiKey) => onChange({ apiKey })}
        onQuotaChange={(primaryQuota) => onChange({ primaryQuota })}
        onResetUsage={() => keyPool.resetUsage('primary')}
      />
      <ApiKeyCard
        label="备用 Key"
        apiKey={settings.backupApiKey}
        baseUrl={settings.apiBaseUrl}
        model={settings.model}
        quota={settings.backupQuota}
        used={keyPool.usedTokens.backup}
        active={keyPool.activeSlot === 'backup'}
        onKeyChange={(backupApiKey) => onChange({ backupApiKey })}
        onQuotaChange={(backupQuota) => onChange({ backupQuota })}
        onResetUsage={() => keyPool.resetUsage('backup')}
      />
      <p className="text-[11px] leading-relaxed text-slate-500">
        接口地址与模型名称对主备 Key 共用。主 Key 遇到额度用尽或限流时，会自动静默切换到备用 Key。
      </p>
    </Section>
  );
}
