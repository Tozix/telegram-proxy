'use client';

import { useActionState } from 'react';
import { login, type FormState } from '@/app/actions';
import { SubmitButton } from './SubmitButton';

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Пароль
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <SubmitButton pendingLabel="Вход…" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
        Войти
      </SubmitButton>
    </form>
  );
}
