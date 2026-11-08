import { Eye } from 'lucide-react';
import type { AppSettings } from '@/types';
import { Section } from '@/components/control/ui';
import { ApiEndpointFields } from '@/components/control/ApiEndpointFields';

interface VisionSectionProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function VisionSection({ settings, onChange }: VisionSectionProps) {
  return (
    <Section index={2} icon={Eye} title="视觉识别模型" description="用户发送图片时调用，需支持 OpenAI Vision 格式">
      <ApiEndpointFields
        baseUrl={settings.visionApiUrl}
        apiKey={settings.visionApiKey}
        model={settings.visionModel}
        onBaseUrlChange={(visionApiUrl) => onChange({ visionApiUrl })}
        onApiKeyChange={(visionApiKey) => onChange({ visionApiKey })}
        onModelChange={(visionModel) => onChange({ visionModel })}
        modelPlaceholder="qwen-vl-max"
        modelHint="必须是支持图片输入的视觉模型，例如 qwen-vl-max"
      />
    </Section>
  );
}
