export const STICKER_TAGS = ['happy', 'shy', 'tsundere', 'thinking', 'speechless'] as const;

export type StickerTag = (typeof STICKER_TAGS)[number];

export type StickerLibrary = Partial<Record<StickerTag, string>>;

export const STICKER_LABELS: Record<StickerTag, string> = {
  happy: '开心',
  shy: '害羞',
  tsundere: '傲娇',
  thinking: '思考',
  speechless: '无语',
};

export const STICKER_FALLBACK_EMOJI: Record<StickerTag, string> = {
  happy: '🥰',
  shy: '😳',
  tsundere: '😤',
  thinking: '🤔',
  speechless: '😶',
};

export const MAX_STICKER_BYTES = 300 * 1024;

export function isStickerTag(value: string): value is StickerTag {
  return (STICKER_TAGS as readonly string[]).includes(value);
}
