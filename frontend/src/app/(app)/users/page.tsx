import Link from 'next/link';
import { DeleteAdminButton } from '@/components/DeleteAdminButton';
import { Pagination } from '@/components/Pagination';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { AdminUser, AuthUser, Paginated } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const [data, me] = await Promise.all([
    api.get<Paginated<AdminUser>>(`/api/users?limit=${PAGE_SIZE}&offset=${offset}`),
    api.get<AuthUser>('/auth/me'),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Администраторы {data.total > 0 && <span className="text-sm font-normal text-slate-400">({data.total})</span>}
        </h1>
        <Link
          href="/users/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Добавить администратора
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Создан</th>
              <th className="px-4 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((u) => {
              const isSelf = u.id === me.userId;
              const isLast = data.total <= 1;
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.email}
                    {isSelf && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">вы</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/users/${u.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                        Сменить пароль
                      </Link>
                      <DeleteAdminButton
                        id={u.id}
                        disabled={isSelf || isLast}
                        reason={
                          isSelf
                            ? 'Нельзя удалить себя'
                            : isLast
                              ? 'Последнего администратора удалить нельзя'
                              : undefined
                        }
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
