import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { cardPad } from '@/lib/ui';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <Link href="/" className="mb-6 text-center font-mono text-sm font-semibold text-white">
        telegram<span className="text-tg-400">-</span>proxy
      </Link>
      <div className={cardPad}>
        <h1 className="mb-1 text-lg font-semibold text-white">Вход</h1>
        <p className="mb-5 text-sm text-slate-400">Войдите, чтобы управлять ботами.</p>
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-slate-400">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-tg-300 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
