import Link from 'next/link';
import type { ReactNode } from 'react';
import { logout } from '../actions';
import { api } from '@/lib/api';
import type { AuthUser } from '@/lib/types';
import { focusRing } from '@/lib/ui';

function Logo() {
  return (
    <Link href="/bots" className={`group flex items-center gap-2.5 rounded-md ${focusRing}`}>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
          <circle cx="4" cy="12" r="2.4" className="fill-slate-500" />
          <circle cx="12" cy="12" r="3.2" className="fill-tg-500" />
          <circle cx="20" cy="12" r="2.4" className="fill-slate-500" />
          <path d="M6.4 12h2.4M15.2 12h2.4" stroke="currentColor" strokeWidth="1.6" className="text-tg-400" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 -z-10 rounded-full bg-tg-500/30 blur-md" />
      </span>
      <span className="font-mono text-[15px] font-semibold tracking-tight text-ink">
        telegram<span className="text-tg-400">-</span>proxy
      </span>
    </Link>
  );
}

const navLink = `rounded-md text-sm text-slate-300 transition-colors hover:text-ink ${focusRing}`;
const mobileLink = `block rounded-lg px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/5 ${focusRing}`;

/** Shell for the authenticated pages. Nav adapts to the user's role. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await api.get<AuthUser>('/auth/me');
  const isAdmin = me.role === 'admin';

  const links = [
    ...(isAdmin ? [{ href: '/dashboard', label: 'Дашборд' }] : []),
    { href: '/bots', label: 'Боты' },
    ...(isAdmin ? [{ href: '/users', label: 'Пользователи' }] : []),
    { href: '/guide', label: 'Документация' },
  ];

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[-14rem] -z-10 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-tg-600/10 blur-[120px]"
      />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-7">
            <Logo />
            <nav className="hidden items-center gap-6 sm:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={navLink}>{l.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-slate-400 md:inline">{me.email}</span>
            <form action={logout} className="hidden sm:block">
              <button className={`rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/5 ${focusRing}`}>
                Выйти
              </button>
            </form>

            {/* Mobile menu — JS-free disclosure. */}
            <details className="relative sm:hidden">
              <summary className={`flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-white/15 text-slate-200 [&::-webkit-details-marker]:hidden ${focusRing}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                <span className="sr-only">Меню</span>
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-white/10 bg-surface p-2 shadow-xl shadow-black/40">
                <p className="truncate px-3 pb-2 pt-1 font-mono text-xs text-slate-400">{me.email}</p>
                <nav className="space-y-0.5">
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className={mobileLink}>{l.label}</Link>
                  ))}
                </nav>
                <form action={logout} className="mt-1 border-t border-white/10 pt-1">
                  <button className={`w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-white/5 ${focusRing}`}>
                    Выйти
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
