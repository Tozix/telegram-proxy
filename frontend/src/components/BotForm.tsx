'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useActionState } from 'react';
import type { FormState } from '@/app/actions';
import type { Bot } from '@/lib/types';
import { btnGhost, errorBox, input, label } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function Field({ label: text, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={label}>
      {text}
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
      {state.error && <div className={errorBox}>{state.error}</div>}

      <Field label="Название">
        <input name="name" required defaultValue={bot?.name} className={input} />
      </Field>

      <Field
        label={isEdit ? 'Токен бота' : 'Токен бота (@BotFather)'}
        hint={isEdit ? 'Оставьте пустым, чтобы не менять токен.' : undefined}
      >
        <input
          name="token"
          required={!isEdit}
          placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className={input}
        />
      </Field>

      <Field label="URL реального вебхука" hint="Куда пересылать апдейты (адрес вашего бэкенда).">
        <input
          name="targetWebhookUrl"
          type="url"
          required
          defaultValue={bot?.targetWebhookUrl}
          placeholder="https://your-backend.example.com/telegram/webhook"
          className={input}
        />
      </Field>

      <Field label="allowed_updates" hint="Список через запятую, опционально (например: message, callback_query).">
        <input
          name="allowedUpdates"
          defaultValue={bot?.allowedUpdates?.join(', ') ?? ''}
          placeholder="message, callback_query"
          className={input}
        />
      </Field>

      {!isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="dropPendingUpdates" className="h-4 w-4 rounded border-white/20 bg-transparent" />
          drop_pending_updates при установке вебхука
        </label>
      )}

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={bot?.isActive}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Бот активен (выключение удаляет вебхук в Telegram)
        </label>
      )}

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton>{isEdit ? 'Сохранить' : 'Создать бота'}</SubmitButton>
        <Link href={isEdit && bot ? `/bots/${bot.id}` : '/bots'} className={btnGhost}>
          Отмена
        </Link>
      </div>
    </form>
  );
}
