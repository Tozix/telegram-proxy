'use client';

import { useActionState } from 'react';
import { login, type FormState } from '@/app/actions';
import { btnPrimary, errorBox, input, label } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <div className={errorBox}>{state.error}</div>}
      <label className={label}>
        Email
        <input name="email" type="email" autoComplete="username" required className={input} />
      </label>
      <label className={label}>
        Пароль
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      <SubmitButton pendingLabel="Вход…" className={`${btnPrimary} w-full`}>
        Войти
      </SubmitButton>
    </form>
  );
}
