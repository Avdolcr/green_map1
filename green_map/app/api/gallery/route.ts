import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_trees',
};

export async function GET() {
  try {
    // Create DB connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if gallery_images table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'gallery_images'",
    );
    
    // If table exists, fetch images
    if (Array.isArray(tables) && tables.length > 0) {
      const [rows] = await connection.execute(
        `SELECT 
          gi.*, 
          COALESCE(gi.like_count, 0) as like_count,
          COALESCE(gi.view_count, 0) as view_count
        FROM gallery_images gi
        WHERE gi.approved = 1 
        ORDER BY gi.created_at DESC`
      );
      
      // Close connection
      await connection.end();
      
      // Return images in the expected format
      return NextResponse.json({ images: rows });
    } else {
      // Close connection
      await connection.end();
      
      // Return empty array with appropriate message
      return NextResponse.json({
        message: 'Gallery table does not exist',
        images: []
      });
    }
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch gallery images',
        images: []
      },
      { status: 500 }
    );
  }
} 