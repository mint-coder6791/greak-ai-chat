import { useEffect } from 'react';
import { History, Sparkles } from 'lucide-react';
import type { Conversation } from '@/types';
import type { SpeechControls } from '@/hooks/useSpeech';
import type { StreamingState } from '@/hooks/useChat';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { DEFAULT_TITLE } from '@/lib/defaults';
import type { StickerLibrary } from '@/lib/stickers';
import { Composer } from '@/components/chat/Composer';
import { GreakPortrait } from '@/components/chat/GreakPortrait';
import { MessageBubble, type MessageSpeechState } from '@/components/chat/MessageBubble';
import { StatusIndicator } from '@/components/chat/StatusIndicator';

interface ChatWindowProps {
  conversation: Conversation | null;
  avatarSrc: string;
  configured: boolean;
  streaming: StreamingState | null;
  chatError: string | null;
  speech: SpeechControls;
  stickers: StickerLibrary;
  onSend: (text: string, image?: string) => void;
  onStop: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
}

export function ChatWindow({
  conversation,
  avatarSrc,
  configured,
  streaming,
  chatError,
  speech,
  stickers,
  onSend,
  onStop,
  onOpenSettings,
  onToggleSidebar,
}: ChatWindowProps) {
  const { scrollRef, contentRef, scrollToBottom, handleScroll } = useAutoScroll();
  const messages = conversation?.messages ?? [];
  const messageCount = messages.length;
  const conversationId = conversation?.id ?? null;

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messageCount, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('auto');
  }, [conversationId, scrollToBottom]);

  const activeStreaming = streaming && streaming.conversationId === conversationId ? streaming : null;
  const busy = streaming !== null;
  const hasVisibleReply =
    activeStreaming?.messageId != null &&
    messages.some((m) => m.id === activeStreaming.messageId && m.content !== '');
  const isThinking = activeStreaming !== null && !hasVisibleReply;

  const indicatorState = isThinking ? 'thinking' : speech.status;

  const getSpeechState = (messageId: string): MessageSpeechState =>
    speech.activeMessageId === messageId ? speech.status : 'idle';

  const handleToggleSpeech = (messageId: string, content: string) => {
    if (speech.activeMessageId === messageId && speech.status !== 'idle') speech.togglePause();
    else speech.speak(content, messageId);
  };

  const title = conversation?.title || DEFAULT_TITLE;
  const errorText = chatError ?? speech.error;

  return (
    <section className="glass relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
      {/* 未来这里是 Live2D 容器：模型加载后替换下方的立绘占位 */}
      <div
        id="live2d-container"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center px-4"
      >
        <GreakPortrait src={avatarSrc} showWelcome={messages.length === 0} />
      </div>

      <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-emerald-100/80 pl-4 pr-24 sm:pr-56 md:pl-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex shrink-0 items-center gap-1.5 rounded-3xl border border-emerald-100 bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-900 active:scale-[0.98]"
        >
          <History className="h-4 w-4 text-emerald-500" />
          我们的回忆
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
          <h1 className="truncate text-base font-semibold text-slate-800">{title}</h1>
        </div>
        <div className="hidden md:block">
          <StatusIndicator state={indicatorState} />
        </div>
      </header>

      <div ref={scrollRef} onScroll={handleScroll} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div ref={contentRef} className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <div key={message.id} className="group">
              <MessageBubble
                message={message}
                avatarSrc={avatarSrc}
                isStreaming={activeStreaming?.messageId === message.id}
                speechState={message.role === 'assistant' ? getSpeechState(message.id) : 'idle'}
                stickers={stickers}
                onToggleSpeech={() => handleToggleSpeech(message.id, message.content)}
                onStopSpeech={speech.stop}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-20 shrink-0 border-t-2 border-[#a7f3d0] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:px-8 md:pb-6">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {errorText && (
            <p role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {errorText}
            </p>
          )}
          <Composer
            busy={busy}
            configured={configured}
            onSend={onSend}
            onStop={onStop}
            onOpenSettings={onOpenSettings}
          />
        </div>
      </div>
    </section>
  );
}
