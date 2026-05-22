'use client';

import { deleteAdmin } from '@/app/actions';
import { btnDanger, focusRing } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

/** Inline delete control for an admin row. Disabled (with a reason) for self / last admin. */
export function DeleteAdminButton({ id, disabled, reason }: { id: string; disabled?: boolean; reason?: string }) {
  if (disabled) {
    return (
      <button
        type="button"
        aria-disabled="true"
        title={reason}
        aria-label={reason ? `Удалить недоступно: ${reason}` : 'Удалить недоступно'}
        className={`cursor-not-allowed rounded text-sm text-slate-500 ${focusRing}`}
      >
        Удалить
      </button>
    );
  }
  return (
    <form
      action={deleteAdmin}
      onSubmit={(e) => {
        if (!confirm('Удалить этого пользователя?')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Удаление…" className={btnDanger}>
        Удалить
      </SubmitButton>
    </form>
  );
}
