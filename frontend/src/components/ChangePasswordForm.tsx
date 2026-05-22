'use client';

import { useActionState } from 'react';
import { changeAdminPassword, type FormState } from '@/app/actions';
import { SubmitButton } from './SubmitButton';

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export function ChangePasswordForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(changeAdminPassword, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      <input type="hidden" name="id" value={id} />
      <label className="block text-sm font-medium text-slate-700">
        Новый пароль
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="минимум 8 символов"
          className={inputClass}
        />
      </label>
      <SubmitButton pendingLabel="Сохранение…">Сменить пароль</SubmitButton>
    </form>
  );
}
