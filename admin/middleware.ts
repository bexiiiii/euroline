import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of API paths that should be forwarded to the backend
const API_PATHS = [
  '/api/news',
  '/api/files',
  '/api/products',
  '/api/categories',
  '/api/search',
  '/api/auth',
  '/api/users',
  '/api/orders',
  '/api/cart',
  '/api/banners',
  '/api/finance',
  '/api/promotions'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is an API request that should be forwarded to the backend
  const isApiRequest = API_PATHS.some(path => pathname.startsWith(path));
  
  if (isApiRequest) {
    // Get the API base URL from environment variables
    const apiBaseEnv = process.env.NEXT_PUBLIC_API_URL || 'https://euroline.1edu.kz';
    const apiBaseUrl = apiBaseEnv.replace(/\/+$/, '');

    // Create the target URL by replacing the pathname while preserving query string
    const targetUrl = new URL(`${pathname}${request.nextUrl.search}`, `${apiBaseUrl}/`);
    
    // Forward the request to the backend
    const response = NextResponse.rewrite(targetUrl, {
      request: {
        headers: request.headers,
      },
    });
    
    return response;
  }
  
  // Continue with the normal request processing
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
