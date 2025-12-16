import { AppSettings, GeneratedPost, DEFAULT_SETTINGS } from '../types';

const DB_NAME = 'RedNoteAI_DB';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';
const STORE_SETTINGS = 'settings';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
  });
};

export const saveHistory = async (post: GeneratedPost): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_HISTORY, 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.put(post);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getHistory = async (): Promise<GeneratedPost[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_HISTORY, 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.getAll();
    request.onsuccess = () => {
      // Sort by createdAt desc
      const results = request.result as GeneratedPost[];
      resolve(results.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteHistory = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_HISTORY, 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.put({ key: 'user_settings', ...settings });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSettings = async (): Promise<AppSettings> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SETTINGS, 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.get('user_settings');
    request.onsuccess = () => {
      if (request.result) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { key, ...data } = request.result;
        
        // Migration logic: Ensure backendUrl exists
        const mergedSettings = { ...DEFAULT_SETTINGS, ...data };
        
        if (!data.models) {
             mergedSettings.models = DEFAULT_SETTINGS.models;
        }
        
        resolve(mergedSettings as AppSettings);
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    request.onerror = () => reject(request.error);
  });
};
