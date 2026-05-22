import { cookies } from 'next/headers';

export const TOKEN_COOKIE = 'tp_token';

/** Read the JWT (safe in Server Components). */
export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

/** Write the JWT — only callable from Server Actions / Route Handlers. */
export async function setToken(token: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Enable only when the admin is served over HTTPS — otherwise the browser
    // drops the cookie on plain-HTTP access and login appears to do nothing.
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: maxAgeSeconds > 0 ? maxAgeSeconds : 60 * 60 * 24 * 7,
  });
}

/** Clear the JWT — only callable from Server Actions / Route Handlers. */
export async function clearToken(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
}
