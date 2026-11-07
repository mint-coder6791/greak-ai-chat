import type { ApiMessage, ToolCall, ToolDefinition } from '@/types';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

interface CompletionResponse {
  choices?: { message?: { content?: string } }[];
}

interface StreamToolCallDelta {
  index?: number;
  id?: string;
  function?: { name?: string; arguments?: string };
}

interface StreamChunk {
  choices?: { delta?: { content?: string | null; tool_calls?: StreamToolCallDelta[] } }[];
}

export interface StreamResult {
  content: string;
  toolCalls: ToolCall[];
}

export async function assertOk(res: Response): Promise<void> {
  if (res.ok) return;
  const detail = await res.text().catch(() => '');
  throw new HttpError(res.status, `接口返回错误（${res.status}）${detail ? `：${detail.slice(0, 200)}` : ''}`);
}

async function postChat({
  config,
  messages,
  stream,
  signal,
  tools,
  enableSearch,
  maxTokens,
}: {
  config: ApiConfig;
  messages: ApiMessage[];
  stream: boolean;
  signal?: AbortSignal;
  tools?: ToolDefinition[];
  enableSearch?: boolean;
  maxTokens?: number;
}): Promise<Response> {
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey.trim()}` },
    signal,
    body: JSON.stringify({
      model: config.model.trim(),
      messages,
      stream,
      ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
      ...(enableSearch ? { enable_search: true } : {}),
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
    }),
  });
  await assertOk(res);
  return res;
}

function mergeToolCallDelta(calls: ToolCall[], part: StreamToolCallDelta): void {
  const index = part.index ?? 0;
  const call = (calls[index] ??= { id: '', type: 'function', function: { name: '', arguments: '' } });
  if (part.id) call.id = part.id;
  if (part.function?.name) call.function.name += part.function.name;
  if (part.function?.arguments) call.function.arguments += part.function.arguments;
}

export async function streamChatCompletion({
  config,
  messages,
  tools,
  signal,
  onDelta,
}: {
  config: ApiConfig;
  messages: ApiMessage[];
  tools?: ToolDefinition[];
  signal: AbortSignal;
  onDelta: (delta: string) => void;
}): Promise<StreamResult> {
  const res = await postChat({ config, messages, tools, signal, stream: true });
  if (!res.body) throw new Error('接口没有返回可读取的数据流');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const toolCalls: ToolCall[] = [];
  let buffer = '';
  let content = '';
  let finished = false;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') {
      finished = true;
      return;
    }
    let chunk: StreamChunk;
    try {
      chunk = JSON.parse(payload) as StreamChunk;
    } catch {
      return;
    }
    const delta = chunk.choices?.[0]?.delta;
    if (!delta) return;
    if (delta.content) {
      content += delta.content;
      onDelta(delta.content);
    }
    for (const part of delta.tool_calls ?? []) mergeToolCallDelta(toolCalls, part);
  };

  while (!finished) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(handleLine);
  }
  handleLine(buffer);

  return { content, toolCalls: toolCalls.filter((call) => call.function.name !== '') };
}

export async function requestCompletion({
  config,
  messages,
  signal,
  enableSearch,
  maxTokens,
}: {
  config: ApiConfig;
  messages: ApiMessage[];
  signal?: AbortSignal;
  enableSearch?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const res = await postChat({ config, messages, signal, enableSearch, maxTokens, stream: false });
  const data = (await res.json()) as CompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('接口返回的数据格式不正确');
  return content;
}
