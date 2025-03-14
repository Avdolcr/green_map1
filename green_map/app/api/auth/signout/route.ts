import { NextResponse } from 'next/server';

export async function GET() {
  // Create response object
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear the token cookie
  response.cookies.set({
    name: 'token',
    value: '',
    expires: new Date(0), // Set expiration to the past
    path: '/',
  });

  // Redirect to home page
  return response;
}

// Keep POST method for backward compatibility
export async function POST() {
  return GET();
} 