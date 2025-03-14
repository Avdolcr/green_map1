import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// POST handler to add a reply to feedback
export async function POST(request: NextRequest) {
  try {
    // Check for admin role in x-user-role header
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { feedback_id, reply } = body;

    // Validate required fields
    if (!feedback_id || !reply) {
      return NextResponse.json(
        { error: 'Missing required fields: feedback_id, reply' },
        { status: 400 }
      );
    }

    // Check if the feedback exists
    const feedbackResult = await executeQuery(
      'SELECT * FROM feedback WHERE id = ?',
      [feedback_id]
    ) as any[];

    if (!feedbackResult || feedbackResult.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Update the feedback with the reply
    await executeQuery(
      'UPDATE feedback SET admin_reply = ?, status = "replied", reply_date = NOW() WHERE id = ?',
      [reply, feedback_id]
    );

    // Add to user activity
    await executeQuery(
      'INSERT INTO user_activity (user_id, activity_type, content_type, content_id) VALUES (?, ?, ?, ?)',
      [feedbackResult[0].user_id, 'feedback', 'feedback', feedback_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding reply to feedback:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding reply' },
      { status: 500 }
    );
  }
} 