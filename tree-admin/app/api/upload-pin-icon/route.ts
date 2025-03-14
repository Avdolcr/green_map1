import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Generate a unique filename
    const fileExt = path.extname(file.name);
    const fileName = `custom-pin-${uuidv4()}${fileExt}`;
    
    // Ensure tree-icons directory exists
    const treeIconsDir = path.join(process.cwd(), 'public', 'tree-icons');
    if (!existsSync(treeIconsDir)) {
      await mkdir(treeIconsDir, { recursive: true });
    }
    
    const filePath = path.join(treeIconsDir, fileName);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write the file to disk in tree-admin
    await writeFile(filePath, buffer);
    
    // Also save to green_map tree-icons directory
    try {
      // This assumes green_map is a sibling directory to tree-admin
      const greenMapIconsDir = path.join(process.cwd(), '..', 'green_map', 'public', 'tree-icons');
      
      // Create directory if it doesn't exist
      if (!existsSync(greenMapIconsDir)) {
        await mkdir(greenMapIconsDir, { recursive: true });
      }
      
      const greenMapPath = path.join(greenMapIconsDir, fileName);
      await writeFile(greenMapPath, buffer);
      console.log('Pin icon saved to both tree-admin and green_map directories');
    } catch (error) {
      console.error('Error saving pin icon to green_map directory:', error);
      // Continue even if green_map save fails
    }
    
    // Return the URL to the file
    const fileUrl = `/tree-icons/${fileName}`;
    
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