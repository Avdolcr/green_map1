import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { headers } from 'next/headers';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_trees',
};

// Helper function to check if user is admin
function isAdmin(request: Request) {
  const headersList = headers();
  const role = headersList.get('x-user-role');
  return role === 'admin';
}

// GET a single tree by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Create DB connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Get tree by ID
    const [trees] = await connection.execute(
      'SELECT * FROM trees WHERE id = ?',
      [id]
    );
    
    // Close connection
    await connection.end();
    
    // Check if tree exists
    if (!Array.isArray(trees) || trees.length === 0) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ tree: trees[0] });
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tree' },
      { status: 500 }
    );
  }
}

// DELETE a tree by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can delete trees.' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    // Create DB connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if tree exists
    const [existingTrees] = await connection.execute(
      'SELECT id FROM trees WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingTrees) || existingTrees.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }
    
    // Delete tree
    await connection.execute(
      'DELETE FROM trees WHERE id = ?',
      [id]
    );
    
    // Close connection
    await connection.end();
    
    return NextResponse.json(
      { message: 'Tree deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tree:', error);
    return NextResponse.json(
      { error: 'Failed to delete tree' },
      { status: 500 }
    );
  }
}

// PUT/PATCH to update a tree by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    if (!isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can update trees.' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.scientific_name) {
      return NextResponse.json(
        { error: 'Name and scientific name are required' },
        { status: 400 }
      );
    }
    
    // Create DB connection
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if tree exists
    const [existingTrees] = await connection.execute(
      'SELECT id FROM trees WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingTrees) || existingTrees.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }
    
    // Update tree
    await connection.execute(
      `UPDATE trees SET 
        name = ?, 
        scientific_name = ?, 
        family_name = ?, 
        location = ?, 
        gen_info = ?, 
        distribution = ?, 
        image_url = ?, 
        tree_status = ? 
      WHERE id = ?`,
      [
        body.name,
        body.scientific_name,
        body.family_name || null,
        body.location || null,
        body.gen_info || null,
        body.distribution || null,
        body.image_url || null,
        body.tree_status || 'normal',
        id
      ]
    );
    
    // Close connection
    await connection.end();
    
    return NextResponse.json(
      { message: 'Tree updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating tree:', error);
    return NextResponse.json(
      { error: 'Failed to update tree' },
      { status: 500 }
    );
  }
} 