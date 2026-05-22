'use client';

import { useActionState } from 'react';
import { changeAdminPassword, type FormState } from '@/app/actions';
import { errorBox, input, label } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

export function ChangePasswordForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(changeAdminPassword, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <div className={errorBox}>{state.error}</div>}
      <input type="hidden" name="id" value={id} />
      <label className={label}>
        Новый пароль
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
      <SubmitButton pendingLabel="Сохранение…">Сменить пароль</SubmitButton>
    </form>
  );
}
