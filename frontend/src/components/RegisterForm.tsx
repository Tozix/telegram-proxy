'use client';

import { useActionState } from 'react';
import { registerUser, type RegisterState } from '@/app/actions';
import { btnPrimary, errorBox, input, label } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

export function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerUser, {});

  if (state.ok) {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-green-300">
          Письмо с подтверждением отправлено на <b>{state.email}</b>. Перейдите по ссылке из письма, чтобы активировать аккаунт.
        </div>
        <p className="text-slate-500">Письмо может прийти в течение пары минут. Проверьте папку «Спам».</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <div className={errorBox}>{state.error}</div>}
      <label className={label}>
        Email
        <input name="email" type="email" autoComplete="email" required className={input} />
      </label>
      <label className={label}>
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="минимум 8 символов"
          className={input}
        />
      </label>
      <SubmitButton pendingLabel="Регистрация…" className={`${btnPrimary} w-full`}>
        Зарегистрироваться
      </SubmitButton>
    </form>
  );
}
