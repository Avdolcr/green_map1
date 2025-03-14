import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { sendEmail, generateWelcomeEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { name, email, password } = body;
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await db.selectFrom('users')
      .select(['id'])
      .where('email', '=', email)
      .executeTakeFirst();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get current date for joined_date and timestamps
    const now = new Date();
    
    // Create the user in the database
    const newUser = await db.insertInto('users')
      .values({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        joined_date: now,
        created_at: now,
        updated_at: now
      })
      .executeTakeFirstOrThrow();
      
    // Send welcome email
    const emailContent = generateWelcomeEmail(name, 'user');
    const emailSent = await sendEmail({
      from: 'noreply@greenmap.org',
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
    
    console.log('Welcome email sent to new user:', emailSent);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'User registered successfully',
        userId: newUser.insertId,
        emailSent 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}