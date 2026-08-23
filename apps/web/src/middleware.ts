import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authPages = ['/login', '/signup', '/onboard'];
  const isAuthPage = authPages.some((p) => pathname === p);
  const isPublic =
    isAuthPage ||
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/illustrations') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    pathname === '/offline.html' ||
    pathname === '/favicon.ico';

  if (isPublic) return NextResponse.next();

  const sessionCookie = request.cookies.get('better-auth.session_token')?.value;

  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html).*)'],
};