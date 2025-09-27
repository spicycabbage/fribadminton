// Simple in-memory cache for analytics data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const analyticsCache = new SimpleCache();

// Clean up expired entries every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    analyticsCache.cleanup();
  }, 10 * 60 * 1000);
}

// Cache keys
export const CACHE_KEYS = {
  PLAYER_STATS: 'player-stats',
  HEAD_TO_HEAD: (playerName: string) => `head-to-head:${playerName}`,
  PARTNERSHIP_STATS: (player1: string, player2: string) => `partnership:${player1}:${player2}`,
  ALL_PLAYERS: 'all-players'
};

// Cache TTL (5 minutes)
export const CACHE_TTL = 5 * 60 * 1000;
