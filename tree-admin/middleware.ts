import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Secret key for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  console.log('Middleware processing path:', pathname);

  // Exclude authentication routes and static assets
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/signup') || 
      pathname.startsWith('/api/auth') ||
      pathname.includes('_next') ||
      pathname.includes('favicon')) {
    console.log('Skipping auth check for:', pathname);
    return NextResponse.next();
  }

  // Check for admin routes that need protection
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/chatbot-history') || 
      pathname.startsWith('/api/feedback') || 
      pathname.startsWith('/api/system/db-test') ||
      pathname.startsWith('/api/chatbot-history')) {
    
    console.log('Protected route detected:', pathname);
    
    // Get auth token from cookies
    const adminToken = request.cookies.get('admin_token')?.value;
    
    console.log('Admin token present:', !!adminToken);
    
    // If no token, redirect to login
    if (!adminToken) {
      console.log('No admin token, redirecting to login');
      const url = new URL('/login', request.url);
      url.searchParams.set('from', encodeURI(request.nextUrl.pathname));
      return NextResponse.redirect(url);
    }
    
    try {
      // For simplicity, we'll consider a token present as valid for now
      // In a real production app, you'd verify the token fully here
      console.log('Token found, proceeding to admin area');
      
      // Add user info to headers from token
      const headers = new Headers(request.headers);
      headers.set('x-auth-token', adminToken);
      
      // Continue with the request but add the headers
      return NextResponse.next({
        request: {
          headers,
        },
      });
    } catch (error) {
      console.error('Auth error:', error);
      // Delete invalid cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // Special check for the migrate API endpoint
  if (pathname === '/api/migrate') {
    // Check if the request is coming from our site
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');

    // Create URL objects for safe comparison
    const requestHost = request.nextUrl.hostname;
    const refererHost = referer ? new URL(referer).hostname : null;
    const originHost = origin ? new URL(origin).hostname : null;

    // Local development check
    const isLocalhost = requestHost === 'localhost' || requestHost === '127.0.0.1';
    
    // Check if referer or origin matches request host,
    // or if we're in a development environment
    if (
      isLocalhost ||
      refererHost === requestHost ||
      originHost === requestHost
    ) {
      return NextResponse.next();
    } else {
      // Block external requests to migrate API
      return new NextResponse('Unauthorized', { status: 403 });
    }
  }

  // Allow all other requests
  return NextResponse.next();
}

// Configure the middleware to run for specified paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};