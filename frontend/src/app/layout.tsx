import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logout } from './actions';
import { getToken } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Telegram Proxy — админка',
  description: 'Управление прокси-ботами Telegram',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const authed = Boolean(await getToken());

  return (
    // suppressHydrationWarning: браузерные расширения (LanguageTool/Grammarly)
    // дописывают атрибуты в <html>/<body> до гидрации — это не наш рассинхрон.
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        {authed && (
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/bots" className="font-semibold text-slate-900">
                Telegram&nbsp;Proxy
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/bots" className="text-slate-600 hover:text-slate-900">
                  Боты
                </Link>
                <form action={logout}>
                  <button className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
                    Выйти
                  </button>
                </form>
              </nav>
            </div>
          </header>
        )}
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
