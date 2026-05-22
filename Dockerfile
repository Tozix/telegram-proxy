# Bun runtime — runs TypeScript directly (Bun transpiles on the fly).
FROM oven/bun:1.3 AS base
WORKDIR /app

# ---- Dependencies + Prisma client generation (production only) ----
FROM base AS deps
COPY package.json bun.lock ./
# Schema + config must be present: the postinstall hook runs `prisma generate`,
# which emits the client to /app/generated/prisma (no Rust engine in Prisma 7).
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN bun install --frozen-lockfile --production

# ---- Runtime image ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY package.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

USER bun
EXPOSE 3000
# Apply the schema (idempotent) before starting — keeps tables in sync, like the
# old DB_SYNCHRONIZE. Client is already generated at build, so skip regeneration.
CMD ["sh", "-c", "bunx prisma db push --skip-generate && bun run src/main.ts"]
