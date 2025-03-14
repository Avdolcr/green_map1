// app/api/trees/route.js
import { NextResponse } from "next/server";
import db from "@/app/lib/db";

/**
 * GET: Retrieve all trees from the database.
 */
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const connection = await db.getConnection();
    let query = "SELECT * FROM trees";
    let queryParams = [];

    if (status) {
      query += " WHERE tree_status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY id DESC";
    const [trees] = await connection.query(query, queryParams);
    connection.release();

    // Process the trees data - ensure each tree has its own unique image data
    const processedTrees = trees.map((tree) => {
      // Handle image URL to ensure it starts with / if needed
      let imageUrl = tree.image_url;
      if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `/uploads/${imageUrl}`;
      }
      
      // Handle pin_location_img to ensure it starts with / if needed
      let pinLocationImg = tree.pin_location_img;
      if (pinLocationImg && !pinLocationImg.startsWith('/') && !pinLocationImg.startsWith('http')) {
        pinLocationImg = `/uploads/${pinLocationImg}`;
      } else if (!pinLocationImg && imageUrl) {
        // If no pin_location_img is provided, don't default to image_url
        // This ensures each pin gets its own unique image or no image
        pinLocationImg = null;
      }
      
      // Handle pin_icon to ensure it starts with / if needed
      let pinIcon = tree.pin_icon;
      if (pinIcon && !pinIcon.startsWith('/') && !pinIcon.startsWith('http')) {
        pinIcon = `/uploads/${pinIcon}`;
      }

      // Make sure each tree's data is isolated and doesn't mix with other trees
      return {
        ...tree,
        id: tree.id, // Ensure ID is preserved
        image_url: imageUrl,
        pin_location_img: pinLocationImg,
        pin_icon: pinIcon,
        // Ensure latitude and longitude are properly parsed as numbers if they exist
        lat: tree.lat ? parseFloat(tree.lat) : null,
        lng: tree.lng ? parseFloat(tree.lng) : null
      };
    });

    return NextResponse.json(processedTrees);
  } catch (error) {
    console.error("Error fetching trees:", error);
    return NextResponse.json(
      { error: "Failed to fetch trees data" },
      { status: 500 }
    );
  }
}

/**
 * POST: Insert a new tree record into the database.
 */
export async function POST(request) {
  try {
    const {
      name,
      scientific_name,
      location,
      distribution,
      gen_info,
      image_url,
      pin_icon,
      pin_location_img,
      lat,
      lng,
    } = await request.json();

    // Validate required fields
    if (!name || !location) {
      return NextResponse.json(
        { error: "Name and location are required" },
        { status: 400 }
      );
    }

    const connection = await db.getConnection();
    await connection.query(
      "INSERT INTO trees (name, scientific_name, location, distribution, gen_info, image_url, pin_icon, pin_location_img, lat, lng, tree_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, scientific_name, location, distribution, gen_info, image_url, pin_icon, pin_location_img, lat, lng, "pending"]
    );
    connection.release();

    return NextResponse.json({ success: true, message: "Tree submitted for review" });
  } catch (error) {
    console.error("Error adding tree:", error);
    return NextResponse.json(
      { error: "Failed to submit tree" },
      { status: 500 }
    );
  }
}
