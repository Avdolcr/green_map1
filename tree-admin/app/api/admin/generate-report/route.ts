import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get current timestamp for the report
    const timestamp = new Date().toISOString();
    
    // Get a connection from the pool
    const connection = await pool.getConnection();
    
    try {
      // Fetch tree data from the database
      const [trees] = await connection.query('SELECT * FROM trees');
      
      // Count pins/tree locations
      let totalPins = 0;
      trees.forEach((tree: any) => {
        try {
          // Parse location if it's a string
          const location = typeof tree.location === 'string' 
            ? JSON.parse(tree.location) 
            : tree.location;
          
          // Calculate pins based on location format
          if (Array.isArray(location)) {
            totalPins += location.length;
          }
        } catch (error) {
          console.error(`Error parsing location for tree ${tree.id}:`, error);
        }
      });
      
      // Get families distribution
      const [familyDistribution] = await connection.query(`
        SELECT family_name, COUNT(*) as count 
        FROM trees 
        GROUP BY family_name
      `);
      
      // Calculate some statistics
      const stats = {
        totalTrees: trees.length,
        totalPins,
        familyCounts: (familyDistribution as any[]).map((item: any) => ({
          family: item.family_name || 'Unknown',
          count: item.count
        })),
        mostRecentlyAdded: [...trees]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((tree: any) => ({
            id: tree.id,
            name: tree.name,
            created_at: tree.created_at
          }))
      };
      
      // Create the report object
      const report = {
        title: 'Tree Inventory Report',
        generated_at: timestamp,
        summary: stats,
        reportData: {
          trees,
          stats
        }
      };
      
      // In a real app, you might:
      // 1. Format this as a proper PDF or Excel spreadsheet
      // 2. Save the report to storage
      // 3. Add a record in the database of generated reports
      
      // Log the operation
      console.log(`Report generated at ${timestamp}`);
      
      return NextResponse.json({
        success: true,
        message: 'Report generated successfully',
        timestamp,
        reportData: report
      });
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 