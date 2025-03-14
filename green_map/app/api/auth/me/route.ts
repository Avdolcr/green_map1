import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // Get authenticated session using Next-Auth
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      console.log('No authenticated session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user ID from the session
    const userId = session.user.id;
    console.log('Authenticated user ID:', userId);
    
    // Fetch the latest user data from the database
    const users = await executeQuery(
      'SELECT id, name, email, role, profile_picture, bio, location, joined_date, created_at, contributions_count FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    // Check if user exists in database
    if (!Array.isArray(users) || users.length === 0) {
      console.log('User not found in database:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    console.log('User data retrieved successfully');
    
    // Return user data
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate user' },
      { status: 401 }
    );
  }
} 