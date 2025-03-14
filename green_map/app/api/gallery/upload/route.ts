import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required to upload images' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    
    // Get file
    const file = formData.get('image') as File;
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }

    // Generate unique filename
    const uniqueSuffix = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uniqueSuffix}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to green_map uploads directory
    await writeFile(filePath, buffer);
    
    // Also save to tree-admin uploads directory
    try {
      // This assumes tree-admin is a sibling directory to green_map
      const treeAdminDir = join(process.cwd(), '..', 'tree-admin', 'public', 'uploads');
      
      // Create directory if it doesn't exist
      if (!existsSync(treeAdminDir)) {
        await mkdir(treeAdminDir, { recursive: true });
      }
      
      const treeAdminPath = join(treeAdminDir, fileName);
      await writeFile(treeAdminPath, buffer);
      console.log('Gallery image saved to both green_map and tree-admin directories');
    } catch (error) {
      console.error('Error saving gallery image to tree-admin directory:', error);
      // Continue even if tree-admin save fails
    }
    
    // Get form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const user_name = formData.get('user_name') as string;
    const user_email = formData.get('user_email') as string;
    let tree_id = formData.get('tree_id') as string;
    
    // Convert empty tree_id to null
    if (!tree_id || tree_id.trim() === '') {
      tree_id = 'NULL';
    }

    // Save to database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'admin_trees',
    });

    await connection.execute(
      `INSERT INTO gallery_images 
       (image_url, title, description, user_name, user_email, tree_id, approved, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [`/uploads/${fileName}`, title, description, user_name, user_email, tree_id === 'NULL' ? null : tree_id]
    );

    await connection.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Image uploaded successfully and awaiting approval' 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 