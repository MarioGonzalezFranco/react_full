const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "autopartes_db",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            "utf8mb4",
  timezone:           "+00:00",
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅  MySQL conectado ->", process.env.DB_NAME || "autopartes_db");
    conn.release();
  } catch (err) {
    console.error("❌  Error conectando a MySQL:", err.message);
    process.exit(1);
  }
})();

module.exports = pool;
