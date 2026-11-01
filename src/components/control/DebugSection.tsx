import { Bug } from 'lucide-react';
import type { AppSettings } from '@/types';
import { Field, Section, Slider, Toggle } from '@/components/control/ui';

interface DebugSectionProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function DebugSection({ settings, onChange }: DebugSectionProps) {
  return (
    <Section index={7} icon={Bug} title="开发者调试" description="请求查看与本地存储容量保护">
      <Toggle
        checked={settings.logPayload}
        onChange={(checked) => onChange({ logPayload: checked })}
        label="查看原始 Payload"
        description="每次发送给接口的完整 messages 数组会打印到浏览器控制台（console）"
      />
      <Field label="单个会话最多保留的消息数">
        <Slider
          label="消息保留上限"
          value={settings.maxStoredMessages}
          min={20}
          max={1000}
          step={10}
          format={(v) => `${v} 条`}
          onChange={(v) => onChange({ maxStoredMessages: v })}
        />
      </Field>
      <p className="text-[11px] leading-relaxed text-slate-500">
        超过上限后，最旧的消息会自动从本地存储中丢弃，防止浏览器存储空间超限报错。
      </p>
    </Section>
  );
}
