'use client';

import { revokeApiToken } from '@/app/actions';
import { btnDanger } from '@/lib/ui';
import { SubmitButton } from './SubmitButton';

/** Inline revoke control for a token row. Confirms before deleting. */
export function RevokeTokenButton({ id }: { id: string }) {
  return (
    <form
      action={revokeApiToken}
      onSubmit={(e) => {
        if (!confirm('Отозвать этот токен? Он сразу перестанет работать.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Отзыв…" className={btnDanger}>
        Отозвать
      </SubmitButton>
    </form>
  );
}
