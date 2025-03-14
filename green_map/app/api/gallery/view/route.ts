import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { imageId } = body;

    // Validate required fields
    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing required field: imageId' },
        { status: 400 }
      );
    }

    // Update view count in the gallery_images table
    await executeQuery(
      'UPDATE gallery_images SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
      [imageId]
    );

    // If user is logged in, record the view in user_activity
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      try {
        // Check if the user has already viewed this image recently (within 24 hours)
        const existingViews = await executeQuery(
          `SELECT * FROM user_activity 
           WHERE user_id = ? AND activity_type = 'view' AND content_type = 'gallery' AND content_id = ?
           AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
          [session.user.id, imageId]
        ) as any[];

        // Only record the view if the user hasn't viewed it recently
        if (!existingViews || (Array.isArray(existingViews) && existingViews.length === 0)) {
          await executeQuery(
            'INSERT INTO user_activity (user_id, activity_type, content_type, content_id) VALUES (?, ?, ?, ?)',
            [session.user.id, 'view', 'gallery', imageId]
          );
          console.log('Recorded view activity for user:', session.user.id, 'on image:', imageId);
        } else {
          console.log('User already viewed this image recently:', session.user.id, 'image:', imageId);
        }
      } catch (activityError) {
        // Don't fail the request if recording user activity fails
        console.error('Error recording user view activity:', activityError);
      }
    } else {
      console.log('Anonymous view recorded for image:', imageId);
    }

    return NextResponse.json({ success: true, message: 'View count updated successfully' });
  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating view count' },
      { status: 500 }
    );
  }
} 