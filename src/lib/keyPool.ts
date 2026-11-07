import type { AppSettings, KeySlot } from '@/types';
import { HttpError } from '@/lib/openai';

export function getSlotKey(settings: AppSettings, slot: KeySlot): string {
  return (slot === 'primary' ? settings.apiKey : settings.backupApiKey).trim();
}

export function isConfigured(settings: AppSettings): boolean {
  return (
    settings.apiBaseUrl.trim() !== '' &&
    settings.model.trim() !== '' &&
    (getSlotKey(settings, 'primary') !== '' || getSlotKey(settings, 'backup') !== '')
  );
}

function slotOrder(preferred: KeySlot): KeySlot[] {
  return preferred === 'primary' ? ['primary', 'backup'] : ['backup', 'primary'];
}

export function isFailoverStatus(status: number): boolean {
  return status === 401 || status === 429 || status >= 500;
}

export async function withKeyFailover<T>(
  settings: AppSettings,
  preferred: KeySlot,
  run: (apiKey: string) => Promise<T>,
): Promise<{ value: T; slot: KeySlot }> {
  const slots = slotOrder(preferred).filter((slot) => getSlotKey(settings, slot) !== '');
  if (slots.length === 0) throw new Error('请先在总控设置中填写 API Key');
  let lastError: unknown;
  for (const slot of slots) {
    try {
      return { value: await run(getSlotKey(settings, slot)), slot };
    } catch (err) {
      if (!(err instanceof HttpError) || !isFailoverStatus(err.status)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

const CJK_PATTERN = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

export function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (CJK_PATTERN.test(ch)) cjk += 1;
    else other += 1;
  }
  return cjk + Math.ceil(other / 4);
}

export type QuotaLevel = 'unset' | 'normal' | 'warning' | 'critical';

export function quotaLevel(used: number, quota: number): QuotaLevel {
  if (quota <= 0) return 'unset';
  const ratio = used / quota;
  if (ratio >= 0.95) return 'critical';
  if (ratio >= 0.8) return 'warning';
  return 'normal';
}
