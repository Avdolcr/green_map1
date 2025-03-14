import { NextResponse } from 'next/server';
import { query } from "@/backend/db";
import { saveUploadedFile } from '@/utils/fileUpload';

export async function GET(request: Request) {
  try {
    // Only get approved experiences
    const [rows] = await query(
      "SELECT * FROM experiences WHERE status = 'approved'",
      []
    );
    return NextResponse.json({ experiences: rows });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Process the form data
    const experience = {
      name: formData.get('name') as string,
      scientific_name: formData.get('scientific_name') as string,
      gen_info: formData.get('gen_info') as string,
      distribution: formData.get('distribution') as string,
      location: formData.get('location') as string,
      lat: parseFloat(formData.get('lat') as string),
      lng: parseFloat(formData.get('lng') as string),
    };

    // Handle image upload
    const imageFile = formData.get('image') as File;
    let imageUrl = null;
    
    if (imageFile) {
      const fileName = await saveUploadedFile(imageFile);
      imageUrl = `/uploads/${fileName}`;
    }

    // Insert into database
    const [result] = await query(
      `INSERT INTO experiences (
        name, scientific_name, gen_info, distribution, 
        location, image_url, lat, lng, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        experience.name,
        experience.scientific_name,
        experience.gen_info,
        experience.distribution,
        experience.location,
        imageUrl,
        experience.lat,
        experience.lng,
        'pending'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error processing experience:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process experience' },
      { status: 500 }
    );
  }
} 