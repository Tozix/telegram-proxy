import Link from 'next/link';
import { createBot } from '@/app/actions';
import { BotForm } from '@/components/BotForm';
import { cardPad } from '@/lib/ui';

export default function NewBotPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/bots" className="text-sm text-slate-400 hover:text-ink">
          ← К списку ботов
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Новый бот</h1>
        <p className="mt-1 text-sm text-slate-400">
          Токен будет проверен через getMe, а вебхук установлен в Telegram автоматически.
        </p>
      </div>
      <div className={cardPad}>
        <BotForm mode="create" action={createBot} />
      </div>
    </div>
  );
}
