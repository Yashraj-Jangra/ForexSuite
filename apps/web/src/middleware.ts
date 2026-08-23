import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authPages = ['/login', '/signup', '/onboard'];
  const isAuthPage = authPages.some((p) => request.nextUrl.pathname === p);
  const isPublic = isAuthPage || request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.startsWith('/illustrations');

  if (isPublic) return NextResponse.next();

  const sessionCookie = request.cookies.get('better-auth.session_token')?.value;

  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};