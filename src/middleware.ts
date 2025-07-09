import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAuth } from '@/lib/auth';

export function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const isAuthenticated = checkAuth(request);
    
    if (!isAuthenticated && request.nextUrl.pathname !== '/dashboard/login') {
      return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }
    
    if (isAuthenticated && request.nextUrl.pathname === '/dashboard/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};