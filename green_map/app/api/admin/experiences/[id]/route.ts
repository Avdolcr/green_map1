import { NextResponse } from 'next/server';
import { query } from "@/backend/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    
    // Update experience status
    const [result] = await query(
      "UPDATE experiences SET status = ? WHERE id = ?",
      [status, params.id]
    );

    // If approved, copy to trees table
    if (status === 'approved') {
      const [experience] = await query(
        "SELECT * FROM experiences WHERE id = ?",
        [params.id]
      );
      
      if (experience && experience[0]) {
        const exp = experience[0];
        
        // Insert into trees table
        await query(
          `INSERT INTO trees (
            name, scientific_name, gen_info, distribution,
            location, image_url, lat, lng
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exp.name,
            exp.scientific_name,
            exp.gen_info,
            exp.distribution,
            exp.location,
            exp.image_url,
            exp.lat,
            exp.lng
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update experience" },
      { status: 500 }
    );
  }
} 