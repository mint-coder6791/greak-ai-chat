import type { ChatMessage, Conversation, MessageRole } from '@/types';

const PARALLEL_TITLE_PATTERN = /^平行时空 (\d+)$/;

export function createId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createMessage(role: MessageRole, content: string): ChatMessage {
  return { id: createId(), role, content, createdAt: Date.now() };
}

function nextParallelTitle(existing: Conversation[]): string {
  const highest = existing.reduce((max, c) => {
    const match = PARALLEL_TITLE_PATTERN.exec(c.title);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `平行时空 ${String(highest + 1).padStart(2, '0')}`;
}

export function createConversation(existing: Conversation[]): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: nextParallelTitle(existing),
    createdAt: now,
    updatedAt: now,
    messages: [],
    summary: '',
    summarizedCount: 0,
  };
}

export function limitMessages(conversation: Conversation, maxStored: number): Conversation {
  const excess = conversation.messages.length - maxStored;
  if (excess <= 0) return conversation;
  return {
    ...conversation,
    messages: conversation.messages.slice(excess),
    summarizedCount: Math.max(0, conversation.summarizedCount - excess),
  };
}

export function appendToMessage(conversation: Conversation, messageId: string, delta: string): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.map((m) => (m.id === messageId ? { ...m, content: m.content + delta } : m)),
  };
}
