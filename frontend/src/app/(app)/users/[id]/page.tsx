import Link from 'next/link';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { api } from '@/lib/api';
import type { AdminUser } from '@/lib/types';
import { cardPad } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await api.get<AdminUser>(`/api/users/${id}`);

  return (
    <div className="mx-auto max-w-md">
      <Link href="/users" className="text-sm text-slate-400 hover:text-white">
        ← К пользователям
      </Link>
      <div className={`mt-3 ${cardPad}`}>
        <h1 className="text-lg font-semibold text-white">{user.email}</h1>
        <p className="mb-5 text-sm text-slate-400">Смена пароля пользователя</p>
        <ChangePasswordForm id={user.id} />
      </div>
    </div>
  );
}
