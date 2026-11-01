export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
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

export interface ApiMessage {
  role: 'system' | MessageRole | 'tool';
  content: string | null;
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
}
