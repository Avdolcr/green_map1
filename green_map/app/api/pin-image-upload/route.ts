import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import db from '@/app/lib/db'; // Fixed import path

// Add uuid type declaration if needed
declare module 'uuid' {
  export function v4(): string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const treeId = formData.get('treeId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!treeId) {
      return NextResponse.json({ error: 'No tree ID provided' }, { status: 400 });
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
    
    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // File URL that will be stored in the database
    const fileUrl = `/uploads/pin-images/${fileName}`;
    
    // Update the tree record in the database with the new image URL
    const connection = await db.getConnection();
    try {
      await connection.query(
        'UPDATE trees SET pin_location_img = ? WHERE id = ?',
        [fileUrl, treeId]
      );
      connection.release();
    } catch (error) {
      connection.release();
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update tree record' }, { status: 500 });
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