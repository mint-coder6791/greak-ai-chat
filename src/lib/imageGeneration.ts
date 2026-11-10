import { assertOk } from '@/lib/openai';

export const REFERENCE_IMAGE_MODEL = 'wan2.6-image';

export interface ImageConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface MultimodalImageResponse {
  output?: { choices?: { message?: { content?: { image?: string }[] } }[] };
}

export async function generateImage({
  config,
  prompt,
  referenceImage,
  signal,
}: {
  config: ImageConfig;
  prompt: string;
  referenceImage?: string;
  signal: AbortSignal;
}): Promise<string> {
  const content = referenceImage ? [{ image: referenceImage }, { text: prompt }] : [{ text: prompt }];
  const model = referenceImage ? REFERENCE_IMAGE_MODEL : config.model.trim();

  let res: Response;
  try {
    res = await fetch(config.baseUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey.trim()}` },
      signal,
      body: JSON.stringify({
        model,
        input: { messages: [{ role: 'user', content }] },
        parameters: { size: '1024*1024', n: 1, watermark: false },
      }),
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new Error('画图请求没有到达生图接口，可能是浏览器跨域限制或网络问题');
  }
  await assertOk(res);

  const data = (await res.json()) as MultimodalImageResponse;
  const image = data.output?.choices?.[0]?.message?.content?.find((part) => part.image)?.image;
  if (!image) throw new Error('生图接口返回的数据格式不正确');
  return image;
}
