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
    <Section index={1} icon={Plug} title="接口与模型" description="通义千问 Qwen，主备双 Key 自动容灾" defaultOpen>
      <Field label="模型 ID" hint="推荐 qwen-plus（均衡），也可填 qwen-max（更强）或 qwen-turbo（更快）">
        <input
          className={inputClass}
          value={settings.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder="qwen-plus"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>

      <ApiKeyCard
        label="主 Key"
        apiKey={settings.apiKey}
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
        model={settings.model}
        quota={settings.backupQuota}
        used={keyPool.usedTokens.backup}
        active={keyPool.activeSlot === 'backup'}
        onKeyChange={(backupApiKey) => onChange({ backupApiKey })}
        onQuotaChange={(backupQuota) => onChange({ backupQuota })}
        onResetUsage={() => keyPool.resetUsage('backup')}
      />
      <p className="text-[11px] leading-relaxed text-slate-500">
        接口地址已固定为阿里云百炼兼容地址。主 Key 遇到额度用尽或限流时，会自动静默切换到备用 Key。
      </p>
    </Section>
  );
}
