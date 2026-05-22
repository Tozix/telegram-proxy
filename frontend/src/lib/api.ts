import { redirect } from 'next/navigation';
import { getToken } from './session';

export const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

/**
 * Server-side fetch against the NestJS backend. Attaches the JWT from the
 * httpOnly cookie, so the browser never handles the token. On 401 it bounces
 * to /login (the stale cookie is harmless and gets overwritten on next login).
 */
async function request<T>(path: string, { method = 'GET', body, auth = true }: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', 'application/json');
  if (auth) {
    const token = await getToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 401 && auth) {
    redirect('/login');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data, res.statusText));
  }
  return data as T;
}

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.message)) return obj.message.join(', ');
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.description === 'string') return obj.description;
  }
  return fallback;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};
