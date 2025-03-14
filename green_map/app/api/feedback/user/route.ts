import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

// GET handler to retrieve feedback for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch feedback for the current user
    // Explicitly list all columns including admin_reply and reply_date
    const feedback = await executeQuery(
      `SELECT id, user_id, subject, message, status, created_at, 
              admin_reply, reply_date, updated_at 
       FROM feedback 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching feedback' },
      { status: 500 }
    );
  }
} 