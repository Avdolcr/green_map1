import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// GET: Retrieve application settings
export async function GET(request: Request) {
  try {
    // Get the URL query parameters
    const { searchParams } = new URL(request.url);
    
    // Check if specific keys are requested
    const keys = searchParams.get('keys');
    let whereClause = '';
    let queryParams: string[] = [];
    
    if (keys) {
      const keyArray = keys.split(',').map(key => key.trim());
      if (keyArray.length > 0) {
        whereClause = 'WHERE setting_key IN (?)';
        queryParams = [keyArray.join(',')];
      }
    }
    
    const conn = await pool.getConnection();
    
    // Query the settings table
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM app_settings ${whereClause}`,
      queryParams.length > 0 ? queryParams : []
    );
    
    conn.release();
    
    // Transform the array of rows into an object with key-value pairs
    const settings = rows.reduce((acc: Record<string, string>, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    
    // If no specific key was requested but no settings were found,
    // return default values
    if (!keys && Object.keys(settings).length === 0) {
      return NextResponse.json({
        default_map_center: JSON.stringify({ lat: 16.5324, lng: 120.3929 }),
        default_map_zoom: '13'
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings API Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Update application settings
export async function POST(request: Request) {
  try {
    // Get the current user session - Uncomment and use your auth system
    // const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    // if (!session || session.user.role !== 'admin') {
    //   return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    //     status: 401,
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // }
    
    // Parse the request body
    const data = await request.json();
    
    // Validate that data is a proper key-value object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid settings data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const conn = await pool.getConnection();
    
    // Process each setting
    const results = [];
    
    for (const [key, value] of Object.entries(data)) {
      // Skip invalid entries
      if (!key || typeof key !== 'string') continue;
      
      // Convert value to string if it's not
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Try to update existing setting first
      const [updateResult] = await conn.query(
        'UPDATE app_settings SET setting_value = ? WHERE setting_key = ?',
        [stringValue, key]
      );
      
      // If no rows were affected, insert new setting
      if ((updateResult as any).affectedRows === 0) {
        await conn.query(
          'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
          [key, stringValue]
        );
        results.push({ key, action: 'created' });
      } else {
        results.push({ key, action: 'updated' });
      }
    }
    
    conn.release();
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      results
    });
  } catch (error) {
    console.error('Settings Update Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 