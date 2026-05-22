import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/CodeBlock';
import { PROXY_HOST, SWAGGER_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

/* ── small building blocks ─────────────────────────────────────────────── */

function DiffBlock() {
  const lines = [
    { t: '  const bot = new Bot(token, {', k: ' ' as const },
    { t: '-   client: { apiRoot: "https://api.telegram.org" },', k: '-' as const },
    { t: `+   client: { apiRoot: "${PROXY_HOST}" },`, k: '+' as const },
    { t: '  });', k: ' ' as const },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1320] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 font-mono text-[11px] text-slate-500">одно изменение — и всё работает</span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-[1.8]">
        <code className="font-mono">
          {lines.map((l, i) => (
            <span
              key={i}
              className={
                l.k === '+'
                  ? 'block bg-green-500/10 text-green-300'
                  : l.k === '-'
                    ? 'block bg-red-500/10 text-red-300/80'
                    : 'block text-slate-300'
              }
            >
              {l.t || ' '}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function Node({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <div
      className={`flex-1 rounded-lg border px-3 py-3 text-center font-mono text-xs ${
        accent
          ? 'border-tg-500/50 bg-tg-500/10 text-tg-200 shadow-[0_0_30px_-8px] shadow-tg-500/50'
          : 'border-white/10 bg-white/[0.03] text-slate-300'
      }`}
    >
      {children}
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center px-1 text-slate-500">
      <span className="font-mono text-[10px] text-slate-500">{label}</span>
      <span className="text-tg-400">→</span>
    </div>
  );
}

function Flow({ title, nodes }: { title: string; nodes: { label?: string; text: ReactNode; accent?: boolean }[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="mb-4 text-sm font-medium text-slate-400">{title}</p>
      <div className="flex items-stretch gap-1">
        {nodes.map((n, i) => (
          <FlowItem key={i} first={i === 0} label={n.label} accent={n.accent}>
            {n.text}
          </FlowItem>
        ))}
      </div>
    </div>
  );
}

function FlowItem({ first, label, accent, children }: { first: boolean; label?: string; accent?: boolean; children: ReactNode }) {
  return (
    <>
      {!first && <Arrow label={label ?? ''} />}
      <Node accent={accent}>{children}</Node>
    </>
  );
}

function Feature({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-tg-500/30 hover:bg-white/[0.04]">
      <h3 className="mb-1.5 font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              self-hosted · open source
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Telegram-боты там,
              <br />
              где Telegram{' '}
              <span className="bg-gradient-to-r from-tg-400 to-tg-600 bg-clip-text text-transparent">заблокирован</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              Прозрачный прокси для Bot API и вебхуков. Разверните на зарубежном сервере,
              поменяйте один URL — и боты снова работают. Совместимо с любой библиотекой.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/guide"
                className="rounded-lg bg-tg-500 px-5 py-2.5 text-sm font-semibold text-[#06243a] transition hover:bg-tg-400"
              >
                Документация →
              </Link>
              <a
                href={SWAGGER_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                Swagger API
              </a>
              <Link href="/login" className="px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:text-white">
                Войти в админку
              </Link>
            </div>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <DiffBlock />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-white">Как это работает</h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          Две сквозные поверхности: приём вебхуков от Telegram и прозрачный исходящий Bot API.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Flow
            title="Входящие вебхуки"
            nodes={[
              { text: 'Telegram' },
              { label: '/webhook', text: 'Прокси', accent: true },
              { label: 'forward', text: 'Ваш бэкенд' },
            ]}
          />
          <Flow
            title="Исходящий Bot API"
            nodes={[
              { text: 'Ваш бэкенд' },
              { label: '/bot…', text: 'Прокси', accent: true },
              { label: 'proxy', text: 'api.telegram.org' },
            ]}
          />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-white">Возможности</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature title="Прозрачный Bot API">
            Drop-in замена <span className="font-mono text-tg-300">api.telegram.org</span>: любой метод и
            content-type, включая multipart-загрузку и скачивание файлов.
          </Feature>
          <Feature title="Входящие вебхуки">
            Принимаем апдейты от Telegram и пересылаем на ваш бэкенд, пробрасывая
            заголовок <span className="font-mono text-tg-300">secret_token</span>.
          </Feature>
          <Feature title="Повторные доставки">
            Если бэкенд не ответил 2xx — до 3 повторов с экспоненциальной паузой. Каждая
            попытка попадает в журнал.
          </Feature>
          <Feature title="Защита от open-relay">
            Проксируются только токены ботов, зарегистрированных в админке. Проверка
            кэшируется в Redis.
          </Feature>
          <Feature title="Веб-админка">
            Регистрация ботов, переустановка вебхука, живой <span className="font-mono text-tg-300">getWebhookInfo</span> и
            журнал доставок с навигацией.
          </Feature>
          <Feature title="Swagger / OpenAPI">
            Документированный админ-API с авторизацией по JWT — пробуйте методы прямо
            из браузера.
          </Feature>
          <Feature title="Self-hosted">
            Один <span className="font-mono text-tg-300">docker compose up</span>: Postgres, Redis, backend и
            фронтенд за nginx с TLS.
          </Feature>
          <Feature title="Современный стек">
            NestJS 11 + Prisma 7 + Next.js 15 на рантайме Bun. Типобезопасно, без лишних
            зависимостей.
          </Feature>
          <Feature title="Журнал доставок">
            Каждая пересылка вебхука пишется в БД: статус, длительность, номер попытки и
            текст ошибки.
          </Feature>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-tg-500/20 bg-gradient-to-br from-tg-600/15 via-white/[0.02] to-transparent p-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Готовы подключить своего бота?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Поднимите прокси на своём сервере и следуйте пошаговому гайду с примерами на
            Python, TypeScript и JavaScript.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/guide"
              className="rounded-lg bg-tg-500 px-5 py-2.5 text-sm font-semibold text-[#06243a] transition hover:bg-tg-400"
            >
              Открыть документацию
            </Link>
            <a
              href={SWAGGER_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
            >
              Swagger API
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
