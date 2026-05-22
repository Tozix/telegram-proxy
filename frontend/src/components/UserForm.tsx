'use client';

import { useActionState } from 'react';
import { createAdmin, type FormState } from '@/app/actions';
import { errorBox, input, label } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

export function UserForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createAdmin, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <div className={errorBox}>{state.error}</div>}
      <label className={label}>
        Email
        <input name="email" type="email" autoComplete="off" required className={input} />
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
      <SubmitButton pendingLabel="Создание…">Добавить администратора</SubmitButton>
    </form>
  );
}
