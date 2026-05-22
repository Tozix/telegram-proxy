import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">Вход в админку</h1>
        <p className="mb-5 text-sm text-slate-500">Telegram Proxy</p>
        <LoginForm />
      </div>
    </div>
  );
}
