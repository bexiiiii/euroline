import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value || '';
  // Also support localStorage token via headers proxy (optional)
  const isAuthPage = request.nextUrl.pathname.startsWith('/signin') || request.nextUrl.pathname.startsWith('/signup');

  // If no token and protected path, redirect to signin
  const protectedPrefixes = ['/','/customers','/orders','/products','/returns','/return-requests','/users','/finance','/api-management','/system-status','/error-logs','/site-settings'];
  const isProtected = protectedPrefixes.some(prefix => request.nextUrl.pathname.startsWith(prefix));

  if (!token && isProtected && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/signin',
    '/signup',
    '/customers/:path*',
    '/orders/:path*',
    '/products/:path*',
    '/returns/:path*',
    '/return-requests/:path*',
    '/users/:path*',
    '/finance/:path*',
    '/api-management/:path*',
    '/system-status/:path*',
    '/error-logs/:path*',
    '/site-settings/:path*',
  ],
};
