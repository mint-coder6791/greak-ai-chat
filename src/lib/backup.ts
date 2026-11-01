import type { AppSettings, ChatMessage, ChatStore, Conversation } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_TITLE } from '@/lib/defaults';

const BACKUP_APP = 'private-agent';
const BACKUP_VERSION = 1;

export interface ImportedBackup {
  settings: AppSettings;
  chat: ChatStore;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.content !== 'string') return null;
  if (value.role !== 'user' && value.role !== 'assistant') return null;
  return {
    id: value.id,
    role: value.role,
    content: value.content,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  };
}

function toConversation(value: unknown): Conversation | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.messages)) return null;
  const messages = value.messages.map(toMessage).filter((m): m is ChatMessage => m !== null);
  const now = Date.now();
  return {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : DEFAULT_TITLE,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : now,
    messages,
    summary: typeof value.summary === 'string' ? value.summary : '',
    summarizedCount: typeof value.summarizedCount === 'number' ? Math.min(value.summarizedCount, messages.length) : 0,
  };
}

export function exportBackup(settings: AppSettings, chat: ChatStore): void {
  const payload = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    chat,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `private-agent-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseBackup(raw: string): ImportedBackup {
  const data: unknown = JSON.parse(raw);
  if (!isRecord(data) || data.app !== BACKUP_APP || !isRecord(data.chat) || !Array.isArray(data.chat.conversations)) {
    throw new Error('这不是本应用导出的备份文件');
  }
  const conversations = data.chat.conversations
    .map(toConversation)
    .filter((c): c is Conversation => c !== null);
  const requestedActive = data.chat.activeId;
  const activeId =
    typeof requestedActive === 'string' && conversations.some((c) => c.id === requestedActive)
      ? requestedActive
      : (conversations[0]?.id ?? null);
  const settings = isRecord(data.settings) ? (data.settings as Partial<AppSettings>) : {};
  return {
    settings: { ...DEFAULT_SETTINGS, ...settings },
    chat: { conversations, activeId },
  };
}
