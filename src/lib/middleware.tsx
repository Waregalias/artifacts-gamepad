import { NextResponse } from 'next/server';

export function middleware(request: { nextUrl: { pathname: string; }; url: string | URL | undefined; }) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/controller', request.url));
  }
  return NextResponse.next();
}

// Définir sur quels chemins le middleware s'applique
export const config = {
  matcher: ['/'],
};
