import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/CodeBlock';
import { CodeTabs } from '@/components/CodeTabs';
import {
  filesTabs,
  outboundTabs,
  registerBotSnippet,
  webhookTabs,
} from '@/lib/examples';
import { SWAGGER_URL, getProxyHost } from '@/lib/site';
import { focusRing } from '@/lib/ui';

export const dynamic = 'force-dynamic';

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/5 py-12 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-sm text-tg-400">{n}</span>
        <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
      </div>
      {/* Cap prose line length (~70ch) for readability; code blocks stay full width. */}
      <div className="space-y-4 text-[15px] leading-relaxed text-slate-300 [&_p]:max-w-[70ch]">{children}</div>
    </section>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-tg-500/20 bg-tg-500/[0.06] px-4 py-3 text-sm text-slate-300">
      {children}
    </div>
  );
}

const toc = [
  ['intro', '00', 'О прокси'],
  ['outbound', '01', 'Исходящий Bot API'],
  ['files', '02', 'Скачивание файлов'],
  ['webhooks', '03', 'Входящие вебхуки'],
  ['register', '04', 'Регистрация бота'],
  ['api', '05', 'Справочник API'],
] as const;

export default async function GuidePage() {
  const PROXY_HOST = await getProxyHost();
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <header className="mb-10">
        <p className="font-mono text-sm text-tg-400">Документация</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">Интеграция за пять минут</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-400">
          Как подключить прокси к своему боту: исходящие запросы Bot API, приём вебхуков и
          регистрация бота. Примеры на Python, TypeScript и JavaScript.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={SWAGGER_URL}
            target="_blank"
            rel="noreferrer"
            className={`rounded-lg bg-tg-500 px-4 py-2 text-sm font-semibold text-[#06243a] transition hover:bg-tg-400 ${focusRing}`}
          >
            Открыть Swagger API ↗
          </a>
          <Link href="/login" className={`rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 ${focusRing}`}>
            Войти в админку
          </Link>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
        {/* TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1.5 border-l border-white/10 pl-4 text-sm">
            {toc.map(([id, n, label]) => (
              <a key={id} href={`#${id}`} className="flex items-baseline gap-2 text-slate-400 transition hover:text-ink">
                <span className="font-mono text-xs text-slate-500">{n}</span>
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div>
          <Section id="intro" n="00" title="О прокси">
            <p>
              Прокси решает две задачи. <strong className="text-ink">Во-первых</strong>, принимает вебхуки от
              Telegram на зарубежном сервере и пересылает их на ваш «реальный» бэкенд.{' '}
              <strong className="text-ink">Во-вторых</strong>, служит drop-in заменой{' '}
              <span className="font-mono text-tg-300">api.telegram.org</span>: ваш бэкенд шлёт запросы на домен
              прокси, а тот прозрачно проксирует их в Telegram.
            </p>
            <p>
              Адрес вашего прокси в примерах ниже — <span className="font-mono text-tg-300">{PROXY_HOST}</span>{' '}
              — он подставляется автоматически из адреса вашего сервиса.
            </p>
          </Section>

          <Section id="outbound" n="01" title="Исходящий Bot API (drop-in замена хоста)">
            <p>
              Поменяйте базовый URL клиента c <span className="font-mono text-tg-300">https://api.telegram.org</span>{' '}
              на адрес прокси. Проксируются <strong className="text-ink">все</strong> методы и любой content-type,
              включая <span className="font-mono text-tg-300">multipart/form-data</span>.
            </p>
            <CodeTabs tabs={outboundTabs(PROXY_HOST)} />
            <Callout>
              По умолчанию прокси обслуживает только токены ботов, зарегистрированных в админке
              (защита от открытого relay). Сначала добавьте бота — см. раздел 04.
            </Callout>
          </Section>

          <Section id="files" n="02" title="Скачивание файлов">
            <p>
              Файлы качаются через путь <span className="font-mono text-tg-300">/file/bot&lt;token&gt;/&lt;file_path&gt;</span> —
              тоже через прокси.
            </p>
            <CodeTabs tabs={filesTabs(PROXY_HOST)} />
          </Section>

          <Section id="webhooks" n="03" title="Входящие вебхуки">
            <p>
              Когда вы регистрируете бота (раздел 04), прокси сам вызывает Telegram{' '}
              <span className="font-mono text-tg-300">setWebhook</span> и направляет апдейты на{' '}
              <span className="font-mono text-tg-300">{PROXY_HOST}/webhook/&lt;secret&gt;</span>. Дальше тело апдейта{' '}
              <strong className="text-ink">как есть</strong> пересылается на ваш{' '}
              <span className="font-mono text-tg-300">targetWebhookUrl</span> с заголовком{' '}
              <span className="font-mono text-tg-300">X-Telegram-Bot-Api-Secret-Token</span>.
            </p>
            <CodeTabs tabs={webhookTabs()} />
            <Callout>
              Верните <strong className="text-ink">2xx</strong> как можно быстрее. Если бэкенд ответил не-2xx или
              недоступен — прокси повторит доставку до 3 раз с нарастающей паузой, а Telegram в итоге получит{' '}
              <span className="font-mono text-tg-300">200</span> (чтобы не было шторма ретраев). Ответ бэкенда при
              успехе прозрачно возвращается Telegram — работает «ответ методом в теле ответа».
            </Callout>
          </Section>

          <Section id="register" n="04" title="Регистрация бота">
            <p>
              Проще всего — через <Link href="/login" className="text-tg-300 underline-offset-2 hover:underline">веб-админку</Link>:
              добавьте бота, укажите токен и <span className="font-mono text-tg-300">targetWebhookUrl</span>, прокси
              сам проверит токен через <span className="font-mono text-tg-300">getMe</span> и поставит вебхук. Либо
              через админ-API:
            </p>
            <CodeBlock filename="bash" code={registerBotSnippet(PROXY_HOST)} />
          </Section>

          <Section id="api" n="05" title="Справочник API">
            <p>
              Полное описание админ-API (логин, CRUD ботов, журнал доставок) с интерактивной консолью —
              в Swagger UI. Авторизация по JWT: получите токен через{' '}
              <span className="font-mono text-tg-300">/auth/login</span> и нажмите Authorize.
            </p>
            <div>
              <a
                href={SWAGGER_URL}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded-lg border border-tg-500/40 bg-tg-500/10 px-4 py-2.5 text-sm font-medium text-tg-200 transition hover:bg-tg-500/20 ${focusRing}`}
              >
                Открыть Swagger UI ↗
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
