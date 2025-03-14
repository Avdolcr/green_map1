import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define paths that need authentication
const PROTECTED_PATHS = [
  '/admin',
  '/profile',
  '/api/gallery/upload',
  '/api/feedback',
  '/gallery/upload',
  '/feedback/submit',
];

// Define paths that specifically need admin access
const ADMIN_PATHS = [
  '/admin',
];

// Public paths accessible to everyone
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/map',
  '/trees',
  '/api/auth/signin',
  '/api/auth/signup',
  '/gallery',
  '/feedback',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path)) && 
      !PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check token
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login if no token
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check for admin access if needed
    if (ADMIN_PATHS.some(path => pathname.startsWith(path)) && payload.role !== 'admin') {
      // Redirect non-admin users attempting to access admin paths
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Attach user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId));
    requestHeaders.set('x-user-role', String(payload.role));
    
    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token verification failed, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads|.+\\..+).*)',
  ],
}; 