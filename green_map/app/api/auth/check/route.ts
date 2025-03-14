import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Specify the runtime for this API route
export const runtime = 'nodejs';

// Get environment variables, with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';

export async function GET(request: NextRequest) {
  // Set cache control headers
  const headers = new Headers();
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  try {
    // Check headers first (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    // If userId is present in headers, the user is authenticated via middleware
    if (userId) {
      console.log('User authenticated via headers. User ID:', userId);
      return NextResponse.json({
        isLoggedIn: true,
        userId,
        role: userRole
      }, { headers });
    }
    
    // If not found in headers, check cookies directly
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    
    if (token) {
      try {
        // Verify the token with error handling
        const decoded = verify(token, JWT_SECRET);
        
        if (typeof decoded === 'object' && decoded !== null) {
          console.log('User authenticated via cookie. User ID:', decoded.userId);
          return NextResponse.json({
            isLoggedIn: true,
            userId: decoded.userId,
            role: decoded.role,
            name: decoded.name
          }, { headers });
        }
      } catch (e: any) { // Cast error to any to access message property
        console.error('Invalid token in cookie:', e);
        
        // Return a specific error for crypto module issues that might occur in Edge runtime
        if (e.message && typeof e.message === 'string' && e.message.includes('crypto module')) {
          return NextResponse.json({
            isLoggedIn: false,
            error: 'Runtime compatibility issue with JWT verification. Please try again.',
            runtimeIssue: true
          }, { headers });
        }
      }
    }
    
    // Check for logged_in cookie as fallback
    const loggedInFlag = request.cookies.get('logged_in')?.value;
    if (loggedInFlag === 'true') {
      console.log('User has logged_in cookie but no valid auth token');
      return NextResponse.json({
        isLoggedIn: false,
        cookieIssue: true,
        error: 'Cookie issue detected - auth token missing but logged_in flag present'
      }, { headers });
    }
    
    // If we reach here, user is not authenticated
    console.log('User is not authenticated');
    return NextResponse.json({
      isLoggedIn: false
    }, { headers });
  } catch (error) {
    console.error('Error in auth check endpoint:', error);
    return NextResponse.json({
      isLoggedIn: false,
      error: 'An error occurred checking authentication'
    }, { status: 500, headers });
  }
} 