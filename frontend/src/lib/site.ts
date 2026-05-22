/**
 * Public site configuration. All values are overridable via NEXT_PUBLIC_* env
 * vars so a deployment shows its own domain in the docs without code changes.
 * Defaults are generic placeholders — no real domain is hard-coded.
 */
import { cache } from 'react';
import { API_URL } from './api';

/**
 * Public origin of the proxy, shown in the integration examples.
 *
 * Resolved automatically (server-side) from the backend's PUBLIC_BASE_URL — the
 * very origin Telegram uses to reach this service — so the docs always show the
 * REAL deployed domain with no manual editing and no rebuild when the domain
 * changes. `NEXT_PUBLIC_PROXY_HOST` still overrides it (e.g. split deployments).
 * `cache()` dedupes the lookup within a single render.
 */
export const getProxyHost = cache(async (): Promise<string> => {
  const override = process.env.NEXT_PUBLIC_PROXY_HOST;
  if (override) return override.replace(/\/+$/, '');
  try {
    const res = await fetch(`${API_URL}/public-config`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = (await res.json()) as { proxyHost?: string };
      if (data.proxyHost) return data.proxyHost.replace(/\/+$/, '');
    }
  } catch {
    /* backend unreachable at render time — fall back to the placeholder */
  }
  return 'https://proxy.example.com';
});

/** Where the Swagger UI lives. Behind the bundled nginx this is `/docs`. */
export const SWAGGER_URL = process.env.NEXT_PUBLIC_SWAGGER_URL || '/docs';

/** Repository link for the public-repo header. */
export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/Tozix/telegram-proxy';
