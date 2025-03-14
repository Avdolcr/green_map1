import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_trees',
};

export async function GET(request: Request) {
  try {
    // Create DB connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    
    // Build query based on parameters
    let query = 'SELECT * FROM trees';
    const queryParams: any[] = [];
    
    if (status) {
      query += ' WHERE tree_status = ?';
      queryParams.push(status);
    }
    
    // Only apply pagination if explicitly requested
    if (limitParam && pageParam) {
      const limit = Number(limitParam);
      const page = Number(pageParam);
      const offset = (page - 1) * limit;
      
      query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    } else {
      // If no pagination requested, just order by id
      query += ' ORDER BY id DESC';
    }
    
    // Execute query
    const [rawTrees] = await connection.execute(query, queryParams) as [any[], any];
    
    // Process trees to ensure each has proper data
    const trees = rawTrees.map(tree => {
      // Make sure all values are properly processed
      return {
        ...tree,
        // Ensure ID is retained exactly as is
        id: tree.id,
        
        // Format image URLs correctly
        image_url: formatImageUrl(tree.image_url),
        pin_location_img: formatImageUrl(tree.pin_location_img),
        pin_icon: formatImageUrl(tree.pin_icon),
        
        // Parse numeric values
        lat: tree.lat ? parseFloat(tree.lat) : null,
        lng: tree.lng ? parseFloat(tree.lng) : null,
      };
    });
    
    // Get total count for pagination info
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM trees${status ? ' WHERE tree_status = ?' : ''}`,
      status ? [status] : []
    ) as any;
    
    const total = countResult[0].total;
    
    // Close connection
    await connection.end();
    
    return NextResponse.json({
      trees,
      pagination: {
        total,
        page: pageParam ? Number(pageParam) : 1,
        limit: limitParam ? Number(limitParam) : total,
        totalPages: limitParam ? Math.ceil(total / Number(limitParam)) : 1,
      },
    });
  } catch (error) {
    console.error('Error fetching trees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trees' },
      { status: 500 }
    );
  }
}

// Helper function to format image URLs
function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If URL already starts with http or /, it's already properly formatted
  if (url.startsWith('http') || url.startsWith('/')) {
    return url;
  }
  
  // Otherwise, prefix with /uploads/
  return `/uploads/${url}`;
} 