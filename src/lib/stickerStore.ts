import type { StickerItem } from '@/lib/stickers';

const DB_NAME = 'greak-stickers';
const DB_VERSION = 1;
const STORE_NAME = 'stickers';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'label' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('无法打开表情包数据库，请检查浏览器是否禁用了本地存储'));
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    transaction.onerror = () => {
      db.close();
      reject(new Error('表情包数据读写失败，请稍后再试'));
    };
    transaction.onabort = () => {
      db.close();
      reject(new Error('表情包数据读写被中断，请稍后再试'));
    };
  });
}

export async function listStickers(): Promise<StickerItem[]> {
  const items = await runTransaction<StickerItem[]>('readonly', (store) => store.getAll());
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function putSticker(item: StickerItem): Promise<void> {
  await runTransaction<IDBValidKey>('readwrite', (store) => store.put(item));
}

export async function deleteSticker(label: string): Promise<void> {
  await runTransaction<undefined>('readwrite', (store) => store.delete(label));
}
