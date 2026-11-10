import { Palette } from 'lucide-react';
import type { AppSettings } from '@/types';
import { Section, Toggle } from '@/components/control/ui';
import { ApiEndpointFields } from '@/components/control/ApiEndpointFields';
import { ReferenceImageField } from '@/components/control/ReferenceImageField';

interface ImageSectionProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function ImageSection({ settings, onChange }: ImageSectionProps) {
  return (
    <Section index={3} icon={Palette} title="图像生成模型" description="GREAK 自主画画时调用的生图接口">
      <Toggle
        checked={settings.autoDrawEnabled}
        onChange={(autoDrawEnabled) => onChange({ autoDrawEnabled })}
        label="开启自主生图"
        description="开启后 GREAK 可能在回复时自行画一张图，图片会出现在回复下方"
      />
      <ApiEndpointFields
        baseUrl={settings.imageApiUrl}
        apiKey={settings.imageApiKey}
        model={settings.imageModel}
        onBaseUrlChange={(imageApiUrl) => onChange({ imageApiUrl })}
        onApiKeyChange={(imageApiKey) => onChange({ imageApiKey })}
        onModelChange={(imageModel) => onChange({ imageModel })}
        baseUrlHint="完整的生图接口地址，程序会直接请求该地址，不会再拼接路径"
        modelPlaceholder="wan2.6-t2i"
        modelHint="填写服务商提供的生图模型名称"
      />
      <ReferenceImageField />
      <p className="text-[11px] leading-relaxed text-slate-500">
        生图请求由浏览器直接发出，部分服务商会因跨域限制无法访问，此时需要换用允许浏览器访问的接口地址。
      </p>
    </Section>
  );
}
