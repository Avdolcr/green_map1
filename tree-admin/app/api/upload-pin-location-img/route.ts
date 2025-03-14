import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const treeId = formData.get('treeId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pin-images');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileName = `pin-img-${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write the file to disk in tree-admin
    await writeFile(filePath, buffer);
    
    // Also save to green_map uploads directory
    try {
      // This assumes green_map is a sibling directory to tree-admin
      const greenMapDir = path.join(process.cwd(), '..', 'green_map', 'public', 'uploads', 'pin-images');
      
      // Create directory if it doesn't exist
      if (!existsSync(greenMapDir)) {
        await fs.mkdir(greenMapDir, { recursive: true });
      }
      
      const greenMapPath = path.join(greenMapDir, fileName);
      await writeFile(greenMapPath, buffer);
      console.log('Pin location image saved to both tree-admin and green_map directories');
    } catch (error) {
      console.error('Error saving pin location image to green_map directory:', error);
      // Continue even if green_map save fails
    }
    
    // File URL that will be used in the database
    const fileUrl = `/uploads/pin-images/${fileName}`;
    
    // If a treeId was provided, update the tree record
    if (treeId) {
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'UPDATE trees SET pin_location_img = ? WHERE id = ?',
          [fileUrl, treeId]
        );
      } finally {
        conn.release();
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl 
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Error uploading file' 
    }, { status: 500 });
  }
} 