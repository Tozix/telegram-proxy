import './globals.css';
// Self-hosted fonts (no Google Fonts fetch — works where Google is blocked).
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Telegram Proxy — прозрачный прокси для Telegram-ботов',
  description:
    'Drop-in замена api.telegram.org и приём вебхуков для серверов, где Telegram заблокирован. Вебхуки с ретраями, прозрачный Bot API, веб-админка и Swagger.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: браузерные расширения (LanguageTool/Grammarly)
    // дописывают атрибуты в <html>/<body> до гидрации — это не наш рассинхрон.
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 font-sans text-slate-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
