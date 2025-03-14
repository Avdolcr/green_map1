// backend/db.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "admin_trees",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Optional: Increase the connection timeout (in milliseconds)
  connectTimeout: 10000, // 10 seconds
});

/**
 * Executes a query using the connection pool.
 * @param {string} sql - The SQL query string.
 * @param {Array} params - The parameters for the SQL query.
 * @returns {Promise<[any, any]>} - The query results and field metadata.
 */
async function query(sql, params) {
  try {
    const [results, fields] = await pool.execute(sql, params);
    return [results, fields];
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
}

module.exports = { query, pool };
