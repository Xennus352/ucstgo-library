const DB_NAME = "ebook-cache-db";
const STORE = "ebooks";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedEbook(url: string): Promise<Blob | null> {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);

    const req = store.get(url);

    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function cacheEbook(url: string, blob: Blob) {
  const db = await openDB();

  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);

  store.put(blob, url);
}

export async function fetchEbookOfflineSafe(url: string): Promise<string> {
  // 1. check cache first
  const cached = await getCachedEbook(url);

  if (cached instanceof Blob) {
    return URL.createObjectURL(cached);
  }

  // 2. fetch from network
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch ebook");
  }

  const blob = await res.blob();

  // 3. save to cache
  await cacheEbook(url, blob);

  return URL.createObjectURL(blob);
}
