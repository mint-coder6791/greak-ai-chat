import { stripReplyMarkers } from '@/lib/replyParser';

const MAX_CHUNK_LENGTH = 160;

function cleanForSpeech(text: string): string {
  return stripReplyMarkers(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*#_~>|]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function splitLongSentence(sentence: string): string[] {
  if (sentence.length <= MAX_CHUNK_LENGTH) return [sentence];
  const pieces: string[] = [];
  for (let i = 0; i < sentence.length; i += MAX_CHUNK_LENGTH) {
    pieces.push(sentence.slice(i, i + MAX_CHUNK_LENGTH));
  }
  return pieces;
}

export function buildSpeechQueue(text: string, chunked: boolean): string[] {
  const cleaned = cleanForSpeech(text);
  if (!cleaned) return [];
  if (!chunked) return [cleaned];

  const sentences = cleaned
    .split(/(?<=[。！？!?；;.\n])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap(splitLongSentence);

  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > MAX_CHUNK_LENGTH) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
