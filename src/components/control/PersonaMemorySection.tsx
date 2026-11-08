import { useRef, useState } from 'react';
import { Brain, Download, Upload } from 'lucide-react';
import type { AppSettings, ChatStore } from '@/types';
import { errorMessage } from '@/lib/errors';
import { exportBackup, parseBackup, type ImportedBackup } from '@/lib/backup';
import { Section, Slider, Toggle, buttonClass } from '@/components/control/ui';

interface PersonaMemorySectionProps {
  settings: AppSettings;
  chat: ChatStore;
  onChange: (patch: Partial<AppSettings>) => void;
  onImportBackup: (data: ImportedBackup) => void;
}

type BackupNotice = { tone: 'ok' | 'error'; text: string } | null;

export function PersonaMemorySection({ settings, chat, onChange, onImportBackup }: PersonaMemorySectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<BackupNotice>(null);

  const handleImportFile = async (file: File) => {
    try {
      const imported = parseBackup(await file.text());
      if (!window.confirm('导入会覆盖当前所有对话和设置，确定继续吗？')) return;
      onImportBackup(imported);
      setNotice({ tone: 'ok', text: `已恢复 ${imported.chat.conversations.length} 个会话` });
    } catch (err) {
      setNotice({ tone: 'error', text: `导入失败：${errorMessage(err)}` });
    }
  };

  return (
    <Section
      index={4}
      icon={Brain}
      title="人设与记忆"
      description="上下文窗口、历史摘要与备份"
    >
      <div className="space-y-2 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
        <Slider
          label="最大上下文轮数"
          value={settings.maxContextRounds}
          min={1}
          max={50}
          step={1}
          format={(v) => `${v} 轮`}
          onChange={(v) => onChange({ maxContextRounds: v })}
        />
        <p className="text-[11px] leading-relaxed text-slate-500">
          只把最近的若干轮对话发送给 AI，超出的早期消息不再直接参与上下文。
        </p>
      </div>

      <Toggle
        checked={settings.summaryEnabled}
        onChange={(checked) => onChange({ summaryEnabled: checked })}
        label="旧对话摘要"
        description="超出上下文窗口的早期对话会被精简为一段历史摘要，注入系统提示词，减少失忆"
      />

      <div className="space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="text-xs font-medium text-slate-600">备份与恢复</p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          备份文件包含全部对话、设置和 API 密钥，请妥善保管，不要分享给他人。
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" className={buttonClass} onClick={() => exportBackup(settings, chat)}>
            <Download className="h-4 w-4" />
            导出数据 (JSON)
          </button>
          <button type="button" className={buttonClass} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            从文件恢复
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleImportFile(file);
          }}
        />
        {notice && (
          <p role="status" className={`text-xs ${notice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {notice.text}
          </p>
        )}
      </div>
    </Section>
  );
}
