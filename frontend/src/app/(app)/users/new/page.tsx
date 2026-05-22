import Link from 'next/link';
import { UserForm } from '@/components/UserForm';

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link href="/users" className="text-sm text-slate-500 hover:text-slate-700">
        ← К администраторам
      </Link>
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">Новый администратор</h1>
        <p className="mb-5 text-sm text-slate-500">Получит полный доступ к админке.</p>
        <UserForm />
      </div>
    </div>
  );
}
