export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  image?: string;
  stickerLabel?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  summary: string;
  summarizedCount: number;
}

export interface ChatStore {
  conversations: Conversation[];
  activeId: string | null;
}

export type KeySlot = 'primary' | 'backup';

export interface KeyPoolState {
  activeSlot: KeySlot;
  usedTokens: Record<KeySlot, number>;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ApiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ApiMessage {
  role: 'system' | MessageRole | 'tool';
  content: string | ApiContentPart[] | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ModelCallOptions {
  messages: ApiMessage[];
  signal: AbortSignal;
  enableSearch?: boolean;
}

export type ModelCall = (options: ModelCallOptions) => Promise<string>;

export type TtsEngine = 'browser' | 'qwen';

export interface AppSettings {
  apiBaseUrl: string;
  apiKey: string;
  backupApiKey: string;
  primaryQuota: number;
  backupQuota: number;
  model: string;
  maxContextRounds: number;
  summaryEnabled: boolean;
  ttsEngine: TtsEngine;
  browserVoiceURI: string;
  speechRate: number;
  speechPitch: number;
  qwenApiKey: string;
  qwenVoice: string;
  autoRead: boolean;
  chunkedReading: boolean;
  bgmUrl: string;
  bgmVolume: number;
  bgmLoop: boolean;
  smartDucking: boolean;
  logPayload: boolean;
  maxStoredMessages: number;
  autoDrawEnabled: boolean;
  imageApiUrl: string;
  imageApiKey: string;
  imageModel: string;
  visionApiUrl: string;
  visionApiKey: string;
  visionModel: string;
}
