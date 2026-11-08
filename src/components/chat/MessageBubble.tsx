import { Pause, Play, Square, Volume2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import type { SpeechStatus } from '@/hooks/useSpeech';
import { useTypewriter } from '@/hooks/useTypewriter';
import { type StickerLibrary } from '@/lib/stickers';
import { parseReplySegments, stripVoiceMarker } from '@/lib/replyParser';
import { stripDrawMarkers } from '@/lib/drawMarker';
import { StickerImage } from '@/components/chat/StickerImage';
import { AvatarSlot } from '@/components/layout/AvatarSlot';

export type MessageSpeechState = SpeechStatus | 'idle';

interface MessageBubbleProps {
  message: ChatMessage;
  avatarSrc: string;
  isStreaming: boolean;
  speechState: MessageSpeechState;
  stickers: StickerLibrary;
  onToggleSpeech: () => void;
  onStopSpeech: () => void;
}

function ThinkingDots() {
  return (
    <span className="flex h-6 items-center gap-1.5" aria-label="GREAK 正在输入">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-emerald-400 animate-breathe"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}

function renderContent(text: string, isUser: boolean, stickers: StickerLibrary) {
  if (isUser) return text;
  return parseReplySegments(text).map((segment, index) => {
    if (segment.type === 'text') return <span key={index}>{segment.text}</span>;
    return (
      <span key={index} className="my-2 block">
        <StickerImage tag={segment.tag} src={stickers[segment.tag]} />
      </span>
    );
  });
}

export function MessageBubble({
  message,
  avatarSrc,
  isStreaming,
  speechState,
  stickers,
  onToggleSpeech,
  onStopSpeech,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : stripDrawMarkers(stripVoiceMarker(message.content));
  const visibleText = useTypewriter(displayContent, isStreaming);
  const showDots = !isUser && isStreaming && message.content === '';
  const hasText = showDots || displayContent !== '';
  const imageEl = message.image ? (
    <img src={message.image} alt={isUser ? '已发送的图片' : 'GREAK 画的图'} className="max-h-72 w-auto max-w-full rounded-2xl object-cover" />
  ) : null;
  const showSpeechControls = !isUser && !isStreaming && message.content.trim() !== '';
  const speechActive = speechState !== 'idle';

  const speakLabel =
    speechState === 'speaking' ? '暂停朗读' : speechState === 'paused' ? '继续朗读' : '朗读这条消息';

  return (
    <div className={`flex animate-fade-in-up gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <AvatarSlot src={avatarSrc} className="mt-1 h-9 w-9" />}
      <div className={`flex min-w-0 max-w-[75%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {!hasText && imageEl}
        {(hasText || !imageEl) && (
        <div
          className={`whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-[1.7] ${
            isUser
              ? 'rounded-3xl rounded-tr-none bg-emerald-100 text-slate-800 shadow-[0_2px_10px_rgba(16,185,129,0.12)]'
              : 'rounded-3xl rounded-tl-none bg-white text-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.08)]'
          }`}
        >
          {hasText && imageEl && <span className="mb-2 block">{imageEl}</span>}
          {showDots ? <ThinkingDots /> : renderContent(visibleText, isUser, stickers)}
          {isStreaming && message.content !== '' && (
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-emerald-400 animate-pulse" />
          )}
        </div>
        )}
        {showSpeechControls && (
          <div
            className={`flex items-center gap-1 transition md:opacity-0 md:group-hover:opacity-100 ${
              speechActive ? 'opacity-100' : ''
            }`}
          >
            <button
              type="button"
              onClick={onToggleSpeech}
              aria-label={speakLabel}
              title={speakLabel}
              className={`rounded-2xl p-1.5 transition hover:bg-emerald-100 ${
                speechActive ? 'text-emerald-700' : 'text-slate-500 hover:text-emerald-800'
              }`}
            >
              {speechState === 'speaking' ? (
                <Pause className="h-3.5 w-3.5" />
              ) : speechState === 'paused' ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            {speechActive && (
              <button
                type="button"
                onClick={onStopSpeech}
                aria-label="停止朗读"
                title="停止朗读"
                className="rounded-2xl p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
