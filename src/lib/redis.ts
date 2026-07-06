import "server-only";

import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Read-through JSON cache. Falls back to the loader on any Redis
 * failure so a cache outage never breaks a request.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // cache unavailable — fall through to loader
  }
  const value = await loader();
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // best-effort write
  }
  return value;
}
