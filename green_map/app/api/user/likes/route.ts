import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

// GET handler to retrieve likes for a user with detailed information
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('GET /api/user/likes: Unauthorized - No session found');
      return NextResponse.json({ error: 'Unauthorized', message: 'Please sign in to view your likes' }, { status: 401 });
    }

    console.log('User requesting likes:', session.user.id);

    // Get the content type from query parameters if provided
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type');
    const includeDetails = searchParams.get('details') !== 'false'; // Include details by default

    // Fetch likes with JOIN to get detailed information
    let query = '';
    const queryParams: any[] = [session.user.id];

    if (contentType === 'gallery' || !contentType) {
      // Query for gallery likes with detailed information
      query = `
        SELECT ul.*, 
               g.id AS gallery_id, 
               g.title AS gallery_title, 
               g.description AS gallery_description, 
               g.image_url, 
               g.user_name AS creator_name,
               g.like_count,
               g.created_at AS content_created_at,
               u.name AS user_name,
               u.profile_picture
        FROM user_likes ul
        LEFT JOIN gallery_images g ON ul.content_id = g.id AND ul.content_type = 'gallery'
        LEFT JOIN users u ON ul.user_id = u.id
        WHERE ul.user_id = ? 
      `;
      
      if (contentType) {
        query += ' AND ul.content_type = ?';
        queryParams.push(contentType);
      }
      
      query += ' ORDER BY ul.created_at DESC';
    }
    else if (contentType === 'tree') {
      // Query for tree likes with detailed information
      query = `
        SELECT ul.*, 
               t.id AS tree_id, 
               t.name AS tree_name, 
               t.scientific_name, 
               t.description AS tree_description,
               t.image_url,
               t.like_count,
               t.created_at AS content_created_at,
               u.name AS user_name,
               u.profile_picture
        FROM user_likes ul
        LEFT JOIN trees t ON ul.content_id = t.id AND ul.content_type = 'tree'
        LEFT JOIN users u ON ul.user_id = u.id
        WHERE ul.user_id = ? AND ul.content_type = ?
        ORDER BY ul.created_at DESC
      `;
      queryParams.push(contentType);
    }
    else {
      // Generic query for all other content types
      query = `
        SELECT ul.*, 
               u.name AS user_name,
               u.profile_picture
        FROM user_likes ul
        LEFT JOIN users u ON ul.user_id = u.id
        WHERE ul.user_id = ?
      `;
      
      if (contentType) {
        query += ' AND ul.content_type = ?';
        queryParams.push(contentType);
      }
      
      query += ' ORDER BY ul.created_at DESC';
    }

    console.log('Executing query:', query, 'with params:', queryParams);

    // Execute the query
    const likes = await executeQuery(query, queryParams);
    console.log('Likes retrieved:', Array.isArray(likes) ? likes.length : 'not an array');

    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Error fetching user likes:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching likes' },
      { status: 500 }
    );
  }
}

// POST handler to add a new like
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('POST /api/user/likes: Unauthorized - No session found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Please sign in to like content'
      }, { status: 401 });
    }

    console.log('User adding like:', session.user.id);

    // Get request body
    const body = await request.json();
    const { content_type, content_id } = body;

    console.log('Like request body:', body);

    // Validate required fields
    if (!content_type || !content_id) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, content_id' },
        { status: 400 }
      );
    }

    // Check if the like already exists
    const existingLikes = await executeQuery(
      'SELECT * FROM user_likes WHERE user_id = ? AND content_type = ? AND content_id = ?',
      [session.user.id, content_type, content_id]
    ) as any[];

    if (existingLikes && existingLikes.length > 0) {
      return NextResponse.json(
        { error: 'You have already liked this content', alreadyLiked: true },
        { status: 400 }
      );
    }

    // Add the like
    const result = await executeQuery(
      'INSERT INTO user_likes (user_id, content_type, content_id) VALUES (?, ?, ?)',
      [session.user.id, content_type, content_id]
    );

    console.log('Like inserted:', result);

    // Get detail info of liked content
    let contentInfo = {};
    if (content_type === 'gallery') {
      const galleryData = await executeQuery(
        'SELECT title, image_url FROM gallery_images WHERE id = ?',
        [content_id]
      ) as any[];
      
      if (galleryData && galleryData.length > 0) {
        contentInfo = galleryData[0];
      }
      
      // Update like count in the appropriate table
      await executeQuery(
        'UPDATE gallery_images SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?',
        [content_id]
      );
    } else if (content_type === 'tree') {
      const treeData = await executeQuery(
        'SELECT name, scientific_name, image_url FROM trees WHERE id = ?',
        [content_id]
      ) as any[];
      
      if (treeData && treeData.length > 0) {
        contentInfo = treeData[0];
      }
      
      await executeQuery(
        'UPDATE trees SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?',
        [content_id]
      );
    }

    // Add to user activity
    await executeQuery(
      'INSERT INTO user_activity (user_id, activity_type, content_type, content_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [session.user.id, 'like', content_type, content_id, JSON.stringify(contentInfo)]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Content liked successfully',
      content_info: contentInfo
    });
  } catch (error) {
    console.error('Error adding like:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding like' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a like
export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('DELETE /api/user/likes: Unauthorized - No session found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Please sign in to unlike content'
      }, { status: 401 });
    }

    console.log('User removing like:', session.user.id);

    // Get request body
    const body = await request.json();
    const { content_type, content_id } = body;

    console.log('Unlike request body:', body);

    // Validate required fields
    if (!content_type || !content_id) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, content_id' },
        { status: 400 }
      );
    }

    // Check if the like exists
    const existingLikes = await executeQuery(
      'SELECT * FROM user_likes WHERE user_id = ? AND content_type = ? AND content_id = ?',
      [session.user.id, content_type, content_id]
    ) as any[];

    if (!existingLikes || existingLikes.length === 0) {
      return NextResponse.json(
        { error: 'You have not liked this content', notLiked: true },
        { status: 400 }
      );
    }

    // Remove the like
    const result = await executeQuery(
      'DELETE FROM user_likes WHERE user_id = ? AND content_type = ? AND content_id = ?',
      [session.user.id, content_type, content_id]
    );

    console.log('Like deleted:', result);

    // Update like count in the appropriate table
    if (content_type === 'gallery') {
      await executeQuery(
        'UPDATE gallery_images SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = ?',
        [content_id]
      );
    } else if (content_type === 'tree') {
      await executeQuery(
        'UPDATE trees SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = ?',
        [content_id]
      );
    }

    // Add to user activity record for the unlike action (optional)
    await executeQuery(
      'INSERT INTO user_activity (user_id, activity_type, content_type, content_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [session.user.id, 'unlike', content_type, content_id, JSON.stringify({action: 'unlike'})]
    );

    return NextResponse.json({ success: true, message: 'Content unliked successfully' });
  } catch (error) {
    console.error('Error removing like:', error);
    return NextResponse.json(
      { error: 'An error occurred while removing like' },
      { status: 500 }
    );
  }
} 