import Link from 'next/link';
import type { ReactNode } from 'react';
import { logout } from '../actions';
import { api } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

function Logo() {
  return (
    <Link href="/bots" className="group flex items-center gap-2.5">
      <span className="relative flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
          <circle cx="4" cy="12" r="2.4" className="fill-slate-500" />
          <circle cx="12" cy="12" r="3.2" className="fill-tg-500" />
          <circle cx="20" cy="12" r="2.4" className="fill-slate-500" />
          <path d="M6.4 12h2.4M15.2 12h2.4" stroke="currentColor" strokeWidth="1.6" className="text-tg-400" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 -z-10 rounded-full bg-tg-500/30 blur-md" />
      </span>
      <span className="font-mono text-[15px] font-semibold tracking-tight text-white">
        telegram<span className="text-tg-400">-</span>proxy
      </span>
    </Link>
  );
}

const navLink = 'text-sm text-slate-300 transition-colors hover:text-white';

/** Shell for the authenticated pages. Nav adapts to the user's role. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await api.get<AuthUser>('/auth/me');
  const isAdmin = me.role === 'admin';

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[-14rem] -z-10 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-tg-600/10 blur-[120px]"
      />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0e14]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-7">
            <Logo />
            <nav className="hidden items-center gap-6 sm:flex">
              {isAdmin && <Link href="/dashboard" className={navLink}>Дашборд</Link>}
              <Link href="/bots" className={navLink}>Боты</Link>
              {isAdmin && <Link href="/users" className={navLink}>Пользователи</Link>}
              <Link href="/guide" className={navLink}>Документация</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-slate-500 md:inline">{me.email}</span>
            <form action={logout}>
              <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/5">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
