const DB_NAME = 'greak';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const PORTRAIT_KEY = 'greak_bg';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('无法打开本地存储'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error('本地存储读写失败'));
      tx.onabort = () => reject(tx.error ?? new Error('本地存储读写中断'));
    });
  } finally {
    db.close();
  }
}

export async function loadPortraitBlob(): Promise<Blob | null> {
  const blob = await withStore<Blob | undefined>('readonly', (store) => store.get(PORTRAIT_KEY));
  return blob ?? null;
}

export async function savePortraitBlob(blob: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(blob, PORTRAIT_KEY));
  try {
    localStorage.removeItem(PORTRAIT_KEY);
  } catch {
    // Legacy entry may be absent or storage unavailable; the IndexedDB copy is authoritative.
  }
}

export async function clearPortraitBlob(): Promise<void> {
  await withStore('readwrite', (store) => store.delete(PORTRAIT_KEY));
}
