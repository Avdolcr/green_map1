import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Query to fetch only pending (unapproved) images
    const [rows] = await connection.execute(
      'SELECT * FROM gallery_images WHERE approved = 0 ORDER BY created_at DESC'
    );

    await connection.end();

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching pending gallery images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending gallery images' },
      { status: 500 }
    );
  }
} 