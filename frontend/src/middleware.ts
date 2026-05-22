import { NextResponse, type NextRequest } from 'next/server';

const TOKEN_COOKIE = 'tp_token';

// Public pages reachable without a session.
const PUBLIC_PATHS = new Set(['/', '/guide', '/login']);

export function middleware(req: NextRequest) {
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  // Already signed in → skip the login page, go to the admin.
  if (token && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/bots';
    return NextResponse.redirect(url);
  }

  // Unauthenticated users may only see public pages.
  if (!token && !PUBLIC_PATHS.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
