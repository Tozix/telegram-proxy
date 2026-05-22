/**
 * Seed DEMO data for visual/manual testing of the dashboard, bot list and logs.
 *
 *   bun run scripts/seed-demo.ts [botCount] [approxTotalLogs]
 *   bun run scripts/seed-demo.ts            # 24 bots, ~2500 logs (defaults)
 *   bun run scripts/seed-demo.ts --clean    # only remove previously seeded demo data
 *
 * Idempotent: every run first removes prior demo data (bots named "Demo …" and
 * their delivery logs), then recreates a fresh set. Owners are existing users
 * (admin first), assigned round-robin. Reads DATABASE_URL from .env.
 *
 * Demo bots use fake tokens and are never registered with Telegram — they exist
 * purely to populate the UI. Remove them anytime with `--clean`.
 */
import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const DAY = 24 * 60 * 60 * 1000;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number => Math.floor(min + Math.random() * (max - min + 1));

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cleanOnly = args.includes('--clean');
  const botCount = Number(args.find((a) => /^\d+$/.test(a))) || 24;
  const approxLogs = Number(args.filter((a) => /^\d+$/.test(a))[1]) || 2500;

  const url = process.env.DATABASE_URL;
  if (!url) { console.error('✗ DATABASE_URL не задан (проверьте .env)'); process.exit(1); }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    // ── wipe previous demo data ────────────────────────────────────────────
    const prior = await prisma.bot.findMany({ where: { name: { startsWith: 'Demo ' } }, select: { id: true } });
    if (prior.length) {
      const ids = prior.map((b) => b.id);
      const delLogs = await prisma.deliveryLog.deleteMany({ where: { botId: { in: ids } } });
      await prisma.bot.deleteMany({ where: { id: { in: ids } } });
      console.log(`🧹 Удалено демо: ${prior.length} ботов, ${delLogs.count} логов`);
    } else {
      console.log('🧹 Прежних демо-данных не найдено');
    }
    if (cleanOnly) { console.log('✓ Готово (--clean)'); return; }

    const users = await prisma.user.findMany({ orderBy: { role: 'asc' }, select: { id: true } });
    if (!users.length) { console.error('✗ Нет пользователей — сначала создайте админа'); process.exit(1); }

    // ── bots with varied status ────────────────────────────────────────────
    const now = Date.now();
    const errorMsgs = [
      'setWebhook failed: 401 Unauthorized',
      'Connection timed out to backend',
      'SSL handshake failed',
    ];
    const updatesVariants = [undefined, ['message'], ['message', 'callback_query'], ['message', 'edited_message', 'callback_query']];

    type BotSeed = { id: string; name: string; targetWebhookUrl: string; weight: number };
    const bots: BotSeed[] = [];
    const botRows = Array.from({ length: botCount }, (_, i) => {
      const id = randomUUID();
      const n = i + 1;
      const tgId = 600000000 + n * 1111;
      // popularity: ~5 heavy hitters, a long tail of small ones.
      const weight = i < 5 ? randInt(60, 100) : i < 12 ? randInt(20, 50) : randInt(3, 18);
      const inactive = i % 9 === 4; // a few switched off
      const errored = !inactive && i % 11 === 3; // a few with a webhook error
      const target = `https://backend-${n}.example.com/telegram/webhook`;
      bots.push({ id, name: `Demo Bot ${String(n).padStart(2, '0')}`, targetWebhookUrl: target, weight });
      return {
        id,
        userId: pick(users).id,
        name: `Demo Bot ${String(n).padStart(2, '0')}`,
        token: `${tgId}:AA${randomBytes(16).toString('hex')}`,
        telegramBotId: BigInt(tgId),
        username: `demo_bot_${n}`,
        webhookSecret: randomBytes(18).toString('hex'),
        targetWebhookUrl: target,
        allowedUpdates: pick(updatesVariants),
        isActive: !inactive,
        lastWebhookSetAt: new Date(now - randInt(0, 13) * DAY),
        webhookError: errored ? pick(errorMsgs) : null,
        createdAt: new Date(now - randInt(1, 60) * DAY),
      };
    });
    await prisma.bot.createMany({ data: botRows });
    console.log(`🤖 Создано ботов: ${botRows.length} (активных/выключенных/с ошибкой — см. дашборд)`);

    // ── delivery logs across the last 14 days ──────────────────────────────
    const totalWeight = bots.reduce((s, b) => s + b.weight, 0);
    let updateId = 1_000_000;
    const logs: {
      botId: string; updateId: string; targetUrl: string; requestBytes: number;
      responseStatus: number | null; success: boolean; errorMessage: string | null;
      durationMs: number; attempt: number; createdAt: Date;
    }[] = [];

    for (const b of bots) {
      const count = Math.max(3, Math.round((b.weight / totalWeight) * approxLogs));
      for (let i = 0; i < count; i++) {
        // recent days weighted heavier (quadratic toward today)
        const dayOffset = Math.min(13, Math.floor(13 * Math.random() ** 1.7));
        const ts = now - dayOffset * DAY - randInt(0, DAY - 1);
        const ok = Math.random() < 0.86;
        const attempt = ok ? (Math.random() < 0.12 ? 2 : 1) : randInt(1, 3);
        let responseStatus: number | null;
        let errorMessage: string | null;
        let durationMs: number;
        if (ok) {
          responseStatus = 200;
          errorMessage = null;
          durationMs = randInt(18, 420);
        } else {
          const mode = pick(['5xx', '5xx', 'timeout', '4xx']);
          responseStatus = mode === 'timeout' ? null : mode === '4xx' ? pick([400, 404, 409]) : pick([500, 502, 503]);
          errorMessage = mode === 'timeout' ? 'backend timeout after 25000ms'
            : mode === '4xx' ? `backend responded ${responseStatus}`
            : `backend responded ${responseStatus}`;
          durationMs = mode === 'timeout' ? 25000 : randInt(120, 1800);
        }
        logs.push({
          botId: b.id,
          updateId: String(updateId++),
          targetUrl: b.targetWebhookUrl,
          requestBytes: randInt(180, 4200),
          responseStatus,
          success: ok,
          errorMessage,
          durationMs,
          attempt,
          createdAt: new Date(ts),
        });
      }
    }

    // shuffle so createdAt isn't grouped per-bot, then batch insert
    for (let i = logs.length - 1; i > 0; i--) { const j = randInt(0, i); [logs[i], logs[j]] = [logs[j], logs[i]]; }
    const BATCH = 1000;
    for (let i = 0; i < logs.length; i += BATCH) {
      await prisma.deliveryLog.createMany({ data: logs.slice(i, i + BATCH) });
    }
    const ok = logs.filter((l) => l.success).length;
    console.log(`📦 Создано логов доставок: ${logs.length} (успешных ${ok}, ошибок ${logs.length - ok})`);
    console.log('✓ Демо-данные готовы. Удалить: bun run scripts/seed-demo.ts --clean');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => { console.error('✗', (err as Error).message); process.exit(1); });
