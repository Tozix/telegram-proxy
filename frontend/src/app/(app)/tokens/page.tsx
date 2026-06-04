import { ApiTokenForm } from '@/components/ApiTokenForm';
import { RevokeTokenButton } from '@/components/RevokeTokenButton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { ApiToken } from '@/lib/types';
import { card, cardPad, rowHover, tableWrap, td, th } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function TokensPage() {
  const tokens = await api.get<ApiToken[]>('/api/tokens');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          API-токены {tokens.length > 0 && <span className="text-sm font-normal text-slate-400">({tokens.length})</span>}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Статический токен — это долгоживущий bearer-токен с вашими правами. С ним можно управлять
          ботами через API <span className="font-mono text-slate-300">/api/*</span> без логина и пароля.
          Передавайте его в заголовке{' '}
          <span className="font-mono text-slate-300">Authorization: Bearer &lt;токен&gt;</span>.
        </p>
      </div>

      <section className={cardPad}>
        <h2 className="mb-4 text-base font-semibold text-ink">Новый токен</h2>
        <ApiTokenForm />
      </section>

      {tokens.length === 0 ? (
        <div className={`${card} px-6 py-10 text-center text-sm text-slate-400`}>
          У вас пока нет токенов. Создайте первый выше.
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[680px]">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className={th}>Название</th>
                <th className={th}>Последнее использование</th>
                <th className={th}>Действует до</th>
                <th className={th}>Создан</th>
                <th className={`${th} text-right`}>Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tokens.map((t) => (
                <tr key={t.id} className={rowHover}>
                  <td className={`${td} font-medium text-ink`}>{t.name}</td>
                  <td className={`${td} text-slate-500`}>
                    {t.lastUsedAt ? formatDate(t.lastUsedAt) : 'ни разу'}
                  </td>
                  <td className={`${td} text-slate-500`}>{formatDate(t.expiresAt)}</td>
                  <td className={`${td} text-slate-500`}>{formatDate(t.createdAt)}</td>
                  <td className={td}>
                    <div className="flex justify-end">
                      <RevokeTokenButton id={t.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
