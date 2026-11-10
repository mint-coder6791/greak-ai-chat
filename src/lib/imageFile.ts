const CHAT_IMAGE_MAX_SIDE = 768;

export async function compressImageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('这张图片无法识别，请换一张 JPG 或 PNG 试试');
  });
  const scale = Math.min(1, CHAT_IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('图片处理失败，请换一张试试');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

export function readImageAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片读取失败，请换一张试试'));
    reader.readAsDataURL(file);
  });
}

export async function imageSourceToDataUrl(source: string): Promise<string> {
  if (source.startsWith('data:')) return source;
  let response: Response;
  try {
    response = await fetch(source);
  } catch {
    throw new Error('无法保存这张图片，服务商可能不允许浏览器直接下载，请稍后再试');
  }
  if (!response.ok) throw new Error('这张图片已经失效，请重新生成一次');
  return readImageAsDataUrl(await response.blob());
}
