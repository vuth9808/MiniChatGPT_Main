const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

module.exports = { pool, query };
