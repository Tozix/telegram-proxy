import Link from 'next/link';
import { createBot } from '@/app/actions';
import { BotForm } from '@/components/BotForm';

export default function NewBotPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/bots" className="text-sm text-slate-500 hover:text-slate-700">
          ← К списку ботов
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Новый бот</h1>
        <p className="mt-1 text-sm text-slate-500">
          Токен будет проверен через getMe, а вебхук — установлен в Telegram автоматически.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BotForm mode="create" action={createBot} />
      </div>
    </div>
  );
}
