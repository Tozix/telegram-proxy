import './globals.css';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Telegram Proxy — прозрачный прокси для Telegram-ботов',
  description:
    'Drop-in замена api.telegram.org и приём вебхуков для серверов, где Telegram заблокирован. Вебхуки с ретраями, прозрачный Bot API, веб-админка и Swagger.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: браузерные расширения (LanguageTool/Grammarly)
    // дописывают атрибуты в <html>/<body> до гидрации — это не наш рассинхрон.
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full bg-slate-50 font-sans text-slate-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
