import mysql from 'mysql2/promise';

// Define database schema types for TypeScript (even though we won't use Kysely)
export interface UserTable {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  profile_picture: string | null;
  bio: string | null;
  location: string | null;
  joined_date: Date;
  preferences: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TreeTable {
  id: number;
  user_id: number;
  name: string;
  scientific_name: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  height: number | null;
  diameter: number | null;
  age: number | null;
  health_status: string | null;
  images: string | null;
  created_at: Date;
  updated_at: Date;
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_trees',
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error: any) {
    // Enhanced error logging for easier debugging
    console.error('Database query error:', error);
    console.error('Query:', sql);
    console.error('Parameters:', params);
    
    // Add DB connection diagnostics
    if (error.code === 'ECONNREFUSED') {
      console.error('Database connection refused. Please check if MySQL server is running.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Database access denied. Please check username and password.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist. Please check database name.');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Table does not exist. Please check if all tables are created.');
    }
    
    throw error;
  }
}

// Alias for query function to maintain compatibility with both naming conventions
export const executeQuery = query;

// DB helper functions to match Kysely-like interface
export const db = {
  selectFrom: (table: string) => ({
    select: (columns: string[]) => ({
      where: (column: string, operator: string, value: any) => ({
        executeTakeFirst: async () => {
          const columnsStr = columns.join(', ');
          const sql = `SELECT ${columnsStr} FROM ${table} WHERE ${column} ${operator} ?`;
          const results = await query(sql, [value]) as any[];
          return results.length > 0 ? results[0] : null;
        },
        execute: async () => {
          const columnsStr = columns.join(', ');
          const sql = `SELECT ${columnsStr} FROM ${table} WHERE ${column} ${operator} ?`;
          return await query(sql, [value]);
        }
      })
    })
  }),
  
  insertInto: (table: string) => ({
    values: (data: Record<string, any>) => ({
      executeTakeFirstOrThrow: async () => {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        const result = await query(sql, values) as any;
        
        return { insertId: result.insertId };
      }
    })
  }),
  
  updateTable: (table: string) => ({
    set: (data: Record<string, any>) => ({
      where: (column: string, operator: string, value: any) => ({
        execute: async () => {
          const setClause = Object.entries(data)
            .map(([key, _]) => `${key} = ?`)
            .join(', ');
          
          const values = [...Object.values(data), value];
          
          const sql = `UPDATE ${table} SET ${setClause} WHERE ${column} ${operator} ?`;
          return await query(sql, values);
        }
      })
    })
  })
}; 