import { Volume2, Square } from 'lucide-react';
import type { AppSettings, TtsEngine } from '@/types';
import type { SpeechControls } from '@/hooks/useSpeech';
import { QWEN_VOICES } from '@/lib/qwenTts';
import { Field, Section, Segmented, Slider, Toggle, buttonClass, inputClass } from '@/components/control/ui';

const PREVIEW_TEXT = '你好，这是一段语音试听。你觉得这个声音怎么样？';

interface SpeechSectionProps {
  settings: AppSettings;
  speech: SpeechControls;
  onChange: (patch: Partial<AppSettings>) => void;
}

export function SpeechSection({ settings, speech, onChange }: SpeechSectionProps) {
  const isBrowser = settings.ttsEngine === 'browser';
  const isQwen = settings.ttsEngine === 'qwen';
  const voiceUnavailable = isBrowser && !speech.supported;

  return (
    <Section
      index={3}
      icon={Volume2}
      title="语音朗读"
      description="浏览器音色或千问 TTS，支持自动朗读与分段"
    >
      <Field label="朗读引擎">
        <Segmented<TtsEngine>
          ariaLabel="朗读引擎"
          value={settings.ttsEngine}
          options={[
            { value: 'browser', label: '浏览器音色' },
            { value: 'qwen', label: '千问 TTS' },
          ]}
          onChange={(ttsEngine) => onChange({ ttsEngine })}
        />
      </Field>

      {isBrowser && (
        <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
          <Field label="音色">
            <select
              className={inputClass}
              value={settings.browserVoiceURI}
              onChange={(e) => onChange({ browserVoiceURI: e.target.value })}
              disabled={voiceUnavailable}
            >
              <option value="">系统默认</option>
              {speech.voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            {speech.supported && speech.voices.length === 0 && (
              <span className="block text-[11px] text-slate-500">正在加载音色列表，部分浏览器需要稍等片刻</span>
            )}
          </Field>
          <Slider
            label="语速"
            value={settings.speechRate}
            min={0.5}
            max={2}
            step={0.1}
            format={(v) => `${v.toFixed(1)}x`}
            onChange={(v) => onChange({ speechRate: v })}
          />
          <Slider
            label="音调"
            value={settings.speechPitch}
            min={0}
            max={2}
            step={0.1}
            format={(v) => v.toFixed(1)}
            onChange={(v) => onChange({ speechPitch: v })}
          />
        </div>
      )}

      {isQwen && (
        <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
          <Field label="千问 API Key" hint="留空则复用模块一的 API Key">
            <input
              type="password"
              className={inputClass}
              value={settings.qwenApiKey}
              onChange={(e) => onChange({ qwenApiKey: e.target.value })}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="千问语音 Voice ID" hint="可直接输入，常用音色见下方建议">
            <input
              className={inputClass}
              value={settings.qwenVoice}
              onChange={(e) => onChange({ qwenVoice: e.target.value })}
              list="qwen-voice-options"
              placeholder="Cherry"
              autoComplete="off"
              spellCheck={false}
            />
            <datalist id="qwen-voice-options">
              {QWEN_VOICES.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </datalist>
          </Field>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          onClick={() => speech.speak(PREVIEW_TEXT, 'preview')}
          disabled={voiceUnavailable}
        >
          <Volume2 className="h-4 w-4" />
          试听
        </button>
        {speech.status !== 'idle' && (
          <button type="button" className={buttonClass} onClick={speech.stop}>
            <Square className="h-3.5 w-3.5 fill-current" />
            停止朗读
          </button>
        )}
      </div>
      {speech.error && (
        <p role="alert" className="text-xs text-rose-700">
          {speech.error}
        </p>
      )}
      {voiceUnavailable && <p className="text-xs text-amber-800">当前浏览器不支持语音朗读，请改用千问 TTS</p>}

      <Toggle
        checked={settings.autoRead}
        onChange={(checked) => onChange({ autoRead: checked })}
        label="自动朗读"
        description="AI 每次回复完成后自动发音，每条消息旁也可以手动重播"
      />
      <Toggle
        checked={settings.chunkedReading}
        onChange={(checked) => onChange({ chunkedReading: checked })}
        label="长文本分段朗读"
        description="在标点处切分成小段依次朗读，避免长回复导致朗读卡死"
      />
      <p className="text-[11px] leading-relaxed text-slate-500">
        发送新消息时会自动打断当前朗读。
      </p>
    </Section>
  );
}
