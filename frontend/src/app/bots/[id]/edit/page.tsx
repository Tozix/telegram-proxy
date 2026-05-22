import Link from 'next/link';
import { updateBot } from '@/app/actions';
import { BotForm } from '@/components/BotForm';
import { api } from '@/lib/api';
import type { Bot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditBotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bot = await api.get<Bot>(`/api/bots/${id}`);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/bots/${bot.id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← К боту
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Редактирование: {bot.name}</h1>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BotForm mode="edit" action={updateBot} bot={bot} />
      </div>
    </div>
  );
}
