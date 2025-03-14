import { NextRequest, NextResponse } from 'next/server';

// Specify the runtime for this API route
export const runtime = 'nodejs';

// Get environment variables, with fallbacks
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';

export async function GET(request: NextRequest) {
  try {
    // Set cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Get all cookies
    const cookieStore = request.cookies;
    const allCookies = [...cookieStore.getAll()];
    
    // Log cookies received
    console.log('Debug endpoint received cookies:', 
      allCookies.length > 0 
        ? allCookies.map(c => `${c.name}=${c.value ? 'present' : 'empty'}`).join(', ')
        : 'No cookies found');
    
    // Return information about the cookies
    return NextResponse.json({
      message: 'Cookie debug information',
      cookies: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        length: c.value?.length || 0,
        // Don't return actual values for security
      })),
      authCookiePresent: !!cookieStore.get(AUTH_COOKIE_NAME)?.value,
      loggedInCookiePresent: !!cookieStore.get('logged_in')?.value,
      count: allCookies.length,
      userAgent: request.headers.get('user-agent') || 'Unknown',
    }, { headers });
  } catch (error) {
    console.error('Error in debug cookies endpoint:', error);
    return NextResponse.json({
      error: 'An error occurred analyzing cookies',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Set cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Create a test token
    const testToken = `test_token_${Date.now()}`;
    
    // Return response with test cookies set in different ways
    const response = NextResponse.json({
      message: 'Test cookies set',
      testToken: testToken.substring(0, 10) + '...' // Only show part of token
    }, { headers });
    
    // Maximum compatibility approach for setting cookies
    const maxAge = 60 * 60 * 24; // 1 day in seconds
    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction ? '; Secure' : '';
    
    // Set test cookies directly using Set-Cookie header
    response.headers.append(
      'Set-Cookie',
      `test_auth_token=${testToken}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Lax${secure}; Expires=${expires}`
    );
    
    // Also set a non-HttpOnly test cookie
    response.headers.append(
      'Set-Cookie',
      `test_logged_in=true; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}; Expires=${expires}`
    );
    
    console.log('Set test cookies with manual header approach');
    
    return response;
  } catch (error) {
    console.error('Error setting test cookies:', error);
    return NextResponse.json({
      error: 'An error occurred setting test cookies',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 