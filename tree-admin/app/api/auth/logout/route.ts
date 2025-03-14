import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Create response
  const response = NextResponse.json({
    message: 'Logged out successfully'
  });
  
  // Clear the admin_token cookie
  response.cookies.delete('admin_token');
  
  return response;
}
