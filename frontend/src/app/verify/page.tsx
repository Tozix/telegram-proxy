import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { cardPad } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? '';
  let ok = false;
  let error = 'Отсутствует токен подтверждения.';

  if (token) {
    try {
      await api.post('/auth/verify', { token }, false);
      ok = true;
    } catch (e) {
      error = e instanceof ApiError ? e.message : 'Не удалось подтвердить email';
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <div className={`${cardPad} text-center`}>
        {ok ? (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-2xl text-green-300">
              ✓
            </div>
            <h1 className="text-lg font-semibold text-white">Email подтверждён</h1>
            <p className="mt-2 text-sm text-slate-400">Теперь можно войти в систему.</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-white">Не удалось подтвердить</h1>
            <p className="mt-2 text-sm text-amber-300">{error}</p>
          </>
        )}
        <Link href="/login" className="mt-5 inline-block text-tg-300 hover:underline">
          Перейти ко входу →
        </Link>
      </div>
    </div>
  );
}
