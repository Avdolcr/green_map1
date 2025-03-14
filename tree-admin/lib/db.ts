import mysql from 'mysql2/promise';

// Create a connection pool with fallback options for different env variable naming conventions
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'admin_trees',
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * Execute a SQL query with optional parameters
 * @param sql The SQL query to execute
 * @param params Optional parameters for the query
 * @returns Promise resolving to the query results
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Add an alias for the query function to maintain compatibility with existing code
export const executeQuery = query;

export default pool;