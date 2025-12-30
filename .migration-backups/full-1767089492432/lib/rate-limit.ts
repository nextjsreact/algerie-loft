/**
 * Simple rate limiting utility
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

const cache = new Map();

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (limit: number, token: string) => {
      const now = Date.now();
      const tokenKey = `${token}`;
      const windowStart = now - config.interval;

      // Clean old entries
      for (const [key, value] of cache.entries()) {
        if (value.timestamp < windowStart) {
          cache.delete(key);
        }
      }

      const tokenData = cache.get(tokenKey) || { count: 0, timestamp: now };
      
      if (tokenData.timestamp < windowStart) {
        tokenData.count = 1;
        tokenData.timestamp = now;
      } else {
        tokenData.count++;
      }

      cache.set(tokenKey, tokenData);

      return {
        success: tokenData.count <= limit,
        limit,
        remaining: Math.max(0, limit - tokenData.count),
        reset: new Date(tokenData.timestamp + config.interval)
      };
    }
  };
}