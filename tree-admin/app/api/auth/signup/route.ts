import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail, generateWelcomeEmail } from '@/lib/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_KEY = process.env.ADMIN_KEY || 'green-map-admin-key-2023';

// Helper function to create a SHA-256 hash for password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, adminKey } = await request.json();
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Verify admin key
    if (!adminKey || adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Invalid admin key' },
        { status: 403 }
      );
    }
    
    // Check if user with this email already exists
    const existingUsers = await query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = hashPassword(password);
    
    // Insert new user
    const result = await query(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, 'admin']
    );
    
    if (!result || !result.insertId) {
      throw new Error('Failed to create user');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertId, 
        email: email, 
        name: name, 
        role: 'admin' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send welcome email
    const emailContent = generateWelcomeEmail(name, 'admin');
    const emailSent = await sendEmail({
      from: 'noreply@greenmap.org',
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
    
    console.log('Welcome email sent:', emailSent);
    
    // Create response
    const response = NextResponse.json({
      message: 'Admin account created successfully',
      user: {
        id: result.insertId,
        name,
        email,
        role: 'admin',
      },
      emailSent,
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
