import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update your password' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Get the user from the database
    const userId = session.user.id;
    const user = await db.selectFrom('users')
      .select(['password'])
      .where('id', '=', userId)
      .executeTakeFirst();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    await db.updateTable('users')
      .set({ 
        password: hashedPassword,
        updated_at: new Date()
      })
      .where('id', '=', userId)
      .execute();
    
    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating your password' },
      { status: 500 }
    );
  }
} 