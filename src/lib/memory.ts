import type { ApiMessage, ChatMessage, Conversation, ModelCall, AppSettings } from '@/types';
import { STICKER_TAGS } from '@/lib/stickers';
import { GREAK_PERSONA, REPLY_FORMAT_RULES } from '@/lib/persona';

const SUMMARY_PROMPT =
  '你是对话摘要助手。请把用户提供的已有摘要与新增对话融合为一段不超过300字的中文摘要，保留关键事实、用户偏好、人物信息和未完成的事项。只输出摘要本身。';

const CAPABILITY_GUIDE =
  '需要查询实时天气或最新资讯时，请调用可用工具获取结果，不要凭记忆编造。';

const TAG_GUIDE = `表情标签只能从 ${STICKER_TAGS.join('、')} 中选择。`;

export interface ChatContext {
  apiMessages: ApiMessage[];
  summary: string;
  summarizedCount: number;
}

export function buildSystemPrompt(summary: string): string {
  const parts = [GREAK_PERSONA, REPLY_FORMAT_RULES, TAG_GUIDE, CAPABILITY_GUIDE];
  if (summary) parts.push(`【历史摘要】以下是更早对话的摘要，请据此保持记忆连贯：\n${summary}`);
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

export async function buildChatContext(
  conversation: Conversation,
  settings: AppSettings,
  signal: AbortSignal,
  complete: ModelCall,
): Promise<ChatContext> {
  const windowStart = Math.max(0, conversation.messages.length - settings.maxContextRounds * 2);
  let summary = conversation.summary;
  let summarizedCount = conversation.summarizedCount;

  if (settings.summaryEnabled && summarizedCount < windowStart) {
    const pending = conversation.messages.slice(summarizedCount, windowStart);
    summary = await summarizeMessages(summary, pending, complete, signal);
    summarizedCount = windowStart;
  }

  const system = buildSystemPrompt(settings.summaryEnabled ? summary : '');
  const windowed: ApiMessage[] = conversation.messages
    .slice(windowStart)
    .map((m) => ({ role: m.role, content: m.content }));

  return {
    apiMessages: [{ role: 'system', content: system }, ...windowed],
    summary,
    summarizedCount,
  };
}
