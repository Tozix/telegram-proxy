import Link from 'next/link';
import { DeleteAdminButton } from '@/components/DeleteAdminButton';
import { Pagination } from '@/components/Pagination';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { AdminUser, AuthUser, Paginated } from '@/lib/types';
import { btnPrimary, rowHover, td, th } from '@/lib/ui';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

function RoleBadge({ role }: { role: string }) {
  const admin = role === 'admin';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        admin ? 'bg-tg-500/15 text-tg-300' : 'bg-slate-500/15 text-slate-300'
      }`}
    >
      {admin ? 'админ' : 'пользователь'}
    </span>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const [data, me] = await Promise.all([
    api.get<Paginated<AdminUser>>(`/api/users?limit=${PAGE_SIZE}&offset=${offset}`),
    api.get<AuthUser>('/auth/me'),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const adminCount = data.items.filter((u) => u.role === 'admin').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Пользователи {data.total > 0 && <span className="text-sm font-normal text-slate-500">({data.total})</span>}
        </h1>
        <Link href="/users/new" className={btnPrimary}>
          Добавить администратора
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full">
          <thead className="bg-white/[0.03]">
            <tr>
              <th className={th}>Email</th>
              <th className={th}>Роль</th>
              <th className={th}>Email подтверждён</th>
              <th className={th}>Создан</th>
              <th className={`${th} text-right`}>Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.items.map((u) => {
              const isSelf = u.id === me.userId;
              // last admin guard mirrors the backend (only relevant on this page)
              const isLastAdmin = u.role === 'admin' && adminCount <= 1;
              return (
                <tr key={u.id} className={rowHover}>
                  <td className={`${td} font-medium text-white`}>
                    {u.email}
                    {isSelf && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-xs font-normal text-slate-400">вы</span>
                    )}
                  </td>
                  <td className={td}><RoleBadge role={u.role} /></td>
                  <td className={td}>
                    {u.emailVerifiedAt ? (
                      <span className="text-green-300">✓ да</span>
                    ) : (
                      <span className="text-amber-300">не подтверждён</span>
                    )}
                  </td>
                  <td className={`${td} text-slate-500`}>{formatDate(u.createdAt)}</td>
                  <td className={td}>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/users/${u.id}`} className="font-medium text-tg-300 hover:underline">
                        Сменить пароль
                      </Link>
                      <DeleteAdminButton
                        id={u.id}
                        disabled={isSelf || isLastAdmin}
                        reason={isSelf ? 'Нельзя удалить себя' : isLastAdmin ? 'Последнего администратора удалить нельзя' : undefined}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={data.total} hrefFor={(p) => `/users?page=${p}`} />
    </div>
  );
}
