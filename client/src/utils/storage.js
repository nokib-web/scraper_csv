/**
 * High-Capacity IndexedDB Storage Helper for storing 50,000+ products
 * Bypasses the 5MB localStorage limit completely.
 */

const DB_NAME = 'getproducts_db';
const DB_VERSION = 1;
const STORE_NAME = 'catalog_store';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCatalogData(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
    // Safe fallback to localStorage with truncation
    try {
      if (Array.isArray(value)) {
        localStorage.setItem(key, JSON.stringify(value.slice(0, 100)));
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {}
  }
}

export async function loadCatalogData(key, fallback = null) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : fallback);
      req.onerror = () => resolve(fallback);
    });
  } catch (err) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  }
}

export async function clearCatalogData() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {}
  try {
    localStorage.removeItem('getproducts_saved_products');
    localStorage.removeItem('getproducts_saved_detection');
    localStorage.removeItem('getproducts_last_url');
    localStorage.removeItem('getproducts_saved_logs');
  } catch (e) {}
}
