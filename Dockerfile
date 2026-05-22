# Bun runtime — runs TypeScript directly (Bun transpiles on the fly).
FROM oven/bun:1.3 AS base
WORKDIR /app

# ---- Dependencies (production only) ----
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- Runtime image ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src

USER bun
EXPOSE 3000
CMD ["bun", "run", "src/main.ts"]
