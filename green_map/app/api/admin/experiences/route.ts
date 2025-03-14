import { NextResponse } from 'next/server';
import { query } from "@/backend/db";

export async function GET(request: Request) {
  try {
    const [rows] = await query(
      "SELECT * FROM experiences WHERE status = 'pending' ORDER BY id DESC",
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