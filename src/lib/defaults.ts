import type { AppSettings } from '@/types';

export const DEFAULT_TITLE = '平行时空';
export const DEFAULT_API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
export const DEFAULT_IMAGE_API_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  apiKey: '',
  backupApiKey: '',
  primaryQuota: 0,
  backupQuota: 0,
  model: 'qwen-max',
  maxContextRounds: 10,
  summaryEnabled: false,
  ttsEngine: 'qwen',
  browserVoiceURI: '',
  speechRate: 1,
  speechPitch: 1,
  qwenApiKey: '',
  qwenVoice: 'Cherry',
  autoRead: false,
  chunkedReading: true,
  bgmUrl: '',
  bgmVolume: 0.4,
  bgmLoop: true,
  smartDucking: true,
  logPayload: false,
  maxStoredMessages: 200,
  autoDrawEnabled: false,
  imageApiUrl: DEFAULT_IMAGE_API_URL,
  imageApiKey: '',
  imageModel: 'wan2.6-t2i',
  visionApiUrl: DEFAULT_API_BASE_URL,
  visionApiKey: '',
  visionModel: 'qwen-vl-max',
};
