import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';

/**
 * Thin wrapper around a single ioredis connection.
 *
 * Redis is used here purely as a **cache** (and a building block for future
 * rate limiting) — the database is always the source of truth. Every helper
 * therefore swallows connection errors and degrades gracefully: a read returns
 * `null`, a write is dropped. The client is configured to fail fast rather than
 * queue commands while Redis is down, so callers fall straight back to the DB.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private errorLogged = false;
  private readonly prefix: string;

  /** Raw ioredis client. Prefer the helper methods, which never throw. */
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.prefix = config.get<string>('redis.keyPrefix') ?? '';

    const options: RedisOptions = {
      // Fail fast instead of buffering commands while Redis is unreachable, so
      // callers can fall back to the database without hanging the request.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
    };

    const url = config.get<string>('redis.url');
    this.client = url
      ? new Redis(url, options)
      : new Redis({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
          db: config.get<number>('redis.db'),
          ...options,
        });

    this.client.on('connect', () => {
      this.errorLogged = false;
      this.logger.log('Connected to Redis');
    });
    // ioredis emits 'error' on every failed reconnect; log once per outage so
    // an unreachable Redis doesn't flood the logs.
    this.client.on('error', (err: Error) => {
      if (!this.errorLogged) {
        this.logger.warn(`Redis unavailable, falling back to DB: ${err.message}`);
        this.errorLogged = true;
      }
    });
  }

  /** Build a namespaced key, e.g. `key('reg', token)` -> `tgproxy:reg:<token>`. */
  key(...parts: string[]): string {
    return this.prefix + parts.join(':');
  }

  /** Returns the cached value, or `null` on a miss or if Redis is unavailable. */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  /** Best-effort write with an optional TTL (seconds). Never throws. */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // best-effort cache write
    }
  }

  /** Best-effort delete of one or more keys. Never throws. */
  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch {
      // best-effort cache invalidation
    }
  }

  /**
   * Atomically increment a counter, setting its TTL on the first hit. Returns
   * the new count, or `null` if Redis is unavailable. Building block for
   * Redis-backed rate limiting (fixed-window counters).
   */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
    try {
      const count = await this.client.incr(key);
      if (count === 1) await this.client.expire(key, ttlSeconds);
      return count;
    } catch {
      return null;
    }
  }

  /**
   * Delete every key matching a glob pattern using a non-blocking SCAN.
   * Keys must be passed with their full prefix (we do not use ioredis'
   * `keyPrefix` option, which does not apply to SCAN MATCH).
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      const keys: string[] = [];
      for await (const batch of stream as AsyncIterable<string[]>) {
        keys.push(...batch);
      }
      if (keys.length) await this.client.del(...keys);
    } catch {
      // best-effort cache invalidation
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
