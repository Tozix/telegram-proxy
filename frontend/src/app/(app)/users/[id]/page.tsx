import Link from 'next/link';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { api } from '@/lib/api';
import type { AdminUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await api.get<AdminUser>(`/api/users/${id}`);

  return (
    <div className="mx-auto max-w-md">
      <Link href="/users" className="text-sm text-slate-500 hover:text-slate-700">
        ← К администраторам
      </Link>
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">{user.email}</h1>
        <p className="mb-5 text-sm text-slate-500">Смена пароля администратора</p>
        <ChangePasswordForm id={user.id} />
      </div>
    </div>
  );
}
