export interface StickerItem {
  label: string;
  dataUrl: string;
  createdAt: number;
}

export type StickerLibrary = Record<string, string>;

export const MAX_STICKER_LABEL_LENGTH = 12;

export const MAX_STICKER_UPLOAD_BYTES = 5 * 1024 * 1024;

export const LEGACY_STICKER_LABELS: Record<string, string> = {
  happy: '开心',
  shy: '害羞',
  tsundere: '傲娇',
  thinking: '思考',
  speechless: '无语',
};
