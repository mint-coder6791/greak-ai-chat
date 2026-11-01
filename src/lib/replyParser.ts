import { isStickerTag, type StickerTag } from '@/lib/stickers';

const VOICE_MARKER = '[VOICE]';
const MARKER_PATTERN = /\[(STICKER|ACTION):([^\]]+)\]/g;

export type ReplySegment =
  | { type: 'text'; text: string }
  | { type: 'sticker'; tag: StickerTag }
  | { type: 'action'; text: string };

export function parseReplySegments(text: string): ReplySegment[] {
  const segments: ReplySegment[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKER_PATTERN)) {
    const index = match.index ?? 0;
    const kind = match[1];
    const value = match[2].trim();
    if (index > last) segments.push({ type: 'text', text: text.slice(last, index) });
    last = index + match[0].length;
    if (kind === 'STICKER') {
      if (isStickerTag(value)) segments.push({ type: 'sticker', tag: value });
    } else if (value) {
      segments.push({ type: 'action', text: value });
    }
  }
  if (last < text.length) segments.push({ type: 'text', text: text.slice(last) });
  return segments;
}

export function stripVoiceMarker(text: string): string {
  return text.split(VOICE_MARKER).join('');
}

export function stripReplyMarkers(text: string): string {
  return stripVoiceMarker(text).replace(MARKER_PATTERN, ' ');
}

export function extractVoiceText(text: string): string | null {
  const parts = text
    .split(VOICE_MARKER)
    .slice(1)
    .map((part) => stripReplyMarkers(part).trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join('\n') : null;
}
