import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_trees',
};

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation (at least 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create DB connection
    const connection = await mysql.createConnection(dbConfig);

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Get default profile picture (you can change this URL to a default avatar image)
    const defaultProfilePicture = 'https://www.gravatar.com/avatar/' + 
      require('crypto').createHash('md5').update(email.toLowerCase()).digest('hex') + 
      '?d=identicon';

    // Insert new user with profile fields
    const [result] = await connection.execute(
      `INSERT INTO users (
        name, 
        email, 
        password, 
        role, 
        profile_picture, 
        joined_date, 
        contributions_count
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [name, email, hashedPassword, 'user', defaultProfilePicture, 0]
    );
    
    const userId = (result as any).insertId;

    // Close connection
    await connection.end();

    // Send welcome email
    await transporter.sendMail({
      from: emailConfig.auth.user,
      to: email,
      subject: 'Welcome to Green Map!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2F5D50; margin-bottom: 10px;">Green Map</h1>
            <p style="font-size: 18px; color: #333;">Welcome to our community!</p>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p>Hello ${name},</p>
            <p>Thank you for joining Green Map! We're excited to have you as part of our community dedicated to mapping and exploring trees around the world.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="background-color: #2F5D50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Profile</a>
            </div>
            
            <p>Here are some things you can do with your new account:</p>
            <ul style="margin-bottom: 20px;">
              <li>Explore the interactive map to discover trees in your area</li>
              <li>Contribute to the community by adding tree locations</li>
              <li>Share photos and experiences with the community</li>
              <li>Learn about different tree species and their characteristics</li>
            </ul>
            
            <p>If you have any questions or need assistance, feel free to contact us!</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Green Map - All rights reserved</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 