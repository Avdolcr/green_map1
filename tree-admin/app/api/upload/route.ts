// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-static'; // Disable caching

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `upload-${timestamp}.${ext}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save to tree-admin public/uploads directory
    const path = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(path, buffer);

    // Also save to green_map public/uploads directory
    try {
      // This assumes green_map is a sibling directory to tree-admin
      const greenMapDir = join(process.cwd(), '..', 'green_map', 'public', 'uploads');
      
      // Create directory if it doesn't exist
      if (!existsSync(greenMapDir)) {
        await mkdir(greenMapDir, { recursive: true });
      }
      
      const greenMapPath = join(greenMapDir, filename);
      await writeFile(greenMapPath, buffer);
      console.log('File saved to both tree-admin and green_map directories');
    } catch (error) {
      console.error('Error saving to green_map directory:', error);
      // Continue even if green_map save fails
    }

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error uploading file' 
    }, { status: 500 });
  }
}