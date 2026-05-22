import Link from 'next/link';
import type { ReactNode } from 'react';
import { logout } from '../actions';

/** Shell for the authenticated admin pages (middleware guarantees a session). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/bots" className="font-semibold text-slate-900">
            Telegram&nbsp;Proxy
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/bots" className="text-slate-600 hover:text-slate-900">
              Боты
            </Link>
            <Link href="/guide" className="text-slate-600 hover:text-slate-900">
              Документация
            </Link>
            <form action={logout}>
              <button className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
                Выйти
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
