import type { AppSettings, ChatStore, KeyPoolState } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import { limitMessages } from '@/lib/conversations';

const SETTINGS_KEY = 'private-agent:settings';
const CHAT_KEY = 'private-agent:chat';
const KEY_POOL_KEY = 'private-agent:key-pool';
const STICKER_KEY = 'private-agent:stickers';
const REFERENCE_IMAGE_KEY = 'greak_reference_image';
const MIN_STORED_MESSAGES = 10;

const EMPTY_CHAT: ChatStore = { conversations: [], activeId: null };
const DEFAULT_KEY_POOL: KeyPoolState = { activeSlot: 'primary', usedTokens: { primary: 0, backup: 0 } };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isQuotaError(err: unknown): boolean {
  return err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

export function loadSettings(): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) };
  if (merged.ttsEngine !== 'browser' && merged.ttsEngine !== 'qwen') merged.ttsEngine = 'browser';
  return merged;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('设置保存失败', err);
  }
}

export function loadKeyPool(): KeyPoolState {
  const stored = readJson<Partial<KeyPoolState>>(KEY_POOL_KEY, {});
  return {
    activeSlot: stored.activeSlot === 'backup' ? 'backup' : DEFAULT_KEY_POOL.activeSlot,
    usedTokens: { ...DEFAULT_KEY_POOL.usedTokens, ...stored.usedTokens },
  };
}

export function saveKeyPool(state: KeyPoolState): void {
  try {
    localStorage.setItem(KEY_POOL_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Key 用量保存失败', err);
  }
}

export function readLegacyStickers(): Record<string, string> {
  const stored = readJson<Record<string, unknown>>(STICKER_KEY, {});
  const legacy: Record<string, string> = {};
  for (const [tag, value] of Object.entries(stored)) {
    if (typeof value === 'string') legacy[tag] = value;
  }
  return legacy;
}

export function clearLegacyStickers(): void {
  localStorage.removeItem(STICKER_KEY);
}

export function loadReferenceImage(): string | null {
  try {
    return localStorage.getItem(REFERENCE_IMAGE_KEY);
  } catch {
    return null;
  }
}

export function saveReferenceImage(dataUrl: string): boolean {
  try {
    localStorage.setItem(REFERENCE_IMAGE_KEY, dataUrl);
    return true;
  } catch (err) {
    console.error('参考图保存失败', err);
    return false;
  }
}

export function clearReferenceImage(): void {
  localStorage.removeItem(REFERENCE_IMAGE_KEY);
}

export function loadChat(): ChatStore {
  return readJson<ChatStore>(CHAT_KEY, EMPTY_CHAT);
}

export function saveChat(store: ChatStore, maxStored: number): void {
  let limit = maxStored;
  while (true) {
    const trimmed: ChatStore = {
      ...store,
      conversations: store.conversations.map((c) => limitMessages(c, limit)),
    };
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
      return;
    } catch (err) {
      if (!isQuotaError(err) || limit <= MIN_STORED_MESSAGES) {
        console.error('对话保存失败，浏览器存储空间不足', err);
        return;
      }
      limit = Math.max(MIN_STORED_MESSAGES, Math.floor(limit / 2));
    }
  }
}
