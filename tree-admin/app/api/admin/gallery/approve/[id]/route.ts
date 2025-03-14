import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Update image to approved status
    const [result] = await connection.execute(
      'UPDATE gallery_images SET approved = 1 WHERE id = ?',
      [id]
    );

    await connection.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Image approved successfully' 
    });
  } catch (error) {
    console.error('Error approving gallery image:', error);
    return NextResponse.json(
      { error: 'Failed to approve gallery image' },
      { status: 500 }
    );
  }
} 