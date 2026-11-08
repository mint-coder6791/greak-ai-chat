import { Field, inputClass } from '@/components/control/ui';

interface ApiEndpointFieldsProps {
  baseUrl: string;
  apiKey: string;
  model: string;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
  baseUrlHint: string;
  modelPlaceholder: string;
  modelHint: string;
}

export function ApiEndpointFields({
  baseUrl,
  apiKey,
  model,
  onBaseUrlChange,
  onApiKeyChange,
  onModelChange,
  baseUrlHint,
  modelPlaceholder,
  modelHint,
}: ApiEndpointFieldsProps) {
  return (
    <>
      <Field label="API Base URL" hint={baseUrlHint}>
        <input
          className={inputClass}
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <Field label="API Key">
        <input
          type="password"
          className={inputClass}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="sk-..."
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <Field label="Model Name" hint={modelHint}>
        <input
          className={inputClass}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder={modelPlaceholder}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
    </>
  );
}
