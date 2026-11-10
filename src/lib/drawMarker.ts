export type DrawRequest = { kind: 'sticker'; label: string; prompt: string } | { kind: 'image'; prompt: string };

const DRAW_PATTERN = /\[DRAW_(STICKER|IMAGE):([^\]]*)\]/g;
const DRAW_FRAGMENT_PATTERN = /\[DRAW(?:_[A-Z]*)?(?::[^\]]*)?(?:\]|$)/g;
const STICKER_KEYWORDS = ['chibi', 'sticker', 'white background'];

function withStickerKeywords(prompt: string): string {
  const lower = prompt.toLowerCase();
  const missing = STICKER_KEYWORDS.filter((keyword) => !lower.includes(keyword));
  return [prompt, ...missing].join(', ');
}

export function parseDrawRequests(text: string): DrawRequest[] {
  const requests: DrawRequest[] = [];
  for (const match of text.matchAll(DRAW_PATTERN)) {
    const body = match[2].trim();
    if (match[1] === 'IMAGE') {
      if (body) requests.push({ kind: 'image', prompt: body });
      continue;
    }
    const separator = body.search(/[,，]/);
    if (separator < 0) continue;
    const label = body.slice(0, separator).trim();
    const prompt = body.slice(separator + 1).trim();
    if (label && prompt) requests.push({ kind: 'sticker', label, prompt: withStickerKeywords(prompt) });
  }
  return requests;
}

export function stripDrawMarkers(text: string): string {
  return text.replace(DRAW_FRAGMENT_PATTERN, '').replace(/\n{3,}/g, '\n\n').trim();
}
