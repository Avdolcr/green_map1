import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * API endpoint to test database connection
 * This is helpful for diagnosing SQL connection issues
 */
export async function GET(request: NextRequest) {
  try {
    // Attempt a simple query to test the connection
    const result = await query('SELECT 1 as connection_test');
    
    // Log successful connection for debugging
    console.log('Database connection test successful:', result);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      details: {
        database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'unknown',
        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'unknown'
      }
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Database connection test failed:', error);
    
    // Format error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown database error';
      
    // Include helpful debugging information in the response
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: {
        database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'unknown',
        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'unknown'
      },
      tips: [
        "Check your database credentials in .env.local",
        "Verify the MySQL server is running",
        "Make sure the database exists",
        "Check network connectivity to the database server"
      ]
    }, { status: 500 });
  }
} 