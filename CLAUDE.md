# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A transparent proxy for Telegram bots (deployed at `telegram.crossmark.ru`) that works around Telegram being blocked in Russia. It has two passthrough surfaces and an admin layer:

- **Inbound webhooks** — Telegram posts updates to `POST /webhook/<secret>`; we forward them verbatim to each bot's real backend (`targetWebhookUrl`).
- **Outbound Bot API** — a drop-in replacement for `api.telegram.org`. Point a bot backend at this host (`/bot<token>/<method>`, `/file/bot<token>/<path>`) and every method is proxied verbatim, including multipart uploads.
- **Admin** — NestJS REST API (`/api/bots`, `/auth`) + a Next.js web UI (`frontend/`) to register bots and manage their webhooks.

The README ([README.md](README.md)) is the authoritative spec (in Russian); this file is the operational summary.

## Tooling: Bun only

Use **Bun** for everything — backend and frontend, install and run. Never npm/yarn/pnpm. Bun executes TypeScript directly (no build step at runtime). Type-only imports **must** use `import type` or Bun throws at runtime.

The Prisma CLI is run via Bun too: `bun run db:push` (apply schema), `bun run prisma:generate` (regenerate the client; also runs on `postinstall`).

## Commands

Backend (repo root):
```bash
bun install
bun run start:dev        # hot-reload on :3000
bun run start            # no watch
bun run typecheck        # tsc --noEmit — the real verification gate
```

Frontend ([frontend/](frontend/)):
```bash
cd frontend && bun install
bun run dev              # :3001
bun run typecheck
```

Full stack via Docker (postgres + backend + frontend):
```bash
cp .env.example .env     # set JWT_SECRET, ADMIN_*, PUBLIC_BASE_URL, DB_PASSWORD
docker compose up -d --build
```

Notes:
- **No test suite** exists (no test runner configured).
- The `lint`/`format` scripts in [package.json](package.json) reference ESLint/Prettier, but neither is installed or configured — they will fail. **`bun run typecheck` is the only working check.** Run it (in both root and `frontend/`) after changes.
- The Dockerfile runs `bun run src/main.ts` directly; `nest build` is not part of the runtime path.
- On a running backend: Swagger UI is at `/docs` (admin API only; the proxy/webhook surfaces are excluded), and a public liveness probe is at `GET /health` ([src/health.controller.ts](src/health.controller.ts)).

## Backend architecture

NestJS 11 + Prisma 7 (PostgreSQL) + Redis (ioredis). Modules: `prisma`, `redis`, `users`, `auth`, `telegram`, `bots`, `proxy` ([src/app.module.ts](src/app.module.ts)).

### Data layer: Prisma 7 (critical)

- Schema: [prisma/schema.prisma](prisma/schema.prisma). Models `User`, `Bot`, `DeliveryLog` (+ `UserRole` enum). `@@map`/`@map` keep the original snake_case table/column names.
- **Prisma 7 specifics**: the `prisma-client` generator emits the client to **`generated/prisma/`** (gitignored; import from `../../generated/prisma/client`, NOT `@prisma/client`). The datasource URL lives in [prisma.config.ts](prisma.config.ts) (`env('DATABASE_URL')`), not in the schema. The runtime connects through the **`@prisma/adapter-pg` driver adapter** ([PrismaService](src/prisma/prisma.service.ts)) — there is no Rust query engine, which suits Bun.
- **Schema sync**: `prisma db push` (no migration files — chosen for simplicity). Docker runs it on container start; locally run `bun run db:push` after editing the schema. After any schema change, the client must be regenerated (`db push` and `prisma generate` both do this).
- Global [PrismaModule](src/prisma/prisma.module.ts) exposes `PrismaService` (extends `PrismaClient`); inject it and use `prisma.user` / `prisma.bot` / `prisma.deliveryLog`.
- `allowed_updates` is a `Json?` column → read as `Prisma.JsonValue`; write `null` as `Prisma.DbNull`. `telegramBotId` is `BigInt?` → convert with `BigInt(...)` on write and `Number(...)` for the DTO.

### The proxy bypasses NestJS (critical)

The two transparent surfaces are NOT NestJS controllers — they are raw Express middleware wired in [src/main.ts](src/main.ts), and **ordering is load-bearing**:

1. `bodyParser: false` at app creation, so raw request streams (multipart) reach the proxy untouched.
2. The Bot API proxy middleware runs **first**, matching `TELEGRAM_PROXY_PATH` (`/^\/(?:file\/)?bot\d+:/`) and handing off to [ApiProxyService.handle](src/proxy/api-proxy.service.ts). It reads the raw body itself.
3. Only then are `json()`/`urlencoded()` parsers installed, for the admin API and the `/webhook/:secret` controller.

⚠️ The path regex in `main.ts` and `ApiProxyService.extractToken` must stay in agreement — change both together.

The inbound webhook (`POST /webhook/:secret`) **is** a normal controller ([WebhookController](src/proxy/webhook.controller.ts) → [WebhookService](src/proxy/webhook.service.ts)), excluded from Swagger and not behind auth. It validates the URL secret and the `X-Telegram-Bot-Api-Secret-Token` header, forwards to the backend, and **coerces backend 5xx responses to 200** so Telegram doesn't enter a retry storm (4xx is preserved). If the backend doesn't return 2xx, delivery is **retried up to `WEBHOOK_RETRY_ATTEMPTS` times** (default 3) with exponential backoff (`WEBHOOK_RETRY_DELAY_MS`); the first 2xx is passed through. Every attempt is recorded in the `delivery_logs` table with its `attempt` number.

### Bot lifecycle

[BotsService](src/bots/bots.service.ts) owns webhook registration: creating/updating a bot validates the token via `getMe` and calls Telegram `setWebhook` with `url = {PUBLIC_BASE_URL}/webhook/<secret>`. [TelegramService](src/telegram/telegram.service.ts) is a thin typed client used *only* for these self-initiated calls (getMe/setWebhook/deleteWebhook/getWebhookInfo) — all other Bot API traffic goes through the transparent proxy and never touches it. `BotsService` caches "is this token registered?" in Redis (TTL `REDIS_TOKEN_CACHE_TTL`, default 30s; used by the proxy's open-relay guard, which rejects unknown tokens with 403 unless `PROXY_ALLOW_UNREGISTERED=true`); the cache is flushed on every write. The DB is the source of truth — if Redis is down, [RedisService](src/redis/redis.service.ts) helpers swallow the error and the guard falls back to a DB count, so the proxy keeps working.

### Conventions

- **Config**: all settings flow through [src/config/configuration.ts](src/config/configuration.ts) (typed `AppConfig`), validated at boot by [src/config/env.validation.ts](src/config/env.validation.ts). Read via `config.get<T>('proxy.timeoutMs')` dot-paths — never read `process.env` directly outside `configuration.ts`.
- **Serialization**: a global `ClassSerializerInterceptor` applies class-transformer rules to every response. Controllers return DTOs built with static `Dto.from(entity)` factories (e.g. `BotResponseDto.from`), not raw entities — `webhookSecret`/`token` must not leak.
- **Validation**: global `ValidationPipe` with `whitelist + forbidNonWhitelisted + transform`; request bodies are class-validator DTOs.
- **Auth**: JWT (email+password). Admin controllers opt in with `@UseGuards(JwtAuthGuard)` per-controller; there is no global guard, which is why the webhook/proxy surfaces stay open.
- **Redis**: a global `RedisModule` exposes [RedisService](src/redis/redis.service.ts) (ioredis), used as a **cache only** — its `get/set/del/delByPattern/incrWithTtl` helpers never throw, so Redis being down degrades to a DB hit rather than an error. The client fails fast (`enableOfflineQueue:false`, `maxRetriesPerRequest:1`). Keys are namespaced via `redis.key(...)` with `REDIS_KEY_PREFIX` (we do **not** use ioredis' `keyPrefix` option, which breaks SCAN).

## Frontend architecture (BFF)

Next.js 15 App Router + Tailwind v4, `output: 'standalone'`. The browser **never** sees the JWT or talks to the backend directly:

- JWT lives in an `httpOnly` cookie (`tp_token`, [frontend/src/lib/session.ts](frontend/src/lib/session.ts)).
- All mutations go through **Server Actions** ([frontend/src/app/actions.ts](frontend/src/app/actions.ts)); pages fetch server-side via [frontend/src/lib/api.ts](frontend/src/lib/api.ts), which attaches the cookie token and bounces to `/login` on 401.
- `API_URL` (backend address) is a **server-only** env var — the browser only ever hits the Next.js server, so there's no CORS and one public port suffices.
- [frontend/src/middleware.ts](frontend/src/middleware.ts) redirects unauthenticated requests to `/login`.
- `COOKIE_SECURE=true` only when served over HTTPS, or the browser silently drops the login cookie over plain HTTP.

## Production note

Schema changes are applied with `prisma db push` (no migration history). It is convenient but cannot do safe, reviewable schema evolution — for a long-lived production DB, consider switching to `prisma migrate` (versioned migrations) to avoid data loss on schema changes.
