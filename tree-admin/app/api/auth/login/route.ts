import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to create a SHA-256 hash for password comparison
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Get user from database
    const users = await query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    
    // Check if user exists
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const user = users[0];
    
    // For debugging only - log the passwords to see what's happening
    console.log('User password from DB:', user.password);
    console.log('Input password hashed:', hashPassword(password));
    
    // For first-time setup, allow any password to work if the system is just being set up
    // This is a temporary measure until the first admin is properly created
    let isPasswordValid = false;
    
    // First try direct comparison for hashed passwords
    if (user.password === hashPassword(password)) {
      isPasswordValid = true;
    } 
    // If that fails, assume the stored password might be the clear text for development
    else if (user.password === password) {
      isPasswordValid = true;
      console.log('Using plaintext password comparison for development/setup');
      
      // Update the password to hashed version for future security
      try {
        await query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashPassword(password), user.id]
        );
        console.log('Updated password to hashed version');
      } catch (e) {
        console.error('Failed to update password hash:', e);
      }
    }
    
    // Check if password is valid
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have admin privileges' },
        { status: 403 }
      );
    }
    
    // Update last login time
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectUrl: '/admin'
    });
    
    // Set cookie
    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day in seconds
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
