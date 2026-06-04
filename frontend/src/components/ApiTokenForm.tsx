'use client';

import { useActionState } from 'react';
import { createApiToken, type CreateTokenState } from '@/app/actions';
import { btnPrimary, errorBox, input, label } from '@/lib/ui';
import { CopyButton } from './CodeBlock';
import { SubmitButton } from './SubmitButton';

export function ApiTokenForm() {
  const [state, formAction] = useActionState<CreateTokenState, FormData>(createApiToken, {});

  return (
    <div className="space-y-4">
      {state.token && (
        <div className="rounded-xl border border-tg-500/30 bg-tg-500/[0.06] p-4">
          <p className="text-sm font-medium text-tg-200">
            Токен «{state.name}» создан. Скопируйте его сейчас — позже посмотреть не получится.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-surface px-3 py-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px] text-slate-200">
              {state.token}
            </code>
            <CopyButton code={state.token} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-400">
            Используйте как заголовок: <span className="text-slate-300">Authorization: Bearer &lt;токен&gt;</span>
          </p>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className={`${label} flex-1`}>
          Название
          <input
            name="name"
            type="text"
            autoComplete="off"
            required
            maxLength={100}
            placeholder="например, CI deploy"
            className={input}
          />
        </label>
        <SubmitButton pendingLabel="Создание…" className={`${btnPrimary} sm:w-auto`}>
          Создать токен
        </SubmitButton>
      </form>

      {state.error && <div className={errorBox}>{state.error}</div>}
    </div>
  );
}
