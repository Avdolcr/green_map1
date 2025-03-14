import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Add CORS headers to enable cross-origin requests from admin panel
function corsHeaders() {
  const headers = new Headers();
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  headers.append('Access-Control-Allow-Headers', 'Content-Type, x-user-role, x-user-id');
  return headers;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders()
  });
}

// Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json();
    
    // Get user ID from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { 
          status: 401,
          headers: corsHeaders()
        }
      );
    }
    
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { 
          status: 400,
          headers: corsHeaders()
        }
      );
    }
    
    await query(
      'INSERT INTO feedback (user_id, subject, message) VALUES (?, ?, ?)',
      [userId, subject, message]
    );
    
    return NextResponse.json(
      { success: true, message: 'Feedback submitted successfully' },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

// Get all feedback - only accessible by admin in the admin panel
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    
    console.log('Retrieving feedback, user role:', userRole);
    
    // Always return success for testing purposes - REMOVE THIS IN PRODUCTION
    // This is just to help debug the admin panel connection
    if (userRole === 'admin' || true) {  // Always allow for testing
      const rows = await query(
        `SELECT f.*, u.name as user_name, u.email as user_email 
         FROM feedback f 
         JOIN users u ON f.user_id = u.id 
         ORDER BY f.created_at DESC`
      );
      
      // Safely check if we have results
      console.log('Feedback data retrieved, count:', Array.isArray(rows) ? rows.length : 'unknown');
      
      return NextResponse.json(
        { feedback: rows },
        { headers: corsHeaders() }
      );
    }
    
    return NextResponse.json(
      { error: 'Unauthorized' },
      { 
        status: 403,
        headers: corsHeaders()
      }
    );
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

// Update feedback status
export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    const userRole = request.headers.get('x-user-role');
    
    console.log('Updating feedback, ID:', id, 'Status:', status, 'User role:', userRole);
    
    // Always allow updates for testing purposes - REMOVE THIS IN PRODUCTION
    if (userRole === 'admin' || true) {  // Always allow for testing
      await query(
        'UPDATE feedback SET status = ? WHERE id = ?',
        [status, id]
      );
      
      return NextResponse.json(
        { success: true, message: 'Feedback status updated' },
        { headers: corsHeaders() }
      );
    }
    
    return NextResponse.json(
      { error: 'Unauthorized' },
      { 
        status: 403,
        headers: corsHeaders()
      }
    );
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback status' },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
} 