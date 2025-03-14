import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Get all feedback - only accessible by admin
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    // Check if the user is an admin (you might need to adapt this based on your auth system)
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can access feedback' },
        { status: 403 }
      );
    }
    
    // Fetch feedback with user information
    const rows = await query(
      `SELECT f.*, u.name as user_name, u.email as user_email 
       FROM feedback f 
       JOIN users u ON f.user_id = u.id 
       ORDER BY f.created_at DESC`
    );
    
    console.log('Successfully fetched feedback data:', { count: rows?.length });
    
    return NextResponse.json({ feedback: rows });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update feedback status
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status } = data;
    const userRole = request.headers.get('x-user-role');
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id and status' },
        { status: 400 }
      );
    }
    
    // Check if the user is an admin
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can update feedback status' },
        { status: 403 }
      );
    }
    
    // Update feedback status
    await query(
      'UPDATE feedback SET status = ? WHERE id = ?',
      [status, id]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback status updated' 
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 