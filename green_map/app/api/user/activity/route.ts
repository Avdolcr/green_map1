import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

// GET handler to retrieve user activities with enhanced details
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('GET /api/user/activity: Unauthorized - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User requesting activity:', session.user.id);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type');
    const activityType = searchParams.get('activity');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeDetails = searchParams.get('details') !== 'false'; // Include details by default

    // First, retrieve activities based on activity type
    let activitiesQuery = '';
    const queryParams: any[] = [session.user.id];

    if (activityType === 'like' || (!activityType && (contentType === 'gallery' || !contentType))) {
      // Query for like activities with JOIN to get detailed content information
      activitiesQuery = `
        SELECT ua.*, 
               u.name AS user_name,
               u.profile_picture,
               CASE 
                 WHEN ua.content_type = 'gallery' THEN g.title
                 WHEN ua.content_type = 'tree' THEN t.name
                 ELSE NULL
               END AS content_title,
               CASE 
                 WHEN ua.content_type = 'gallery' THEN g.image_url
                 WHEN ua.content_type = 'tree' THEN t.image_url
                 ELSE NULL
               END AS content_image_url,
               CASE 
                 WHEN ua.content_type = 'gallery' THEN g.description
                 WHEN ua.content_type = 'tree' THEN t.description
                 ELSE NULL
               END AS content_description,
               CASE 
                 WHEN ua.content_type = 'gallery' THEN g.user_name
                 ELSE NULL
               END AS content_creator
        FROM user_activity ua
        LEFT JOIN users u ON ua.user_id = u.id
        LEFT JOIN gallery_images g ON ua.content_type = 'gallery' AND ua.content_id = g.id
        LEFT JOIN trees t ON ua.content_type = 'tree' AND ua.content_id = t.id
        WHERE ua.user_id = ?
      `;
      
      // Add activity type filter if provided
      if (activityType) {
        activitiesQuery += ' AND ua.activity_type = ?';
        queryParams.push(activityType);
      }
      
      // Add content type filter if provided
      if (contentType) {
        activitiesQuery += ' AND ua.content_type = ?';
        queryParams.push(contentType);
      }
    } else {
      // Generic query for other activity types
      activitiesQuery = `
        SELECT ua.*,
               u.name AS user_name,
               u.profile_picture,
               ua.metadata
        FROM user_activity ua
        LEFT JOIN users u ON ua.user_id = u.id
        WHERE ua.user_id = ?
      `;
      
      // Add activity type filter if provided
      if (activityType) {
        activitiesQuery += ' AND ua.activity_type = ?';
        queryParams.push(activityType);
      }
      
      // Add content type filter if provided
      if (contentType) {
        activitiesQuery += ' AND ua.content_type = ?';
        queryParams.push(contentType);
      }
    }
    
    // Order by most recent first and apply pagination
    activitiesQuery += ' ORDER BY ua.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit);
    queryParams.push(offset);

    console.log('Executing activity query:', activitiesQuery, 'with params:', queryParams);

    // Execute the query
    let activities = await executeQuery(activitiesQuery, queryParams) as any[];
    
    // If we didn't get activities with the JOIN or need additional details
    if (includeDetails && Array.isArray(activities) && activities.length > 0) {
      // Process activities to add additional details if needed
      activities = await Promise.all(activities.map(async (activity) => {
        // Parse metadata if it exists
        if (activity.metadata && typeof activity.metadata === 'string') {
          try {
            activity.metadata = JSON.parse(activity.metadata);
          } catch (e) {
            console.warn('Could not parse activity metadata:', e);
          }
        }
        
        // If we already have content details from the JOIN, no need to fetch again
        if (activity.content_title || activity.content_image_url) {
          return {
            ...activity,
            contentDetails: {
              title: activity.content_title,
              image_url: activity.content_image_url,
              description: activity.content_description,
              creator: activity.content_creator
            }
          };
        }
        
        // Get details based on content type if not already included
        let details = {};
        
        if (activity.content_type === 'gallery' && activity.content_id) {
          const images = await executeQuery(
            'SELECT id, title, image_url, description, user_name, like_count FROM gallery_images WHERE id = ?', 
            [activity.content_id]
          ) as any[];
          
          if (images && images.length > 0) {
            details = images[0];
          }
        } else if (activity.content_type === 'tree' && activity.content_id) {
          const trees = await executeQuery(
            'SELECT id, name, scientific_name, image_url, description, like_count FROM trees WHERE id = ?', 
            [activity.content_id]
          ) as any[];
          
          if (trees && trees.length > 0) {
            details = trees[0];
          }
        } else if (activity.content_type === 'feedback' && activity.content_id) {
          const feedbacks = await executeQuery(
            'SELECT id, subject, message, status, admin_reply FROM feedback WHERE id = ?', 
            [activity.content_id]
          ) as any[];
          
          if (feedbacks && feedbacks.length > 0) {
            details = feedbacks[0];
          }
        }
        
        return {
          ...activity,
          contentDetails: details
        };
      }));
    }

    // If specifically looking for likes, also get current like status
    if (activityType === 'like' || activityType === 'all') {
      // Get currently liked content for the user to show current status
      const likedContentQuery = `
        SELECT content_type, content_id 
        FROM user_likes 
        WHERE user_id = ?
      `;
      
      const likedContent = await executeQuery(likedContentQuery, [session.user.id]) as any[];
      
      // Create a map of currently liked content
      const likedMap = new Map();
      if (Array.isArray(likedContent)) {
        likedContent.forEach(like => {
          const key = `${like.content_type}_${like.content_id}`;
          likedMap.set(key, true);
        });
      }
      
      // Add current like status to each activity
      activities = activities.map(activity => {
        const isLiked = likedMap.has(`${activity.content_type}_${activity.content_id}`);
        return {
          ...activity,
          is_currently_liked: isLiked
        };
      });
    }

    return NextResponse.json({ 
      activities,
      pagination: {
        limit,
        offset,
        total: activities.length // This would ideally be a count query
      }
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching activities' },
      { status: 500 }
    );
  }
}

// POST handler to record a new activity
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('POST /api/user/activity: Unauthorized - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User recording activity:', session.user.id);

    // Get request body
    const body = await request.json();
    const { activity_type, content_type, content_id, metadata } = body;

    // Validate required fields
    if (!activity_type || !content_type || !content_id) {
      return NextResponse.json(
        { error: 'Missing required fields: activity_type, content_type, content_id' },
        { status: 400 }
      );
    }

    // Validate activity type
    const validActivityTypes = ['view', 'like', 'unlike', 'upload', 'feedback', 'comment'];
    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json(
        { error: 'Invalid activity_type. Must be one of: ' + validActivityTypes.join(', ') },
        { status: 400 }
      );
    }

    // Process metadata
    let metadataStr = null;
    if (metadata) {
      if (typeof metadata === 'object') {
        metadataStr = JSON.stringify(metadata);
      } else if (typeof metadata === 'string') {
        metadataStr = metadata;
      }
    }

    // Record the activity
    await executeQuery(
      'INSERT INTO user_activity (user_id, activity_type, content_type, content_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [session.user.id, activity_type, content_type, content_id, metadataStr]
    );

    // Update view count if it's a view activity
    if (activity_type === 'view') {
      if (content_type === 'gallery') {
        await executeQuery(
          'UPDATE gallery_images SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
          [content_id]
        );
      } else if (content_type === 'tree') {
        await executeQuery(
          'UPDATE trees SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
          [content_id]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Activity recorded successfully' });
  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json(
      { error: 'An error occurred while recording activity' },
      { status: 500 }
    );
  }
} 