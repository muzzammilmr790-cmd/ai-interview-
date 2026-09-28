// IndexedDB Media Storage Service for persistent video & audio blob storage across browser reloads

const DB_NAME = 'JobPilotMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export const mediaStorageService = {
  /**
   * Save a video/audio Blob into IndexedDB for persistent access.
   * Returns a persistent key identifier (e.g. `idb:sessionId_questionId`).
   */
  async saveRecording(sessionId: string, questionId: string, blob: Blob): Promise<string> {
    try {
      const db = await openDB();
      const key = `${sessionId}_${questionId}`;
      
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(blob, key);

        req.onsuccess = () => {
          resolve(`idb:${key}`);
        };

        req.onerror = () => {
          reject(req.error);
        };
      });
    } catch (err) {
      console.warn('Failed to save recording to IndexedDB:', err);
      // Fallback: create temporary blob URL if IDB fails
      return URL.createObjectURL(blob);
    }
  },

  /**
   * Retrieve a Blob from IndexedDB by key or by sessionId + questionId.
   */
  async getRecordingBlob(keyOrSessionId: string, questionId?: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      const key = questionId ? `${keyOrSessionId}_${questionId}` : keyOrSessionId.replace(/^idb:/, '');

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve((req.result as Blob) || null);
        };

        req.onerror = () => {
          reject(req.error);
        };
      });
    } catch (err) {
      console.warn('Failed to fetch recording from IndexedDB:', err);
      return null;
    }
  },

  /**
   * Get an active Object URL for video playback.
   */
  async getRecordingUrl(keyOrSessionId: string, questionId?: string): Promise<string | null> {
    const blob = await this.getRecordingBlob(keyOrSessionId, questionId);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  },

  /**
   * Delete all stored recordings associated with a session ID.
   */
  async deleteRecordingsForSession(sessionId: string): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const keysReq = store.getAllKeys();
      keysReq.onsuccess = () => {
        const keys = keysReq.result as string[];
        for (const key of keys) {
          if (typeof key === 'string' && key.startsWith(`${sessionId}_`)) {
            store.delete(key);
          }
        }
      };
    } catch (err) {
      console.warn('Failed to delete recordings from IndexedDB:', err);
    }
  },

  /**
   * Clear all stored recordings.
   */
  async clearAllRecordings(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
    } catch (err) {
      console.warn('Failed to clear IndexedDB media store:', err);
    }
  },
};
