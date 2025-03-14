import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('User stats: Unauthorized - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('Getting stats for user:', userId);
    
    // IMPORTANT FIX: Check for likes that are not in the activity table and add them
    await syncLikesWithActivity(Number(userId));
    
    // Get contributions count from user record
    const users = await executeQuery(
      'SELECT contributions_count FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    const contributionsCount = users.length > 0 ? users[0].contributions_count || 0 : 0;
    
    // Count likes given by user
    const likesResult = await executeQuery(
      'SELECT COUNT(*) as count FROM user_likes WHERE user_id = ?',
      [userId]
    ) as any[];
    
    const likesCount = likesResult.length > 0 ? likesResult[0].count || 0 : 0;
    
    // Count gallery image uploads
    const galleryUploadsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM gallery_images WHERE user_id = ?',
      [userId]
    ) as any[];
    
    // Check if the gallery_images table has a user_id column, if not use user_email
    let uploadCount = 0;
    
    if (galleryUploadsResult.length > 0) {
      uploadCount = galleryUploadsResult[0].count || 0;
    } else {
      // Try with user email as fallback
      const user = await executeQuery(
        'SELECT email FROM users WHERE id = ?',
        [userId]
      ) as any[];
      
      if (user.length > 0) {
        const userEmail = user[0].email;
        const emailUploadsResult = await executeQuery(
          'SELECT COUNT(*) as count FROM gallery_images WHERE user_email = ?',
          [userEmail]
        ) as any[];
        
        uploadCount = emailUploadsResult.length > 0 ? emailUploadsResult[0].count || 0 : 0;
      }
    }
    
    // Count feedback submissions
    const feedbackResult = await executeQuery(
      'SELECT COUNT(*) as count FROM feedback WHERE user_id = ?',
      [userId]
    ) as any[];
    
    const feedbackCount = feedbackResult.length > 0 ? feedbackResult[0].count || 0 : 0;
    
    // Get activity counts by type
    const activityQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM user_activity
      WHERE user_id = ?
      GROUP BY activity_type
    `;
    
    const activityCounts = await executeQuery(activityQuery, [userId]) as any[];
    
    // Build activity data object
    const activityData: Record<string, number> = {};
    if (Array.isArray(activityCounts)) {
      activityCounts.forEach(item => {
        activityData[item.activity_type] = item.count;
      });
    }
    
    // Return all stats
    return NextResponse.json({
      contributionsCount,
      likesCount,
      uploadCount,
      feedbackCount,
      activityCounts: activityData,
      // Additional aggregate stats
      totalActivity: Object.values(activityData).reduce((sum, count) => sum + count, 0)
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching user statistics' },
      { status: 500 }
    );
  }
}

/**
 * Synchronizes user likes with the activity table to ensure consistency
 */
async function syncLikesWithActivity(userId: number) {
  try {
    // Find likes that don't have a corresponding activity
    const query = `
      SELECT ul.* 
      FROM user_likes ul
      LEFT JOIN user_activity ua ON 
        ua.user_id = ul.user_id AND 
        ua.content_type = ul.content_type AND 
        ua.content_id = ul.content_id AND
        ua.activity_type = 'like'
      WHERE ul.user_id = ? AND ua.id IS NULL
    `;
    
    const missingLikeActivities = await executeQuery(query, [userId]) as any[];
    
    if (Array.isArray(missingLikeActivities) && missingLikeActivities.length > 0) {
      console.log(`Found ${missingLikeActivities.length} likes without activity records for user ${userId}`);
      
      // Add missing activities
      for (const like of missingLikeActivities) {
        // Get content details to store in metadata
        let contentInfo = {};
        
        if (like.content_type === 'gallery') {
          const galleryData = await executeQuery(
            'SELECT title, image_url FROM gallery_images WHERE id = ?',
            [like.content_id]
          ) as any[];
          
          if (galleryData && galleryData.length > 0) {
            contentInfo = galleryData[0];
          }
        } else if (like.content_type === 'tree') {
          const treeData = await executeQuery(
            'SELECT name, scientific_name, image_url FROM trees WHERE id = ?',
            [like.content_id]
          ) as any[];
          
          if (treeData && treeData.length > 0) {
            contentInfo = treeData[0];
          }
        }
        
        // Insert the missing activity
        await executeQuery(
          'INSERT INTO user_activity (user_id, activity_type, content_type, content_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            like.user_id, 
            'like', 
            like.content_type, 
            like.content_id, 
            JSON.stringify(contentInfo),
            like.created_at // Use the original like timestamp
          ]
        );
      }
      
      console.log(`Successfully synchronized ${missingLikeActivities.length} likes to activity table`);
    }
  } catch (error) {
    console.error('Error synchronizing likes with activity:', error);
    // Continue anyway, as this is just a repair step
  }
} 