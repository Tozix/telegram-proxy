import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Bot } from '@/lib/types';

export const dynamic = 'force-dynamic';

function StatusBadge({ bot }: { bot: Bot }) {
  const base = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium';
  if (!bot.isActive) return <span className={`${base} bg-slate-100 text-slate-600`}>Выключен</span>;
  if (bot.webhookError) return <span className={`${base} bg-red-100 text-red-700`}>Ошибка вебхука</span>;
  return <span className={`${base} bg-green-100 text-green-700`}>Активен</span>;
}

export default async function BotsPage() {
  const bots = await api.get<Bot[]>('/api/bots');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Боты</h1>
        <Link
          href="/bots/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Добавить бота
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Пока нет ни одного бота. Нажмите «Добавить бота», чтобы зарегистрировать первого.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Бэкенд</th>
                <th className="px-4 py-3 font-medium">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bots.map((bot) => (
                <tr key={bot.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/bots/${bot.id}`} className="font-medium text-indigo-600 hover:underline">
                      {bot.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{bot.username ? `@${bot.username}` : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge bot={bot} />
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-600" title={bot.targetWebhookUrl}>
                    {bot.targetWebhookUrl}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(bot.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
