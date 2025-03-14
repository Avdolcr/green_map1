import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update your profile' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { name, bio, location, profile_picture, profile_color } = body;
    
    // Validate input
    if (profile_picture && typeof profile_picture !== 'string') {
      return NextResponse.json(
        { error: 'Profile picture must be a string URL' },
        { status: 400 }
      );
    }
    
    if (name && (typeof name !== 'string' || name.length < 2)) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }
    
    // Get the user's current data
    const userId = session.user.id;
    const currentUser = await db.selectFrom('users')
      .select(['preferences'])
      .where('id', '=', userId)
      .executeTakeFirst();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };
    
    // Only include fields that are provided
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture;
    
    // Handle preferences (including profile_color)
    if (profile_color !== undefined) {
      // Parse current preferences or create new object
      let preferences = currentUser.preferences ? 
        (typeof currentUser.preferences === 'string' ? 
          JSON.parse(currentUser.preferences) : currentUser.preferences) : {};
      
      // Update profile_color
      preferences.profile_color = profile_color;
      
      // Update preferences field
      updateData.preferences = JSON.stringify(preferences);
    }
    
    // Update user in database
    await db.updateTable('users')
      .set(updateData)
      .where('id', '=', userId)
      .execute();
    
    // Get updated user data to return
    const updatedUser = await db.selectFrom('users')
      .select([
        'id', 
        'name', 
        'email', 
        'role', 
        'profile_picture', 
        'bio', 
        'location',
        'joined_date',
        'preferences',
        'created_at'
      ])
      .where('id', '=', userId)
      .executeTakeFirst();
    
    // Format preferences for client
    let formattedUser: any = { ...updatedUser };
    if (formattedUser.preferences && typeof formattedUser.preferences === 'string') {
      formattedUser.preferences = JSON.parse(formattedUser.preferences);
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Profile updated successfully',
        user: formattedUser
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating your profile' },
      { status: 500 }
    );
  }
} 