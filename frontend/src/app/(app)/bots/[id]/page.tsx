import Link from 'next/link';
import type { ReactNode } from 'react';
import { BotActions } from '@/components/BotActions';
import { Pagination } from '@/components/Pagination';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatUnix } from '@/lib/format';
import type { Bot, DeliveryLog, Paginated, WebhookInfo } from '@/lib/types';
import { btnGhost, card, td, th } from '@/lib/ui';

export const dynamic = 'force-dynamic';

const LOGS_PAGE_SIZE = 20;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="break-all text-sm text-slate-200 sm:col-span-2">{children}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="border-b border-white/5 px-4 py-3 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default async function BotDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ logsPage?: string }>;
}) {
  const { id } = await params;
  const logsPage = Math.max(1, Number((await searchParams).logsPage) || 1);
  const logsOffset = (logsPage - 1) * LOGS_PAGE_SIZE;
  const bot = await api.get<Bot>(`/api/bots/${id}`);
  const logs = await api.get<Paginated<DeliveryLog>>(
    `/api/bots/${id}/logs?limit=${LOGS_PAGE_SIZE}&offset=${logsOffset}`,
  );
  const logsTotalPages = Math.max(1, Math.ceil(logs.total / LOGS_PAGE_SIZE));

  let webhookInfo: WebhookInfo | null = null;
  let webhookInfoError: string | null = null;
  try {
    webhookInfo = await api.get<WebhookInfo>(`/api/bots/${id}/webhook-info`);
  } catch (e) {
    webhookInfoError = e instanceof ApiError ? e.message : 'Не удалось получить webhook info';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/bots" className="text-sm text-slate-400 hover:text-ink">
            ← К списку ботов
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink">{bot.name}</h1>
          {bot.username && <p className="text-sm text-slate-400">@{bot.username}</p>}
        </div>
        <Link href={`/bots/${bot.id}/edit`} className={btnGhost}>
          Редактировать
        </Link>
      </div>

      {bot.webhookError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Последняя установка вебхука завершилась ошибкой: {bot.webhookError}
        </div>
      )}

      <Card title="Параметры">
        <dl className="divide-y divide-white/5">
          <Row label="Статус">{bot.isActive ? 'Активен' : 'Выключен'}</Row>
          <Row label="Telegram ID">{bot.telegramBotId ?? '—'}</Row>
          <Row label="Токен">{bot.tokenPreview}</Row>
          <Row label="Webhook (наш)">{bot.webhookUrl}</Row>
          <Row label="Бэкенд (target)">{bot.targetWebhookUrl}</Row>
          <Row label="allowed_updates">{bot.allowedUpdates?.join(', ') || 'все'}</Row>
          <Row label="Вебхук установлен">{formatDate(bot.lastWebhookSetAt)}</Row>
          <Row label="Создан">{formatDate(bot.createdAt)}</Row>
        </dl>
      </Card>

      <BotActions id={bot.id} />

      <Card title="Webhook info (из Telegram)">
        {webhookInfoError ? (
          <p className="px-4 py-3 text-sm text-amber-300">{webhookInfoError}</p>
        ) : webhookInfo ? (
          <dl className="divide-y divide-white/5">
            <Row label="URL">{webhookInfo.url || '—'}</Row>
            <Row label="Ожидает апдейтов">{webhookInfo.pending_update_count}</Row>
            <Row label="IP">{webhookInfo.ip_address ?? '—'}</Row>
            <Row label="Последняя ошибка">
              {webhookInfo.last_error_message
                ? `${webhookInfo.last_error_message} (${formatUnix(webhookInfo.last_error_date)})`
                : '—'}
            </Row>
            <Row label="max_connections">{webhookInfo.max_connections ?? '—'}</Row>
          </dl>
        ) : null}
      </Card>

      <Card title={`Доставки вебхуков${logs.total > 0 ? ` (всего ${logs.total})` : ''}`}>
        {logs.total === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-400">Пока нет доставок.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className={th}>Время</th>
                  <th className={th}>update_id</th>
                  <th className={th}>Статус</th>
                  <th className={th}>HTTP</th>
                  <th className={th}>Попытка</th>
                  <th className={th}>мс</th>
                  <th className={th}>Ошибка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.items.map((log) => (
                  <tr key={log.id}>
                    <td className={`${td} text-slate-400`}>{formatDate(log.createdAt)}</td>
                    <td className={`${td} text-slate-400`}>{log.updateId ?? '—'}</td>
                    <td className={td}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.success ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {log.success ? 'OK' : 'FAIL'}
                      </span>
                    </td>
                    <td className={`${td} text-slate-400`}>{log.responseStatus ?? '—'}</td>
                    <td className={`${td} text-slate-400`}>{log.attempt}</td>
                    <td className={`${td} text-slate-400`}>{log.durationMs}</td>
                    <td className={`${td} max-w-xs truncate text-slate-400`} title={log.errorMessage ?? ''}>
                      {log.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={logsPage} totalPages={logsTotalPages} hrefFor={(p) => `/bots/${id}?logsPage=${p}`} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
