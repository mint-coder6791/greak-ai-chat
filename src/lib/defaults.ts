import type { AppSettings } from '@/types';

export const DEFAULT_TITLE = '平行时空';

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  backupApiKey: '',
  primaryQuota: 0,
  backupQuota: 0,
  model: 'qwen-plus',
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
};
