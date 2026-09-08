/**
 * High-Performance In-Memory TTL & LRU Store Cache
 * Protects server and target stores by caching scraped results for 5 minutes.
 */

class StoreCache {
  constructor(maxEntries = 500, defaultTtlSeconds = 300) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.defaultTtl = defaultTtlSeconds * 1000;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * Generates a normalized consistent cache key
   */
  generateKey(url, engine = 'auto', limit = 50) {
    if (!url) return '';
    try {
      const parsed = new URL(url.trim());
      // Normalize domain and pathname, keep query only if relevant
      const cleanUrl = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/+$/, '')}`;
      return `scrape:${cleanUrl}|eng:${engine}|lim:${limit}`;
    } catch (e) {
      return `scrape:${url.trim().toLowerCase().replace(/\/+$/, '')}|eng:${engine}|lim:${limit}`;
    }
  }

  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const item = this.cache.get(key);
    const now = Date.now();

    if (now > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.stats.hits++;

    return item.data;
  }

  set(key, data, ttlSeconds) {
    if (!key || !data) return;

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const ttlMs = (ttlSeconds !== undefined ? ttlSeconds : (this.defaultTtl / 1000)) * 1000;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: new Date().toISOString()
    });

    this.stats.sets++;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: (this.stats.hits + this.stats.misses) > 0 
        ? `${((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)}%` 
        : '0%'
    };
  }
}

const catalogCache = new StoreCache(500, 300); // 500 items max, 5 minutes TTL

module.exports = {
  catalogCache,
  StoreCache
};
