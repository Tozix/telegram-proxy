/**
 * Public site configuration. All values are overridable via NEXT_PUBLIC_* env
 * vars so a deployment shows its own domain in the docs without code changes.
 * Defaults are generic placeholders — no real domain is hard-coded.
 */

/** Public origin of the proxy, shown in the integration examples. */
export const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST || 'https://proxy.example.com';

/** Where the Swagger UI lives. Behind the bundled nginx this is `/docs`. */
export const SWAGGER_URL = process.env.NEXT_PUBLIC_SWAGGER_URL || '/docs';

/** Repository link for the public-repo header. */
export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com';
