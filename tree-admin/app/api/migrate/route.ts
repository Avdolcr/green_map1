import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { NextResponse } from 'next/server';

// Define types for tree pins
type Coordinate = [number, number];
interface Pin {
  coord: Coordinate;
  icon?: string;
  image?: string;
}

// Helper function to safely check and process JSON
function safeJsonParse(value: any) {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'object') {
    return value; // Already a JSON object
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

// Helper function to safely stringify JSON
function safeJsonStringify(value: any) {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    try {
      // Check if it's already a JSON string
      JSON.parse(value);
      return value;
    } catch (e) {
      // Not a valid JSON string, try to stringify
      return JSON.stringify(value);
    }
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return null;
}

// POST: Migrate trees data
export async function POST(request: Request) {
  try {
    // Optional: Add authentication check via an auth key
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('key');
    
    if (authKey !== process.env.MIGRATION_KEY && process.env.MIGRATION_KEY) {
      return new NextResponse(JSON.stringify({ error: 'Not authorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const conn = await pool.getConnection();
    
    // Get all trees
    const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM trees');
    
    // Track migration stats
    const stats = {
      total: rows.length,
      migrated: 0,
      skipped: 0,
      errors: 0,
      badJson: 0,
      fixed: 0
    };
    
    // Process each tree
    const migrationResults = [];
    
    for (const tree of rows) {
      try {
        let locationData: any[] = [];
        let needsMigration = false;
        let isInvalidJson = false;
        
        // Check if this tree already has the new format
        try {
          // MySQL might return location as an object if the column is JSON type
          if (typeof tree.location === 'object' && tree.location !== null) {
            locationData = Array.isArray(tree.location) ? tree.location : [];
          } else if (typeof tree.location === 'string') {
            locationData = JSON.parse(tree.location);
          }
          
          // Determine if we need to migrate this tree
          needsMigration = Array.isArray(locationData) && 
                          locationData.length > 0 && 
                          locationData.some(item => typeof item === 'string');
        } catch (e) {
          stats.badJson++;
          isInvalidJson = true;
          needsMigration = true;
          
          // Try to extract coordinates from old format if we can't parse JSON
          try {
            if (typeof tree.location === 'string') {
              // Try to manually parse coordinates if they might be in form ["lat,lng", "lat,lng"]
              const matches = tree.location.match(/"([^"]+)"/g);
              if (matches) {
                locationData = matches.map(m => m.replace(/"/g, ''));
                isInvalidJson = false;
                stats.fixed++;
              }
            }
          } catch (err) {
            // If that fails, we'll create a new empty array
            locationData = [];
          }
        }
        
        if (needsMigration) {
          // Convert old format to new format
          const newPins: { coord: number[]; icon?: string; image?: string }[] = [];
          
          // Process the location data
          if (Array.isArray(locationData)) {
            for (const item of locationData) {
              if (typeof item === 'string') {
                const [lat, lng] = item.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                  newPins.push({
                    coord: [lat, lng],
                    icon: tree.pin_icon || undefined,
                    image: tree.pin_location_img || undefined
                  });
                }
              } else if (typeof item === 'object' && item !== null) {
                // It's already in the new format, but might be missing icon/image
                const pin = {
                  coord: item.coord || [],
                  icon: item.icon || tree.pin_icon || undefined,
                  image: item.image || tree.pin_location_img || undefined
                };
                newPins.push(pin);
              }
            }
          }
          
          // If we have any pins to update
          if (newPins.length > 0) {
            const [updateResult] = await conn.query<ResultSetHeader>(
              'UPDATE trees SET location = ? WHERE id = ?',
              [safeJsonStringify(newPins), tree.id]
            );
            
            if (updateResult.affectedRows > 0) {
              stats.migrated++;
              migrationResults.push({
                id: tree.id,
                status: 'migrated',
                pins: newPins.length
              });
            } else {
              stats.errors++;
              migrationResults.push({
                id: tree.id,
                status: 'error',
                message: 'Update failed'
              });
            }
          } else {
            stats.skipped++;
            migrationResults.push({
              id: tree.id,
              status: 'skipped',
              message: 'No valid coordinates found'
            });
          }
        } else {
          stats.skipped++;
          migrationResults.push({
            id: tree.id,
            status: 'skipped',
            message: 'Already in new format'
          });
        }
      } catch (error) {
        console.error(`Error migrating tree ${tree.id}:`, error);
        stats.errors++;
        migrationResults.push({
          id: tree.id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    conn.release();
    
    return NextResponse.json({
      success: true,
      stats,
      results: migrationResults
    });
  } catch (error) {
    console.error('Migration error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Migration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 