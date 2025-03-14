import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: true, message: "No active session" },
        { status: 200 }
      );
    }
    
    // Create a response that clears cookies
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
      redirect: "/"
    });
    
    // Clear all auth-related cookies
    response.cookies.delete('token');
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('next-auth.csrf-token');
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 