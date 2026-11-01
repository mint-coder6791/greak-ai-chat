import type { AppSettings } from '@/types';
import { assertOk } from '@/lib/openai';

const QWEN_TTS_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const QWEN_TTS_MODEL = 'qwen-tts';

export const QWEN_VOICES = [
  { value: 'Cherry', label: 'Cherry（芊悦 / 女）' },
  { value: 'Ethan', label: 'Ethan（晨煦 / 男）' },
  { value: 'Serena', label: 'Serena（苏瑶 / 女）' },
  { value: 'Chelsie', label: 'Chelsie（千雪 / 女）' },
] as const;

interface QwenTtsResponse {
  output?: { audio?: { url?: string } };
}

export async function fetchQwenSpeechUrl(settings: AppSettings, text: string, signal: AbortSignal): Promise<string> {
  const apiKey = settings.qwenApiKey.trim() || settings.apiKey.trim();
  if (!apiKey) throw new Error('请先填写千问 API Key（可在「千问 TTS」下方填写，或复用主 Key）');
  const voice = settings.qwenVoice.trim();
  if (!voice) throw new Error('请先在「千问语音 Voice ID」里填写音色');

  const res = await fetch(QWEN_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    signal,
    body: JSON.stringify({ model: QWEN_TTS_MODEL, input: { text, voice } }),
  });
  await assertOk(res);
  const data = (await res.json()) as QwenTtsResponse;
  const url = data.output?.audio?.url;
  if (typeof url !== 'string' || url === '') throw new Error('千问语音接口没有返回音频地址');
  return url;
}
