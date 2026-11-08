const DRAW_PATTERN = /\[DRAW:([^\]]+)\]/g;
const DRAW_FRAGMENT_PATTERN = /\[DRAW:[^\]]*(\]|$)/g;

export function extractDrawPrompts(text: string): string[] {
  return [...text.matchAll(DRAW_PATTERN)].map((match) => match[1].trim()).filter((prompt) => prompt !== '');
}

export function stripDrawMarkers(text: string): string {
  return text.replace(DRAW_FRAGMENT_PATTERN, '').replace(/\n{3,}/g, '\n\n').trim();
}
