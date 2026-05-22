'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import type { Bot } from '@/lib/types';
import { SubmitButton } from './SubmitButton';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function BotForm({ mode, action, bot }: { mode: 'create' | 'edit'; action: Action; bot?: Bot }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const isEdit = mode === 'edit';

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {isEdit && bot && <input type="hidden" name="id" value={bot.id} />}
      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <Field label="Название">
        <input name="name" required defaultValue={bot?.name} className={inputClass} />
      </Field>

      <Field
        label={isEdit ? 'Токен бота' : 'Токен бота (@BotFather)'}
        hint={isEdit ? 'Оставьте пустым, чтобы не менять токен.' : undefined}
      >
        <input
          name="token"
          required={!isEdit}
          placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className={inputClass}
        />
      </Field>

      <Field label="URL реального вебхука" hint="Куда пересылать апдейты (адрес вашего бэкенда).">
        <input
          name="targetWebhookUrl"
          type="url"
          required
          defaultValue={bot?.targetWebhookUrl}
          placeholder="https://your-backend.example.com/telegram/webhook"
          className={inputClass}
        />
      </Field>

      <Field label="allowed_updates" hint="Список через запятую, опционально (например: message, callback_query).">
        <input
          name="allowedUpdates"
          defaultValue={bot?.allowedUpdates?.join(', ') ?? ''}
          placeholder="message, callback_query"
          className={inputClass}
        />
      </Field>

      {!isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="dropPendingUpdates" className="h-4 w-4 rounded border-slate-300" />
          drop_pending_updates при установке вебхука
        </label>
      )}

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={bot?.isActive}
            className="h-4 w-4 rounded border-slate-300"
          />
          Бот активен (выключение удаляет вебхук в Telegram)
        </label>
      )}

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton>{isEdit ? 'Сохранить' : 'Создать бота'}</SubmitButton>
        <Link
          href={isEdit && bot ? `/bots/${bot.id}` : '/bots'}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
