import { NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate file name with timestamp
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const filename = `upload-${timestamp}.${fileExt}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to both green_map and tree-admin public folders
    const greenMapPath = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(greenMapPath, buffer);
    
    // Attempt to write to tree-admin as well (this assumes tree-admin is a sibling directory)
    try {
      const treeAdminDir = join(process.cwd(), '..', 'tree-admin', 'public', 'uploads');
      
      if (!existsSync(treeAdminDir)) {
        await mkdir(treeAdminDir, { recursive: true });
      }
      
      const treeAdminPath = join(treeAdminDir, filename);
      await writeFile(treeAdminPath, buffer);
    } catch (adminError) {
      console.error('Error saving to tree-admin:', adminError);
      // Continue even if tree-admin save fails
    }

    // Return the URL that can be used to access the file
    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error uploading file' 
    }, { status: 500 });
  }
} 