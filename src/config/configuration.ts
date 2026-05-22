/**
 * Centralised, typed application configuration built from environment variables.
 * Values are validated separately in {@link ./env.validation.ts} before this runs.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  /** Public origin under which Telegram reaches this service, e.g. https://telegram.crossmark.ru */
  publicBaseUrl: string;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  admin: {
    email: string;
    password: string;
  };
  telegram: {
    /** Upstream Telegram API origin (proxied to). */
    apiBase: string;
  };
  redis: {
    /** Full connection URL (redis://...). When set, host/port/password/db are ignored. */
    url: string | undefined;
    host: string;
    port: number;
    password: string;
    db: number;
    /** Prefix prepended to every key this service writes. */
    keyPrefix: string;
    /** TTL (seconds) for the "is this token registered?" proxy guard cache. */
    tokenCacheTtlSeconds: number;
  };
  proxy: {
    /** Allow proxying Bot API calls for tokens that are not registered in the admin. */
    allowUnregistered: boolean;
    /** Timeout for transparent Bot API proxy requests (ms). */
    timeoutMs: number;
    /** Timeout for forwarding an incoming webhook to the real backend (ms). */
    webhookForwardTimeoutMs: number;
    /** Max request body size accepted by the proxy, in megabytes. */
    maxUploadMb: number;
  };
}

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 3000),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? 'https://telegram.crossmark.ru').replace(/\/+$/, ''),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toInt(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'telegram_proxy',
    synchronize: toBool(process.env.DB_SYNCHRONIZE, true),
    logging: toBool(process.env.DB_LOGGING, false),
    ssl: toBool(process.env.DB_SSL, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.ADMIN_PASSWORD ?? 'admin12345',
  },
  telegram: {
    apiBase: (process.env.TELEGRAM_API_BASE ?? 'https://api.telegram.org').replace(/\/+$/, ''),
  },
  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
    db: toInt(process.env.REDIS_DB, 0),
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'tgproxy:',
    tokenCacheTtlSeconds: toInt(process.env.REDIS_TOKEN_CACHE_TTL, 30),
  },
  proxy: {
    allowUnregistered: toBool(process.env.PROXY_ALLOW_UNREGISTERED, false),
    timeoutMs: toInt(process.env.PROXY_TIMEOUT_MS, 30000),
    webhookForwardTimeoutMs: toInt(process.env.WEBHOOK_FORWARD_TIMEOUT_MS, 25000),
    maxUploadMb: toInt(process.env.MAX_UPLOAD_MB, 50),
  },
});
