import type { ApiContentPart, ApiMessage, ChatMessage, Conversation, ModelCall, AppSettings } from '@/types';
import { GREAK_PERSONA, REPLY_FORMAT_RULES, STICKER_RULES, DRAW_RULES } from '@/lib/persona';

const SUMMARY_PROMPT =
  '你是对话摘要助手。请把用户提供的已有摘要与新增对话融合为一段不超过300字的中文摘要，保留关键事实、用户偏好、人物信息和未完成的事项。只输出摘要本身。';

const CAPABILITY_GUIDE =
  '需要查询实时天气或最新资讯时，请调用可用工具获取结果，不要凭记忆编造。用户发来图片时，请结合图片内容自然地回应。';

const IMAGE_PLACEHOLDER = '（用户发送了一张图片）';

export interface ChatContext {
  apiMessages: ApiMessage[];
  summary: string;
  summarizedCount: number;
}

export function buildSystemPrompt(summary: string, autoDraw: boolean, stickerLabels: string[]): string {
  const parts = [GREAK_PERSONA, REPLY_FORMAT_RULES, STICKER_RULES, CAPABILITY_GUIDE];
  if (autoDraw) parts.push(DRAW_RULES);
  if (summary) parts.push(`【历史摘要】以下是更早对话的摘要，请据此保持记忆连贯：\n${summary}`);
  parts.push(
    stickerLabels.length > 0
      ? `当前本地可调用的表情包标签有：[${stickerLabels.join(', ')}]`
      : '当前本地暂无可调用的表情包标签。',
  );
  return parts.join('\n');
}

async function summarizeMessages(
  previous: string,
  messages: ChatMessage[],
  complete: ModelCall,
  signal: AbortSignal,
): Promise<string> {
  const transcript = messages.map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`).join('\n');
  const content = await complete({
    signal,
    messages: [
      { role: 'system', content: SUMMARY_PROMPT },
      { role: 'user', content: `已有摘要：\n${previous || '（无）'}\n\n需要并入摘要的新对话：\n${transcript}` },
    ],
  });
  return content.trim();
}

function toApiContent(message: ChatMessage, vision: boolean): ApiMessage['content'] {
  if (!message.image || message.role !== 'user') return message.content;
  if (!vision) return message.content || IMAGE_PLACEHOLDER;
  const parts: ApiContentPart[] = [];
  if (message.content) parts.push({ type: 'text', text: message.content });
  parts.push({ type: 'image_url', image_url: { url: message.image } });
  return parts;
}

export async function buildChatContext(
  conversation: Conversation,
  settings: AppSettings,
  signal: AbortSignal,
  complete: ModelCall,
  vision: boolean,
  stickerLabels: string[],
): Promise<ChatContext> {
  const windowStart = Math.max(0, conversation.messages.length - settings.maxContextRounds * 2);
  let summary = conversation.summary;
  let summarizedCount = conversation.summarizedCount;

  if (settings.summaryEnabled && summarizedCount < windowStart) {
    const pending = conversation.messages.slice(summarizedCount, windowStart);
    summary = await summarizeMessages(summary, pending, complete, signal);
    summarizedCount = windowStart;
  }

  const system = buildSystemPrompt(settings.summaryEnabled ? summary : '', settings.autoDrawEnabled, stickerLabels);
  const windowed: ApiMessage[] = conversation.messages
    .slice(windowStart)
    .filter((m) => m.role === 'user' || m.content !== '')
    .map((m): ApiMessage => ({ role: m.role, content: toApiContent(m, vision) }));

  return {
    apiMessages: [{ role: 'system', content: system }, ...windowed],
    summary,
    summarizedCount,
  };
}
