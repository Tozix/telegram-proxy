import Link from 'next/link';
import { RegisterForm } from '@/components/RegisterForm';
import { cardPad } from '@/lib/ui';

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <Link href="/" className="mb-6 text-center font-mono text-sm font-semibold text-ink">
        telegram<span className="text-tg-400">-</span>proxy
      </Link>
      <div className={cardPad}>
        <h1 className="mb-1 text-lg font-semibold text-ink">Регистрация</h1>
        <p className="mb-5 text-sm text-slate-400">Создайте аккаунт, чтобы подключать своих ботов.</p>
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-slate-400">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-tg-300 hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
