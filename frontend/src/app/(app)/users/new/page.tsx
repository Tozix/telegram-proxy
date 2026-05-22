import Link from 'next/link';
import { UserForm } from '@/components/UserForm';
import { cardPad } from '@/lib/ui';

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link href="/users" className="text-sm text-slate-400 hover:text-white">
        ← К пользователям
      </Link>
      <div className={`mt-3 ${cardPad}`}>
        <h1 className="mb-1 text-lg font-semibold text-white">Новый администратор</h1>
        <p className="mb-5 text-sm text-slate-400">Получит полный доступ к админке (создаётся подтверждённым).</p>
        <UserForm />
      </div>
    </div>
  );
}
