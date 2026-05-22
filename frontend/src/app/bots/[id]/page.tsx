import Link from 'next/link';
import type { ReactNode } from 'react';
import { BotActions } from '@/components/BotActions';
import { Pagination } from '@/components/Pagination';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatUnix } from '@/lib/format';
import type { Bot, DeliveryLog, Paginated, WebhookInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

const LOGS_PAGE_SIZE = 20;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="col-span-2 break-all text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{title}</h2>
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
          <Link href="/bots" className="text-sm text-slate-500 hover:text-slate-700">
            ← К списку ботов
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">{bot.name}</h1>
          {bot.username && <p className="text-sm text-slate-500">@{bot.username}</p>}
        </div>
        <Link
          href={`/bots/${bot.id}/edit`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Редактировать
        </Link>
      </div>

      {bot.webhookError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Последняя установка вебхука завершилась ошибкой: {bot.webhookError}
        </div>
      )}

      <Card title="Параметры">
        <dl className="divide-y divide-slate-100">
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
          <p className="px-4 py-3 text-sm text-amber-700">{webhookInfoError}</p>
        ) : webhookInfo ? (
          <dl className="divide-y divide-slate-100">
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
          <p className="px-4 py-3 text-sm text-slate-500">Пока нет доставок.</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Время</th>
                  <th className="px-4 py-2 font-medium">update_id</th>
                  <th className="px-4 py-2 font-medium">Статус</th>
                  <th className="px-4 py-2 font-medium">HTTP</th>
                  <th className="px-4 py-2 font-medium">Попытка</th>
                  <th className="px-4 py-2 font-medium">мс</th>
                  <th className="px-4 py-2 font-medium">Ошибка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.items.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-slate-600">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2 text-slate-600">{log.updateId ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.success ? 'OK' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{log.responseStatus ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{log.attempt}</td>
                    <td className="px-4 py-2 text-slate-600">{log.durationMs}</td>
                    <td className="px-4 py-2 max-w-xs truncate text-slate-500" title={log.errorMessage ?? ''}>
                      {log.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pagination
                page={logsPage}
                totalPages={logsTotalPages}
                hrefFor={(p) => `/bots/${id}?logsPage=${p}`}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
