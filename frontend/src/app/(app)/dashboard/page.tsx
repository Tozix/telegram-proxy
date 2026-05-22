import { redirect } from 'next/navigation';
import { DashboardCharts } from '@/components/DashboardCharts';
import { api } from '@/lib/api';
import type { AuthUser, Stats } from '@/lib/types';
import { card } from '@/lib/ui';

export const dynamic = 'force-dynamic';

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className={`${card} p-5`}>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums text-ink">{value.toLocaleString('ru-RU')}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const me = await api.get<AuthUser>('/auth/me');
  if (me.role !== 'admin') redirect('/bots');

  const stats = await api.get<Stats>('/api/stats');
  const successRate = stats.deliveries.total
    ? Math.round((stats.deliveries.success / stats.deliveries.total) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Дашборд</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Пользователи"
          value={stats.users.total}
          sub={`${stats.users.verified} подтв. · ${stats.users.admins} админ.`}
        />
        <StatCard
          label="Боты"
          value={stats.bots.total}
          sub={`${stats.bots.active} активны${stats.bots.withErrors ? ` · ${stats.bots.withErrors} с ошибкой` : ''}`}
        />
        <StatCard label="Доставок всего" value={stats.deliveries.total} sub={`успешность ${successRate}%`} />
        <StatCard label="За последние 24 ч" value={stats.deliveries.last24h} sub={`${stats.deliveries.failed} ошибок за всё время`} />
      </div>

      <DashboardCharts data={stats} />
    </div>
  );
}
