'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { clearToken, setToken } from '@/lib/session';
import type { Bot, LoginResponse } from '@/lib/types';

export type FormState = { error?: string };

function parseAllowedUpdates(formData: FormData): string[] {
  const raw = String(formData.get('allowedUpdates') ?? '').trim();
  return raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

function message(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Введите email и пароль' };

  try {
    const res = await api.post<LoginResponse>('/auth/login', { email, password }, false);
    await setToken(res.accessToken, res.expiresIn);
  } catch (e) {
    return { error: message(e, 'Не удалось войти') };
  }
  redirect('/bots');
}

export async function logout(): Promise<void> {
  await clearToken();
  redirect('/login');
}

export async function createBot(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: Record<string, unknown> = {
    name: String(formData.get('name') ?? '').trim(),
    token: String(formData.get('token') ?? '').trim(),
    targetWebhookUrl: String(formData.get('targetWebhookUrl') ?? '').trim(),
  };
  const allowed = parseAllowedUpdates(formData);
  if (allowed.length) body.allowedUpdates = allowed;
  if (formData.get('dropPendingUpdates') === 'on') body.dropPendingUpdates = true;

  let bot: Bot;
  try {
    bot = await api.post<Bot>('/api/bots', body);
  } catch (e) {
    return { error: message(e, 'Не удалось создать бота') };
  }
  revalidatePath('/bots');
  redirect(`/bots/${bot.id}`);
}

export async function updateBot(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get('id') ?? '');
  const body: Record<string, unknown> = {
    name: String(formData.get('name') ?? '').trim(),
    targetWebhookUrl: String(formData.get('targetWebhookUrl') ?? '').trim(),
    isActive: formData.get('isActive') === 'on',
  };
  const token = String(formData.get('token') ?? '').trim();
  if (token) body.token = token;
  const allowed = parseAllowedUpdates(formData);
  if (allowed.length) body.allowedUpdates = allowed;

  try {
    await api.patch(`/api/bots/${id}`, body);
  } catch (e) {
    return { error: message(e, 'Не удалось сохранить изменения') };
  }
  revalidatePath('/bots');
  revalidatePath(`/bots/${id}`);
  redirect(`/bots/${id}`);
}

export async function refreshWebhook(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  await api.post(`/api/bots/${id}/refresh-webhook`);
  revalidatePath(`/bots/${id}`);
}

export async function deleteBot(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  await api.del(`/api/bots/${id}`);
  revalidatePath('/bots');
  redirect('/bots');
}
