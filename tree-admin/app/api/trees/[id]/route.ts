import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { NextResponse } from 'next/server';

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

// GET: Fetch a single tree by ID.
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM trees WHERE id = ?', [params.id]);
    conn.release();

    if (rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Tree not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Database Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch tree' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT: Update a tree by ID.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Make sure the required fields are present
    const requiredFields = ['name', 'location'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return new NextResponse(JSON.stringify({ error: `Missing required field: ${field}` }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate and ensure the location data format is correct
    let locationData = data.location;
    if (locationData) {
      console.log('Raw location data:', typeof locationData, JSON.stringify(locationData).substring(0, 100) + '...');
      
      try {
        // If it's already a string, make sure it's valid JSON
        if (typeof locationData === 'string') {
          JSON.parse(locationData); // Just validate, don't reassign
          console.log('Validated location string successfully');
        } else if (Array.isArray(locationData) || typeof locationData === 'object') {
          // If it's an object/array, stringify it properly for storage
          data.location = safeJsonStringify(locationData);
          console.log('Stringified location object successfully');
        }
      } catch (e) {
        console.error('Location data parsing error:', e);
        return new NextResponse(JSON.stringify({ 
          error: 'Invalid location data format',
          details: String(e),
          received: typeof locationData
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check that all fields are valid
    const validFields = [
      'name', 'scientific_name', 'family_name', 'location', 
      'gen_info', 'distribution', 'image_url', 'pin_icon', 'pin_location_img',
      'map_center_lat', 'map_center_lng', 'map_default_zoom'
    ];

    // Filter out any invalid fields
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => validFields.includes(key))
    );
    
    // If both location and pin_icon/pin_location_img are provided,
    // make sure pin data is properly stored in location JSON
    if (filteredData.location) {
      try {
        // Only process if pin_icon or pin_location_img is provided
        if (filteredData.pin_icon || filteredData.pin_location_img) {
          let locationObj;
          try {
            locationObj = safeJsonParse(filteredData.location);
            if (!locationObj || !Array.isArray(locationObj)) {
              locationObj = [];
            }
          } catch (e) {
            // If we can't parse it, create an empty array
            locationObj = [];
          }
          
          // Check if we need to convert old format to new format
          if (Array.isArray(locationObj) && locationObj.length > 0 && locationObj.every(item => typeof item === 'string')) {
            // Convert old format (array of strings) to new format (array of objects)
            const newLocationObj = locationObj.map(coordStr => {
              if (typeof coordStr !== 'string') return null;
              const [lat, lng] = coordStr.split(',').map(Number);
              if (isNaN(lat) || isNaN(lng)) return null;
              return {
                coord: [lat, lng],
                icon: filteredData.pin_icon || undefined,
                image: filteredData.pin_location_img || undefined
              };
            }).filter(Boolean);
            
            filteredData.location = safeJsonStringify(newLocationObj);
          } else if (Array.isArray(locationObj) && locationObj.length > 0 && typeof locationObj[0] === 'object') {
            // Update existing pin objects with global icon/image if they don't have their own
            const updatedLocationObj = locationObj.map(pin => {
              // Handle case where pin might not have a coord property
              if (!pin.coord) return pin;
              
              return {
                ...pin,
                icon: pin.icon || filteredData.pin_icon || undefined,
                image: pin.image || filteredData.pin_location_img || undefined
              };
            });
            
            filteredData.location = safeJsonStringify(updatedLocationObj);
          }
        }
      } catch (e) {
        console.error('Error processing location data:', e);
        // Continue with the update even if this fails
      }
    }
    
    const conn = await pool.getConnection();
    const [result] = await conn.query<ResultSetHeader>(
      'UPDATE trees SET ? WHERE id = ?', 
      [filteredData, params.id]
    );
    
    // Get the updated tree to return
    const [rows] = await conn.query<RowDataPacket[]>('SELECT * FROM trees WHERE id = ?', [params.id]);
    conn.release();

    if (result.affectedRows === 0) {
      return new NextResponse(JSON.stringify({ error: 'Tree not found or no changes made' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process the tree data for the response
    const treeData = rows[0];
    
    // Convert location from JSON to object if it's a string
    if (treeData && treeData.location && typeof treeData.location === 'string') {
      try {
        treeData.location = JSON.parse(treeData.location);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    return NextResponse.json(treeData);
  } catch (error) {
    console.error('Update Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to update tree' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: Delete a tree by ID.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query<ResultSetHeader>('DELETE FROM trees WHERE id = ?', [params.id]);
    conn.release();

    if (result.affectedRows === 0) {
      return new NextResponse(JSON.stringify({ error: 'Tree not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json({ message: 'Tree deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete tree' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
