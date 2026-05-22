import Link from 'next/link';
import { Pagination } from '@/components/Pagination';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Bot, Paginated } from '@/lib/types';
import { btnPrimary, card, rowHover, tableWrap, td, th } from '@/lib/ui';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

function StatusBadge({ bot }: { bot: Bot }) {
  const base = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium';
  if (!bot.isActive) return <span className={`${base} bg-slate-500/15 text-slate-400`}>Выключен</span>;
  if (bot.webhookError) return <span className={`${base} bg-red-500/15 text-red-300`}>Ошибка вебхука</span>;
  return <span className={`${base} bg-green-500/15 text-green-300`}>Активен</span>;
}

export default async function BotsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const data = await api.get<Paginated<Bot>>(`/api/bots?limit=${PAGE_SIZE}&offset=${offset}`);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">
          Боты {data.total > 0 && <span className="text-sm font-normal text-slate-400">({data.total})</span>}
        </h1>
        <Link href="/bots/new" className={btnPrimary}>
          Добавить бота
        </Link>
      </div>

      {data.total === 0 ? (
        <div className={`${card} p-10 text-center text-sm text-slate-400`}>
          Пока нет ни одного бота. Нажмите «Добавить бота», чтобы зарегистрировать первого.
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[680px]">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className={th}>Название</th>
                <th className={th}>Username</th>
                <th className={th}>Статус</th>
                <th className={th}>Бэкенд</th>
                <th className={th}>Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.items.map((bot) => (
                <tr key={bot.id} className={rowHover}>
                  <td className={td}>
                    <Link href={`/bots/${bot.id}`} className="font-medium text-tg-300 hover:underline">
                      {bot.name}
                    </Link>
                  </td>
                  <td className={td}>{bot.username ? `@${bot.username}` : '—'}</td>
                  <td className={td}><StatusBadge bot={bot} /></td>
                  <td className={`${td} max-w-xs truncate`} title={bot.targetWebhookUrl}>
                    {bot.targetWebhookUrl}
                  </td>
                  <td className={`${td} text-slate-500`}>{formatDate(bot.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={data.total} hrefFor={(p) => `/bots?page=${p}`} />
    </div>
  );
}
