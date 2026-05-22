'use client';

import { deleteBot, refreshWebhook } from '@/app/actions';
import { btnGhost } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

export function BotActions({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={refreshWebhook}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton pendingLabel="Обновление…" className={btnGhost}>
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
          className="inline-flex items-center justify-center rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
        >
          Удалить
        </SubmitButton>
      </form>
    </div>
  );
}
