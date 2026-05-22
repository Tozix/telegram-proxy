import Link from 'next/link';
import { updateBot } from '@/app/actions';
import { BotForm } from '@/components/BotForm';
import { api } from '@/lib/api';
import type { Bot } from '@/lib/types';
import { cardPad } from '@/lib/ui';

export const dynamic = 'force-dynamic';

export default async function EditBotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bot = await api.get<Bot>(`/api/bots/${id}`);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/bots/${bot.id}`} className="text-sm text-slate-400 hover:text-ink">
          ← К боту
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Редактирование: {bot.name}</h1>
      </div>
      <div className={cardPad}>
        <BotForm mode="edit" action={updateBot} bot={bot} />
      </div>
    </div>
  );
}
