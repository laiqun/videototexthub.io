const DB_NAME = 'image-describer-history';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export const IMAGE_DESCRIBER_HISTORY_LIMIT = 200;
export const IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT =
  'image-describer-history-updated';

export interface ImageDescriberHistoryEntry {
  id: string;
  createdAt: number;
  file: Blob;
  fileName: string;
  fileType: string;
  fileLastModified: number;
  results: string[];
  prompt?: string;
  language?: string;
}

export interface ImageDescriberHistoryItem {
  id: string;
  createdAt: number;
  file: File;
  results: string[];
  prompt?: string;
  language?: string;
}

const isHistorySupported = () => {
  return typeof window !== 'undefined' && 'indexedDB' in window;
};

const openHistoryDb = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        return;
      }

      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('createdAt', 'createdAt');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open history database'));
    };
  });
};

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  task: (store: IDBObjectStore) => void | Promise<void>,
  onComplete: () => T
) => {
  const db = await openHistoryDb();

  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);

      void Promise.resolve(task(store)).catch(reject);

      tx.oncomplete = () => resolve(onComplete());
      tx.onerror = () =>
        reject(tx.error ?? new Error('History transaction failed'));
      tx.onabort = () =>
        reject(tx.error ?? new Error('History transaction aborted'));
    });
  } finally {
    db.close();
  }
};

const pruneHistory = async (maxEntries: number) => {
  await runTransaction(
    'readwrite',
    (store) => {
      const index = store.index('createdAt');
      let seen = 0;

      const request = index.openCursor(null, 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          return;
        }

        seen += 1;
        if (seen > maxEntries) {
          cursor.delete();
        }
        cursor.continue();
      };
    },
    () => undefined
  );
};

export const isImageDescriberHistorySupported = () => isHistorySupported();

export const saveImageDescriberHistoryEntries = async (
  entries: ImageDescriberHistoryEntry[]
) => {
  if (!isHistorySupported() || entries.length === 0) {
    return;
  }

  await runTransaction(
    'readwrite',
    (store) => {
      for (const entry of entries) {
        store.put(entry);
      }
    },
    () => undefined
  );

  await pruneHistory(IMAGE_DESCRIBER_HISTORY_LIMIT);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT));
  }
};

export const loadImageDescriberHistory = async (
  limit = IMAGE_DESCRIBER_HISTORY_LIMIT
) => {
  if (!isHistorySupported()) {
    return [] as ImageDescriberHistoryItem[];
  }

  const items: ImageDescriberHistoryItem[] = [];

  return await runTransaction(
    'readonly',
    (store) => {
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          return;
        }

        const raw = cursor.value as ImageDescriberHistoryEntry;
        const fileBlob = raw.file;

        if (!fileBlob) {
          cursor.continue();
          return;
        }

        const file = new File([fileBlob], raw.fileName || 'image', {
          type: raw.fileType || 'image/*',
          lastModified: raw.fileLastModified || raw.createdAt,
        });

        items.push({
          id: raw.id,
          createdAt: raw.createdAt,
          file,
          results: Array.isArray(raw.results) ? raw.results : [],
          prompt: raw.prompt,
          language: raw.language,
        });

        if (items.length < limit) {
          cursor.continue();
        }
      };
    },
    () => items
  );
};

export const clearImageDescriberHistory = async (options?: {
  silent?: boolean;
}) => {
  if (!isHistorySupported()) {
    return;
  }

  await runTransaction(
    'readwrite',
    (store) => {
      store.clear();
    },
    () => undefined
  );

  if (!options?.silent && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT));
  }
};

export const deleteImageDescriberHistoryEntry = async (
  id: string,
  options?: { silent?: boolean }
) => {
  if (!isHistorySupported()) {
    return;
  }

  await runTransaction(
    'readwrite',
    (store) => {
      store.delete(id);
    },
    () => undefined
  );

  if (!options?.silent && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(IMAGE_DESCRIBER_HISTORY_UPDATED_EVENT));
  }
};
