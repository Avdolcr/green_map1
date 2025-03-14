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

export default pool; 