import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you'd check for admin authentication here
    // For now, we'll skip the auth check since next-auth may not be set up
    
    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    try {
      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total FROM chatbot_history 
         WHERE user_message LIKE ? OR bot_response LIKE ?`,
        [`%${search}%`, `%${search}%`]
      );
      
      const total = Array.isArray(countResult) && countResult.length > 0
        ? (countResult[0] as any).total 
        : 0;
      
      // Get chat history with pagination
      const chatHistory = await query(
        `SELECT ch.id, ch.user_id, ch.session_id, ch.user_message, 
                ch.bot_response, ch.created_at, u.name as user_name, u.email,
                COALESCE(u.email, 'Anonymous User') as display_name
         FROM chatbot_history ch
         LEFT JOIN users u ON ch.user_id = u.id
         WHERE ch.user_message LIKE ? OR ch.bot_response LIKE ?
         ORDER BY ch.created_at DESC
         LIMIT ? OFFSET ?`,
        [`%${search}%`, `%${search}%`, limit, offset]
      );
      
      return NextResponse.json({
        data: chatHistory,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add a DELETE endpoint to delete chat history by session ID
export async function DELETE(request: NextRequest) {
  try {
    // In a real implementation, you'd check for admin authentication here
    
    // Get session ID from the request
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Delete chat history for the session
    await query(
      `DELETE FROM chatbot_history WHERE session_id = ?`,
      [sessionId]
    );
    
    return NextResponse.json({ success: true, message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json({ error: 'Failed to delete chat history' }, { status: 500 });
  }
}

// Add a POST endpoint to export chat history as CSV
export async function POST(request: NextRequest) {
  try {
    // In a real implementation, you'd check for admin authentication here
    
    // Get parameters from the request
    const { sessionId, format = 'csv' } = await request.json();
    
    let whereClause = '';
    let params: string[] = [];
    
    if (sessionId) {
      whereClause = 'WHERE ch.session_id = ?';
      params = [sessionId];
    }
    
    // Get chat history for export
    const chatHistory = await query(
      `SELECT ch.id, ch.session_id, ch.user_id, u.name as user_name, 
              u.email, ch.user_message, ch.bot_response, ch.created_at
       FROM chatbot_history ch
       LEFT JOIN users u ON ch.user_id = u.id
       ${whereClause}
       ORDER BY ch.created_at`,
      params
    );
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID', 'Session ID', 'User ID', 'User Name', 'Email', 
        'User Message', 'Bot Response', 'Created At'
      ];
      
      const csvRows = [
        headers.join(','),
        ...Array.isArray(chatHistory) ? chatHistory.map((row: any) => {
          return [
            row.id,
            `"${row.session_id}"`,
            row.user_id || '',
            `"${(row.user_name || '').replace(/"/g, '""')}"`,
            `"${(row.email || '').replace(/"/g, '""')}"`,
            `"${row.user_message.replace(/"/g, '""')}"`,
            `"${row.bot_response.replace(/"/g, '""')}"`,
            `"${row.created_at}"`
          ].join(',');
        }) : []
      ];
      
      const csvContent = csvRows.join('\n');
      
      // Return CSV as plain text
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=chatbot_history_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }
    
    // Default JSON response
    return NextResponse.json({ data: chatHistory });
  } catch (error) {
    console.error('Error exporting chat history:', error);
    return NextResponse.json({ error: 'Failed to export chat history' }, { status: 500 });
  }
}
