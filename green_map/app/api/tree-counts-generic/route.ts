import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  console.log('Generic tree counts API called');

  try {
    // Database connection with fallback to MYSQL_ prefixed variables
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'admin_trees',
    });

    console.log('Database connection successful');

    try {
      // Check if trees table exists
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'trees'"
      ) as any;

      if (tables.length === 0) {
        console.error('Trees table does not exist');
        await connection.end();
        return NextResponse.json(
          { 
            error: 'Trees table not found in database',
            debug: 'Table does not exist in the database'
          },
          { status: 404 }
        );
      }

      console.log('Trees table exists, checking columns');

      // Get all columns
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM trees"
      ) as any;

      const columnNames = columns.map((col: any) => col.Field);
      console.log('Available columns:', columnNames);

      // Get a suitable group-by column
      // Try to find a suitable column to group by (id, type, species, etc.)
      const possibleGroupColumns = [
        'scientific_name', 'species_name', 'latin_name', 'name', 'tree_name',
        'common_name', 'display_name', 'english_name', 'type', 'tree_type',
        'family', 'genus', 'species', 'variety', 'category'
      ];

      // Find the first matching column
      const groupByColumn = columnNames.find((name: string) => 
        possibleGroupColumns.includes(name.toLowerCase())
      );

      // If no suitable column found, just count all trees
      if (!groupByColumn) {
        const [totalCount] = await connection.execute(
          "SELECT COUNT(*) as count FROM trees"
        ) as any;
        
        console.log('No suitable grouping column found, returning total count');
        
        await connection.end();
        return NextResponse.json({
          success: true,
          totalTrees: totalCount[0].count,
          message: "Only total count available - no suitable column found for grouping",
          availableColumns: columnNames
        });
      }

      // Build a query based on available columns
      const query = `
        SELECT 
          \`${groupByColumn}\` as name,
          COUNT(*) as count 
        FROM trees 
        WHERE \`${groupByColumn}\` IS NOT NULL
        GROUP BY \`${groupByColumn}\`
        ORDER BY count DESC
        LIMIT 20
      `;

      console.log('Executing query:', query);

      const [treeCounts] = await connection.execute(query) as any;

      console.log(`Query successful, found ${treeCounts.length} tree groups`);

      // Format the results to match expected format
      const formattedResults = treeCounts.map((item: any) => {
        // Use the found name as the common name
        const localName = item.name || 'Unknown';
        
        return {
          // Use common name as the main display name (no longer "Unknown")
          scientific_name: localName,
          // Keep the local name as common_name for the italicized part
          common_name: localName,
          // Keep the count as is
          count: item.count
        };
      });

      await connection.end();

      return NextResponse.json({
        success: true,
        species: formattedResults,
        totalSpeciesShown: formattedResults.length,
        groupedBy: groupByColumn
      });
    } catch (queryError: any) {
      console.error('Error querying trees data:', queryError);
      await connection.end();
      return NextResponse.json(
        { 
          error: 'Failed to query trees data',
          message: queryError.message,
          sqlState: queryError.sqlState,
          sqlCode: queryError.code,
          stack: queryError.stack
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error connecting to database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to the database',
        message: error.message,
        code: error.code,
        stack: error.stack,
        debug: 'Check your database connection settings and environment variables'
      },
      { status: 500 }
    );
  }
} 