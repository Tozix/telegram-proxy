import Link from 'next/link';
import type { ReactNode } from 'react';
import { GITHUB_URL, SWAGGER_URL } from '@/lib/site';
import { focusRing } from '@/lib/ui';

function Logo() {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 rounded-md ${focusRing}`}>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
          <circle cx="4" cy="12" r="2.4" className="fill-slate-500" />
          <circle cx="12" cy="12" r="3.2" className="fill-tg-500" />
          <circle cx="20" cy="12" r="2.4" className="fill-slate-500" />
          <path d="M6.4 12h2.4M15.2 12h2.4" stroke="currentColor" strokeWidth="1.6" className="text-tg-400" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 -z-10 rounded-full bg-tg-500/30 blur-md transition group-hover:bg-tg-500/50" />
      </span>
      <span className="font-mono text-[15px] font-semibold tracking-tight text-ink">
        telegram<span className="text-tg-400">-</span>proxy
      </span>
    </Link>
  );
}

const navLink = `rounded-md text-sm text-slate-300 transition-colors hover:text-ink ${focusRing}`;
const mobileLink = `block rounded-lg px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/5 ${focusRing}`;

const nav = [
  { href: '/#features', label: 'Возможности', external: false },
  { href: '/#how', label: 'Как работает', external: false },
  { href: '/guide', label: 'Документация', external: false },
  { href: SWAGGER_URL, label: 'API', external: true },
  { href: GITHUB_URL, label: 'GitHub', external: true },
];

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-slate-200 selection:bg-tg-500/30">
      {/* Atmosphere: dotted grid + a soft cyan glow up top. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(to bottom, black, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12rem] -z-10 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-tg-600/12 blur-[120px]"
      />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((l) =>
              l.external ? (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={navLink}>{l.label}</a>
              ) : (
                <Link key={l.label} href={l.href} className={navLink}>{l.label}</Link>
              ),
            )}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`rounded-lg border border-tg-500/40 bg-tg-500/10 px-4 py-1.5 text-sm font-medium text-tg-300 transition hover:bg-tg-500/20 hover:text-ink ${focusRing}`}
            >
              Войти
            </Link>

            {/* Mobile menu — JS-free disclosure. */}
            <details className="relative md:hidden">
              <summary className={`flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-white/15 text-slate-200 [&::-webkit-details-marker]:hidden ${focusRing}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                <span className="sr-only">Меню</span>
              </summary>
              <nav className="absolute right-0 z-40 mt-2 w-56 space-y-0.5 rounded-xl border border-white/10 bg-surface p-2 shadow-xl shadow-black/40">
                {nav.map((l) =>
                  l.external ? (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={mobileLink}>{l.label}</a>
                  ) : (
                    <Link key={l.label} href={l.href} className={mobileLink}>{l.label}</Link>
                  ),
                )}
              </nav>
            </details>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/guide" className="hover:text-ink">Документация</Link>
            <a href={SWAGGER_URL} target="_blank" rel="noreferrer" className="hover:text-ink">Swagger API</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-ink">GitHub</a>
            <Link href="/login" className="hover:text-ink">Админка</Link>
          </div>
          <p className="text-slate-500">Self-hosted · NestJS + Next.js</p>
        </div>
      </footer>
    </div>
  );
}
