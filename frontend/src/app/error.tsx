'use client';

import { btnPrimary, cardPad } from '@/lib/ui';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-lg px-5">
      <div className={`${cardPad} text-center`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-2xl text-red-300">
          !
        </div>
        <h2 className="text-lg font-semibold text-ink">Что-то пошло не так</h2>
        <p className="mt-2 break-words text-sm text-red-300">{error.message}</p>
        {error.digest && <p className="mt-1 font-mono text-xs text-slate-500">код: {error.digest}</p>}
        <button onClick={reset} className={`${btnPrimary} mt-5`}>
          Повторить
        </button>
      </div>
    </div>
  );
}
