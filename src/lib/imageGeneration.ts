import { assertOk } from '@/lib/openai';
import { compressImageToDataUrl } from '@/lib/imageFile';

export interface ImageConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ImageResponse {
  data?: { url?: string; b64_json?: string }[];
}

export async function generateImage({
  config,
  prompt,
  signal,
}: {
  config: ImageConfig;
  prompt: string;
  signal: AbortSignal;
}): Promise<string> {
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, '');
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey.trim()}` },
      signal,
      body: JSON.stringify({ model: config.model.trim(), prompt, n: 1, size: '1024x1024' }),
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error('画图请求没有到达生图接口，可能是浏览器跨域限制或网络问题');
  }
  await assertOk(res);

  const data = (await res.json()) as ImageResponse;
  const item = data.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) {
    const blob = await (await fetch(`data:image/png;base64,${item.b64_json}`)).blob();
    return compressImageToDataUrl(new File([blob], 'generated.png', { type: 'image/png' }));
  }
  throw new Error('生图接口返回的数据格式不正确');
}
