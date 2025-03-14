import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

interface SpeciesCount {
  scientific_name: string;
  common_name: string;
  family_name?: string;
  count: number;
}

export async function GET() {
  // Debug information
  console.log('Tree species counts API called');
  console.log('Environment variables:', {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'admin_trees',
  });

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

      // Check if necessary columns exist
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM trees"
      ) as any;

      const columnNames = columns.map((col: any) => col.Field);
      console.log('Available columns:', columnNames);

      // Check for different possible name columns
      const nameColumn = columnNames.find((name: string) => 
        ['scientific_name', 'species_name', 'latin_name', 'name', 'tree_name'].includes(name.toLowerCase())
      );

      const commonNameColumn = columnNames.find((name: string) => 
        ['common_name', 'display_name', 'english_name', 'local_name', 'tree_type'].includes(name.toLowerCase())
      );

      // Add family name column check
      const familyNameColumn = columnNames.find((name: string) => 
        ['family_name', 'family', 'tree_family', 'botanical_family'].includes(name.toLowerCase())
      );

      console.log('Using columns:', { nameColumn, commonNameColumn, familyNameColumn });

      if (!nameColumn) {
        console.error('No suitable name column found in trees table');
        await connection.end();
        return NextResponse.json(
          { 
            error: 'Required columns missing from trees table',
            debug: `Available columns: ${columnNames.join(', ')}. Need a column for tree name/species.`
          },
          { status: 500 }
        );
      }

      // Build a query that works with the available columns
      let query = `
        SELECT 
          COUNT(*) as count 
      `;

      // Add the name column
      query += nameColumn ? `    ,IFNULL(\`${nameColumn}\`, 'Unknown') as scientific_name\n` : 
        '    ,"Unknown" as scientific_name\n';

      // Add the common name column if available 
      query += commonNameColumn ? `    ,IFNULL(\`${commonNameColumn}\`, 'Unknown') as common_name\n` : 
        '    ,"Unknown" as common_name\n';

      // Add the family name column if available
      if (familyNameColumn) {
        query += `    ,IFNULL(\`${familyNameColumn}\`, 'Unknown') as family_name\n`;
      }

      // Complete the query with appropriate GROUP BY
      let groupByColumns = `scientific_name${commonNameColumn ? ', common_name' : ''}`;
      if (familyNameColumn) {
        groupByColumns += `, family_name`;
      }

      query += `  FROM trees 
        GROUP BY ${groupByColumns}
        ORDER BY count DESC
        LIMIT 30
      `;

      console.log('Executing query:', query);

      // Execute the dynamic query
      const [speciesCounts] = await connection.execute(query) as any;

      console.log(`Query successful, found ${speciesCounts.length} species`);

      // If family name wasn't in the database, add it based on scientific name patterns
      if (!familyNameColumn) {
        console.log('Adding family names based on scientific name patterns');
        
        const familyMappings: Record<string, string> = {
          'Quercus': 'Fagaceae',
          'Acer': 'Aceraceae',
          'Pinus': 'Pinaceae',
          'Betula': 'Betulaceae',
          'Fraxinus': 'Oleaceae',
          'Ulmus': 'Ulmaceae',
          'Tilia': 'Tiliaceae',
          'Fagus': 'Fagaceae',
          'Populus': 'Salicaceae',
          'Salix': 'Salicaceae',
          'Abies': 'Pinaceae',
          'Picea': 'Pinaceae',
          'Aesculus': 'Hippocastanaceae',
          'Platanus': 'Platanaceae',
          'Carpinus': 'Betulaceae',
          'Corylus': 'Betulaceae',
          'Juglans': 'Juglandaceae',
          'Robinia': 'Fabaceae',
          'Sorbus': 'Rosaceae',
          'Prunus': 'Rosaceae',
          'Malus': 'Rosaceae',
          'Eucalyptus': 'Myrtaceae',
          'Alnus': 'Betulaceae',
          'Castanea': 'Fagaceae',
        };

        // Add family_name property to each species
        speciesCounts.forEach((species: SpeciesCount) => {
          const genusName = species.scientific_name.split(' ')[0];
          species.family_name = familyMappings[genusName] || 'Unknown';
        });
      }

      await connection.end();

      return NextResponse.json({
        success: true,
        species: speciesCounts,
        totalSpeciesShown: speciesCounts.length
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