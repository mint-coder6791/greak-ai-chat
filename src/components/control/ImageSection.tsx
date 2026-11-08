import { Palette } from 'lucide-react';
import type { AppSettings } from '@/types';
import { Field, Section, Toggle, inputClass } from '@/components/control/ui';

interface ImageSectionProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function ImageSection({ settings, onChange }: ImageSectionProps) {
  return (
    <Section index={2} icon={Palette} title="自主生图" description="让 GREAK 自己决定什么时候画画">
      <Toggle
        checked={settings.autoDrawEnabled}
        onChange={(autoDrawEnabled) => onChange({ autoDrawEnabled })}
        label="开启自主生图"
        description="开启后 GREAK 可能在回复时自行画一张图，图片会出现在回复下方"
      />
      <Field label="生图 API URL" hint="接口根地址，程序会自动拼接 /images/generations">
        <input
          className={inputClass}
          value={settings.imageApiUrl}
          onChange={(e) => onChange({ imageApiUrl: e.target.value })}
          placeholder="https://your-image-api.com/v1"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <Field label="生图 API Key">
        <input
          type="password"
          className={inputClass}
          value={settings.imageApiKey}
          onChange={(e) => onChange({ imageApiKey: e.target.value })}
          placeholder="sk-..."
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <Field label="生图 Model Name" hint="填写服务商提供的生图模型名称">
        <input
          className={inputClass}
          value={settings.imageModel}
          onChange={(e) => onChange({ imageModel: e.target.value })}
          placeholder="例如 wanx2.1-t2i-turbo"
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <p className="text-[11px] leading-relaxed text-slate-500">
        生图请求由浏览器直接发出，部分服务商会因跨域限制无法访问，此时需要换用允许浏览器访问的接口地址。
      </p>
    </Section>
  );
}
