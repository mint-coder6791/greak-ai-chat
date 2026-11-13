import { useEffect, useRef, useState } from 'react';
import type { ApiMessage, AppSettings, ChatMessage, KeySlot, ModelCall } from '@/types';
import type { ChatApi } from '@/hooks/useConversations';
import type { SpeechControls } from '@/hooks/useSpeech';
import type { KeyPoolControls } from '@/hooks/useKeyPool';
import { appendToMessage, createMessage } from '@/lib/conversations';
import { buildChatContext } from '@/lib/memory';
import { extractVoiceText } from '@/lib/replyParser';
import { requestCompletion, streamChatCompletion, type ApiConfig, type StreamResult } from '@/lib/openai';
import { estimateTokens, withKeyFailover } from '@/lib/keyPool';
import { buildAgentTools, executeTool } from '@/lib/tools';
import { errorMessage } from '@/lib/errors';
import { parseDrawRequests, stripDrawMarkers, type DrawRequest } from '@/lib/drawMarker';
import { listStickers } from '@/lib/stickerStore';
import { generateImage } from '@/lib/imageGeneration';
import { loadReferenceImage } from '@/lib/storage';

export interface StreamingState {
  conversationId: string;
  messageId: string | null;
  drawing?: boolean;
}

const MAX_TOOL_STEPS = 4;
const MAX_DRAWS_PER_REPLY = 2;
const NOTICE_DURATION_MS = 6000;

interface UseChatOptions {
  settings: AppSettings;
  chat: ChatApi;
  speech: Pick<SpeechControls, 'speak' | 'stop'>;
  keyPool: Pick<KeyPoolControls, 'activeSlot' | 'setActiveSlot' | 'recordUsage'>;
  ttsEnabled: boolean;
  refreshStickers: () => void;
}

export function useChat({ settings, chat, speech, keyPool, ttsEnabled, refreshStickers }: UseChatOptions) {
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

  const send = async (rawText: string, image?: string) => {
    const text = rawText.trim();
    if ((!text && !image) || streaming) return;

    setError(null);
    setNotice(null);
    speech.stop();

    const conversation = chat.activeConversation ?? chat.createNew();
    const conversationId = conversation.id;
    const userMessage: ChatMessage = { ...createMessage('user', text), ...(image ? { image } : {}) };
    const assistantMessage: ChatMessage = createMessage('assistant', '');
    const hasImage = Boolean(image);
    const tools = buildAgentTools(Boolean(settings.giphyApiKey.trim()));
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
      const inputText = messages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n');
      keyPool.recordUsage(slot, estimateTokens(inputText) + estimateTokens(outputOf(value)));
      return value;
    };

    const complete: ModelCall = ({ messages, signal, enableSearch }) =>
      runWithKeys(
        messages,
        (apiKey) =>
          requestCompletion({
            config: { baseUrl: settings.apiBaseUrl, apiKey, model: settings.model },
            messages,
            signal,
            enableSearch,
          }),
        (text) => text,
      );

    const appendDelta = (delta: string) =>
      chat.updateConversation(conversationId, (c) => appendToMessage(c, assistantMessage.id, delta));

    const runTextAgent = async (messages: ApiMessage[], signal: AbortSignal): Promise<string> => {
      const transcript = [...messages];
      for (let step = 0; ; step += 1) {
        const allowTools = step < MAX_TOOL_STEPS;
        const result: StreamResult = await runWithKeys(
          transcript,
          (apiKey) =>
            streamChatCompletion({
              config: { baseUrl: settings.apiBaseUrl, apiKey, model: settings.model },
              messages: transcript,
              tools: allowTools ? tools : undefined,
              signal,
              onDelta: appendDelta,
            }),
          (r) => r.content,
        );
        if (!allowTools || result.toolCalls.length === 0) return result.content;

        transcript.push({ role: 'assistant', content: result.content || null, tool_calls: result.toolCalls });
        for (const call of result.toolCalls) {
          const output = await executeTool(call, {
            callModel: complete,
            signal,
            giphyApiKey: settings.giphyApiKey,
            onStickersChanged: refreshStickers,
          });
          transcript.push({ role: 'tool', tool_call_id: call.id, content: output });
        }
      }
    };

    const runVisionReply = async (messages: ApiMessage[], signal: AbortSignal): Promise<string> => {
      const { visionApiUrl, visionApiKey, visionModel } = settings;
      if (!visionApiUrl.trim() || !visionApiKey.trim() || !visionModel.trim()) {
        throw new Error('请先在总控设置中填写视觉识别模型的 API Base URL、API Key 和模型名称');
      }
      const config: ApiConfig = { baseUrl: visionApiUrl, apiKey: visionApiKey, model: visionModel };
      const result = await streamChatCompletion({ config, messages, signal, onDelta: appendDelta });
      return result.content;
    };

    const draw = async (drawConversationId: string, request: DrawRequest, signal: AbortSignal) => {
      const { imageApiUrl, imageApiKey, imageModel } = settings;
      if (!imageApiUrl.trim() || !imageApiKey.trim() || !imageModel.trim()) {
        throw new Error('自主生图已开启，但图像生成模型的 URL、Key 或模型名称还没填写完整');
      }
      setStreaming({ conversationId: drawConversationId, messageId: null, drawing: true });
      const src = await generateImage({
        config: { baseUrl: imageApiUrl, apiKey: imageApiKey, model: imageModel },
        prompt: request.prompt,
        referenceImage: loadReferenceImage() ?? undefined,
        signal,
      });
      const stickerLabel = request.kind === 'sticker' ? request.label : undefined;
      chat.updateConversation(drawConversationId, (c) => ({
        ...c,
        messages: [...c.messages, { ...createMessage('assistant', ''), image: src, stickerLabel }],
        updatedAt: Date.now(),
      }));
    };

    try {
      const withUser = { ...conversation, messages: [...conversation.messages, userMessage] };
      const stickerLabels = (await listStickers()).map((item) => item.label);
      const context = await buildChatContext(withUser, settings, controller.signal, complete, hasImage, stickerLabels);

      chat.updateConversation(conversationId, (c) => ({
        ...c,
        summary: context.summary,
        summarizedCount: context.summarizedCount,
        messages: [...c.messages, assistantMessage],
      }));
      setStreaming({ conversationId, messageId: assistantMessage.id });

      if (settings.logPayload) console.log('[AI payload]', context.apiMessages);

      const reply = hasImage
        ? await runVisionReply(context.apiMessages, controller.signal)
        : await runTextAgent(context.apiMessages, controller.signal);
      const spoken = stripDrawMarkers(reply);
      const drawRequests = settings.autoDrawEnabled ? parseDrawRequests(reply).slice(0, MAX_DRAWS_PER_REPLY) : [];
      chat.updateConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === assistantMessage.id ? { ...m, content: spoken } : m)),
      }));
      if (ttsEnabled) {
        const voiceText = extractVoiceText(spoken);
        if (voiceText) speech.speak(voiceText, assistantMessage.id);
        else if (settings.autoRead && spoken.trim()) speech.speak(spoken, assistantMessage.id);
      }
      for (const request of drawRequests) await draw(conversationId, request, controller.signal);
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
