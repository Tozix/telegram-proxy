'use client';

import { deleteBot, refreshWebhook } from '@/app/actions';
import { SubmitButton } from './SubmitButton';

export function BotActions({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={refreshWebhook}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton
          pendingLabel="Обновление…"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Обновить вебхук
        </SubmitButton>
      </form>

      <form
        action={deleteBot}
        onSubmit={(e) => {
          if (!confirm('Удалить бота и его вебхук в Telegram?')) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <SubmitButton
          pendingLabel="Удаление…"
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Удалить
        </SubmitButton>
      </form>
    </div>
  );
}
