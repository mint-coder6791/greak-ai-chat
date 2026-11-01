import { useEffect, useMemo, useState } from 'react';
import type { ChatStore, Conversation } from '@/types';
import { createConversation, limitMessages } from '@/lib/conversations';
import { loadChat, saveChat } from '@/lib/storage';

const SAVE_DELAY_MS = 300;

function limitStore(store: ChatStore, maxStored: number): ChatStore {
  return { ...store, conversations: store.conversations.map((c) => limitMessages(c, maxStored)) };
}

export function useConversations(maxStored: number) {
  const [store, setStore] = useState<ChatStore>(loadChat);

  useEffect(() => {
    const timer = window.setTimeout(() => saveChat(store, maxStored), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [store, maxStored]);

  const update = (fn: (prev: ChatStore) => ChatStore) => {
    setStore((prev) => limitStore(fn(prev), maxStored));
  };

  const createNew = (): Conversation => {
    const conversation = createConversation(store.conversations);
    update((prev) => ({ conversations: [conversation, ...prev.conversations], activeId: conversation.id }));
    return conversation;
  };

  const select = (id: string) => update((prev) => ({ ...prev, activeId: id }));

  const rename = (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    update((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
    }));
  };

  const remove = (id: string) => {
    update((prev) => {
      const conversations = prev.conversations.filter((c) => c.id !== id);
      const activeId = prev.activeId === id ? (conversations[0]?.id ?? null) : prev.activeId;
      return { conversations, activeId };
    });
  };

  const updateConversation = (id: string, fn: (c: Conversation) => Conversation) => {
    update((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => (c.id === id ? fn(c) : c)),
    }));
  };

  const replaceStore = (next: ChatStore) => update(() => next);

  const activeConversation = useMemo(
    () => store.conversations.find((c) => c.id === store.activeId) ?? null,
    [store],
  );

  return {
    store,
    conversations: store.conversations,
    activeId: store.activeId,
    activeConversation,
    createNew,
    select,
    rename,
    remove,
    updateConversation,
    replaceStore,
  };
}

export type ChatApi = ReturnType<typeof useConversations>;
