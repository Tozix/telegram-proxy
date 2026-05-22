'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { btnPrimary } from '@/lib/ui';

export function SubmitButton({
  children,
  pendingLabel = 'Сохранение…',
  className = btnPrimary,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
