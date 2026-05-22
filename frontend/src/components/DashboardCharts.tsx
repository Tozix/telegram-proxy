'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Stats } from '@/lib/types';

const AXIS = '#64748b';
const GRID = 'rgba(255,255,255,0.06)';
const OK = '#3fb950';
const FAIL = '#f85149';
const ACCENT = '#2aabee';

const tooltip = {
  contentStyle: {
    background: '#0d1320',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
};

function ChartCard({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 ${className ?? ''}`}>
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

export function DashboardCharts({ data }: { data: Stats }) {
  const series = data.series.map((d) => ({ ...d, label: d.date.slice(5) }));
  const pie = [
    { name: 'Успешно', value: data.deliveries.success, color: OK },
    { name: 'Ошибки', value: data.deliveries.failed, color: FAIL },
  ];
  const hasDeliveries = data.deliveries.total > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Доставки за 14 дней" className="lg:col-span-2">
        <p className="sr-only">
          Всего за период: {data.deliveries.total}, успешных {data.deliveries.success}, с ошибкой {data.deliveries.failed}.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="g-ok" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={OK} stopOpacity={0.5} />
                <stop offset="100%" stopColor={OK} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-fail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={FAIL} stopOpacity={0.5} />
                <stop offset="100%" stopColor={FAIL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
            <Tooltip {...tooltip} />
            <Area type="monotone" dataKey="success" name="Успешно" stackId="1" stroke={OK} fill="url(#g-ok)" strokeWidth={2} />
            <Area type="monotone" dataKey="failed" name="Ошибки" stackId="1" stroke={FAIL} fill="url(#g-fail)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Успешные / ошибки">
        {hasDeliveries ? (
          <>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} stroke="transparent">
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: OK }} />Успешно: {data.deliveries.success}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: FAIL }} />Ошибки: {data.deliveries.failed}</span>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-slate-400">Пока нет доставок</p>
        )}
      </ChartCard>

      <ChartCard title="Топ ботов по доставкам" className="lg:col-span-3">
        {data.topBots.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Пока нет ботов</p>
        ) : (
          <>
          <ul className="sr-only">
            {data.topBots.map((b) => (
              <li key={b.name}>{b.name}: {b.deliveries} доставок</li>
            ))}
          </ul>
          <ResponsiveContainer width="100%" height={Math.max(140, data.topBots.length * 46)}>
            <BarChart data={data.topBots} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="deliveries" name="Доставки" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </ChartCard>
    </div>
  );
}
