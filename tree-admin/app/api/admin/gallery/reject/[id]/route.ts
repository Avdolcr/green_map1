import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Get the image URL before deleting
    const [rows] = await connection.execute(
      'SELECT image_url FROM gallery_images WHERE id = ?',
      [id]
    ) as any;

    if (rows.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const imageUrl = rows[0].image_url;

    // Delete the image from the database
    await connection.execute(
      'DELETE FROM gallery_images WHERE id = ?',
      [id]
    );

    await connection.end();

    // Delete the file from the filesystem
    if (imageUrl) {
      try {
        // Remove the leading slash from the URL
        const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        const filePath = join(process.cwd(), 'public', relativePath);
        await unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
        // Continue even if file deletion fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Image rejected and deleted successfully' 
    });
  } catch (error) {
    console.error('Error rejecting gallery image:', error);
    return NextResponse.json(
      { error: 'Failed to reject gallery image' },
      { status: 500 }
    );
  }
} 