import { assertOk } from '@/lib/openai';
import { imageSourceToDataUrl } from '@/lib/imageFile';
import { putSticker } from '@/lib/stickerStore';
import { MAX_STICKER_LABEL_LENGTH } from '@/lib/stickers';

export const MAX_GIPHY_IMPORT = 30;

// Dev traffic goes through the vite proxy; production calls GIPHY directly, which allows browser requests.
const GIPHY_SEARCH_URL = import.meta.env.DEV ? '/api/giphy/search' : 'https://api.giphy.com/v1/gifs/search';

interface GiphySearchResponse {
  data?: { images?: { fixed_width_small?: { url?: string } } }[];
}

interface ImportOptions {
  apiKey: string;
  query: string;
  limit: number;
  signal?: AbortSignal;
}

async function searchGifUrls(apiKey: string, query: string, limit: number, signal?: AbortSignal): Promise<string[]> {
  const params = new URLSearchParams({ api_key: apiKey, q: query, limit: String(limit), rating: 'g' });
  const res = await fetch(`${GIPHY_SEARCH_URL}?${params.toString()}`, { signal });
  await assertOk(res);
  const body = (await res.json()) as GiphySearchResponse;
  return (body.data ?? [])
    .map((gif) => gif.images?.fixed_width_small?.url)
    .filter((url): url is string => Boolean(url));
}

function toStickerLabelBase(query: string): string {
  return query.replace(/[\s[\]，,:：]/g, '').slice(0, MAX_STICKER_LABEL_LENGTH - String(MAX_GIPHY_IMPORT).length);
}

export async function importGiphyStickers({ apiKey, query, limit, signal }: ImportOptions): Promise<string[]> {
  const key = apiKey.trim();
  if (!key) throw new Error('请先在表情包库中填写 GIPHY API Key');
  const q = query.trim();
  const base = toStickerLabelBase(q);
  if (!base) throw new Error('搜索关键词不能为空');

  const count = Number.isFinite(limit) ? Math.min(MAX_GIPHY_IMPORT, Math.max(1, Math.floor(limit))) : MAX_GIPHY_IMPORT;
  const urls = await searchGifUrls(key, q, count, signal);
  if (urls.length === 0) throw new Error(`GIPHY 上没有找到「${q}」相关的表情包`);

  const downloads = await Promise.allSettled(urls.map((url) => imageSourceToDataUrl(url)));
  const labels: string[] = [];
  for (const [index, result] of downloads.entries()) {
    if (result.status !== 'fulfilled') continue;
    const label = `${base}${index + 1}`;
    await putSticker({ label, dataUrl: result.value, createdAt: Date.now() });
    labels.push(label);
  }
  if (labels.length === 0) throw new Error('表情包下载失败，请稍后再试');
  return labels;
}
