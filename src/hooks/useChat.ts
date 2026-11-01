import { useEffect, useRef, useState } from 'react';
import type { ApiMessage, AppSettings, ChatMessage, KeySlot, ModelCall } from '@/types';
import type { ChatApi } from '@/hooks/useConversations';
import type { SpeechControls } from '@/hooks/useSpeech';
import type { KeyPoolControls } from '@/hooks/useKeyPool';
import { appendToMessage, createMessage } from '@/lib/conversations';
import { buildChatContext } from '@/lib/memory';
import { extractVoiceText } from '@/lib/replyParser';
import { requestCompletion, streamChatCompletion, type StreamResult } from '@/lib/openai';
import { estimateTokens, withKeyFailover } from '@/lib/keyPool';
import { AGENT_TOOLS, executeTool } from '@/lib/tools';
import { errorMessage } from '@/lib/errors';

export interface StreamingState {
  conversationId: string;
  messageId: string | null;
}

const MAX_TOOL_STEPS = 4;
const NOTICE_DURATION_MS = 6000;

interface UseChatOptions {
  settings: AppSettings;
  chat: ChatApi;
  speech: Pick<SpeechControls, 'speak' | 'stop'>;
  keyPool: Pick<KeyPoolControls, 'activeSlot' | 'setActiveSlot' | 'recordUsage'>;
}

export function useChat({ settings, chat, speech, keyPool }: UseChatOptions) {
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const stop = () => abortRef.current?.abort();

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || streaming) return;

    setError(null);
    setNotice(null);
    speech.stop();

    const conversation = chat.activeConversation ?? chat.createNew();
    const conversationId = conversation.id;
    const userMessage: ChatMessage = createMessage('user', text);
    const assistantMessage: ChatMessage = createMessage('assistant', '');
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming({ conversationId, messageId: null });

    chat.updateConversation(conversationId, (c) => ({
      ...c,
      messages: [...c.messages, userMessage],
      updatedAt: Date.now(),
    }));

    let preferred: KeySlot = keyPool.activeSlot;

    const runWithKeys = async <T,>(
      messages: ApiMessage[],
      run: (apiKey: string) => Promise<T>,
      outputOf: (value: T) => string,
    ): Promise<T> => {
      const { value, slot } = await withKeyFailover(settings, preferred, run);
      if (slot !== preferred) {
        preferred = slot;
        keyPool.setActiveSlot(slot);
        setNotice(slot === 'backup' ? 'GREAK 换了个通道，对话不受影响' : 'GREAK 已切回主通道');
      }
      const inputText = messages.map((m) => m.content ?? '').join('\n');
      keyPool.recordUsage(slot, estimateTokens(inputText) + estimateTokens(outputOf(value)));
      return value;
    };

    const complete: ModelCall = ({ messages, signal, enableSearch }) =>
      runWithKeys(
        messages,
        (apiKey) => requestCompletion({ config: { apiKey, model: settings.model }, messages, signal, enableSearch }),
        (text) => text,
      );

    const runAgent = async (messages: ApiMessage[], signal: AbortSignal): Promise<string> => {
      const transcript = [...messages];
      for (let step = 0; ; step += 1) {
        const allowTools = step < MAX_TOOL_STEPS;
        const result: StreamResult = await runWithKeys(
          transcript,
          (apiKey) =>
            streamChatCompletion({
              config: { apiKey, model: settings.model },
              messages: transcript,
              tools: allowTools ? AGENT_TOOLS : undefined,
              signal,
              onDelta: (delta) =>
                chat.updateConversation(conversationId, (c) => appendToMessage(c, assistantMessage.id, delta)),
            }),
          (r) => r.content,
        );
        if (!allowTools || result.toolCalls.length === 0) return result.content;

        transcript.push({ role: 'assistant', content: result.content || null, tool_calls: result.toolCalls });
        for (const call of result.toolCalls) {
          const output = await executeTool(call, { callModel: complete, signal });
          transcript.push({ role: 'tool', tool_call_id: call.id, content: output });
        }
      }
    };

    try {
      const withUser = { ...conversation, messages: [...conversation.messages, userMessage] };
      const context = await buildChatContext(withUser, settings, controller.signal, complete);

      chat.updateConversation(conversationId, (c) => ({
        ...c,
        summary: context.summary,
        summarizedCount: context.summarizedCount,
        messages: [...c.messages, assistantMessage],
      }));
      setStreaming({ conversationId, messageId: assistantMessage.id });

      if (settings.logPayload) console.log('[AI payload]', context.apiMessages);

      const reply = await runAgent(context.apiMessages, controller.signal);
      const voiceText = extractVoiceText(reply);
      if (voiceText) speech.speak(voiceText, assistantMessage.id);
      else if (settings.autoRead && reply.trim()) speech.speak(reply, assistantMessage.id);
    } catch (err) {
      if (!controller.signal.aborted) setError(errorMessage(err));
    } finally {
      chat.updateConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== assistantMessage.id || m.content !== ''),
      }));
      abortRef.current = null;
      setStreaming(null);
    }
  };

  return { send, stop, streaming, error, notice };
}
