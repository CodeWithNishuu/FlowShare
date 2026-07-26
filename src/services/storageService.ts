/**
 * Storage Service for FlowShare
 * IndexedDB backed storage engine for cached received file blobs, partial chunks for resume capability,
 * active transfer session persistence, and automatic download triggering.
 */
class StorageService {
  private dbName = 'FlowShareDB';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('fileBlobs')) {
          db.createObjectStore('fileBlobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('partialChunks')) {
          db.createObjectStore('partialChunks', { keyPath: ['fileId', 'chunkIdx'] });
        }
        if (!db.objectStoreNames.contains('activeSessions')) {
          db.createObjectStore('activeSessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('trustedDevices')) {
          db.createObjectStore('trustedDevices', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        console.warn('IndexedDB unavailable, falling back to in-memory URL blobs:', event);
        resolve();
      };
    });
  }

  async saveBlob(id: string, blob: Blob, fileName: string): Promise<string> {
    await this.init();
    const blobUrl = URL.createObjectURL(blob);

    if (this.db) {
      try {
        const tx = this.db.transaction('fileBlobs', 'readwrite');
        const store = tx.objectStore('fileBlobs');
        store.put({ id, blob, fileName, createdAt: Date.now() });
      } catch (err) {
        console.error('Failed to store blob in IndexedDB:', err);
      }
    }

    return blobUrl;
  }

  async getBlob(id: string): Promise<Blob | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('fileBlobs', 'readonly');
        const store = tx.objectStore('fileBlobs');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  // --- Partial Chunks Persistence for Resume ---
  async saveChunk(fileId: string, chunkIdx: number, chunkBuffer: ArrayBuffer): Promise<void> {
    await this.init();
    if (!this.db) return;
    try {
      const tx = this.db.transaction('partialChunks', 'readwrite');
      const store = tx.objectStore('partialChunks');
      store.put({ fileId, chunkIdx, data: chunkBuffer, timestamp: Date.now() });
    } catch (err) {
      console.error('Failed to persist chunk in IndexedDB:', err);
    }
  }

  async getStoredChunks(fileId: string): Promise<Map<number, ArrayBuffer>> {
    await this.init();
    const result = new Map<number, ArrayBuffer>();
    if (!this.db) return result;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('partialChunks', 'readonly');
        const store = tx.objectStore('partialChunks');
        const req = store.getAll();

        req.onsuccess = () => {
          if (Array.isArray(req.result)) {
            req.result.forEach((item: any) => {
              if (item.fileId === fileId) {
                result.set(item.chunkIdx, item.data);
              }
            });
          }
          resolve(result);
        };
        req.onerror = () => resolve(result);
      } catch (err) {
        resolve(result);
      }
    });
  }

  async clearChunksForFile(fileId: string): Promise<void> {
    await this.init();
    if (!this.db) return;
    try {
      const tx = this.db.transaction('partialChunks', 'readwrite');
      const store = tx.objectStore('partialChunks');
      const req = store.getAllKeys();
      req.onsuccess = () => {
        if (Array.isArray(req.result)) {
          req.result.forEach((key: any) => {
            if (Array.isArray(key) && key[0] === fileId) {
              store.delete(key);
            }
          });
        }
      };
    } catch (err) {
      console.error('Failed to clear file chunks from IndexedDB:', err);
    }
  }

  // --- Session State Recovery ---
  async saveSessionState(session: any): Promise<void> {
    await this.init();
    if (!this.db) return;
    try {
      const tx = this.db.transaction('activeSessions', 'readwrite');
      const store = tx.objectStore('activeSessions');
      // Store session without non-serializable properties
      const { files, ...rest } = session;
      const safeFiles = files.map((f: any) => {
        const { fileObj, ...fRest } = f;
        return fRest;
      });
      store.put({ ...rest, files: safeFiles, updatedAt: Date.now() });
    } catch (err) {
      console.error('Failed to save session state to IndexedDB:', err);
    }
  }

  async getSavedSession(): Promise<any | null> {
    await this.init();
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('activeSessions', 'readonly');
        const store = tx.objectStore('activeSessions');
        const req = store.getAll();
        req.onsuccess = () => {
          if (Array.isArray(req.result) && req.result.length > 0) {
            // Sort by latest updated
            req.result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            resolve(req.result[0]);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  }

  async clearSessionState(sessionId: string): Promise<void> {
    await this.init();
    if (!this.db) return;
    try {
      const tx = this.db.transaction('activeSessions', 'readwrite');
      const store = tx.objectStore('activeSessions');
      store.delete(sessionId);
    } catch (err) {}
  }

  triggerDownload(blob: Blob | string, fileName: string) {
    const url = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof blob !== 'string') {
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }
}

export default new StorageService();
