const { Pool } = require('pg');

const useSsl = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('rds.amazonaws.com');
const dbName = process.env.DB_DATABASE || 'taskdb';
const adminDbName = process.env.DB_ADMIN_DATABASE || 'postgres';

function createPool(databaseName) {
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });
}

let pool = null;

function getPool() {
  if (!pool) {
    pool = createPool(dbName);
  }
  return pool;
}

async function ensureDatabaseExists() {
  const adminPool = createPool(adminDbName);

  try {
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database ${dbName}`);
    }
  } catch (error) {
    if (error && /already exists/i.test(error.message)) {
      return;
    }
    throw error;
  } finally {
    await adminPool.end();
  }
}

async function init() {
  await ensureDatabaseExists();

  const connectionPool = getPool();

  await connectionPool.query(`CREATE TABLE IF NOT EXISTS tasks(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
  );`);
  // In case the table already exists, make sure `completed_at` column exists
  await connectionPool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`);

  // Books table to hold the list of books
  await connectionPool.query(`CREATE TABLE IF NOT EXISTS books(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'To Read'
  );`);

  // Seed the books table if it's empty
  await connectionPool.query(`
    INSERT INTO books (title, status)
    SELECT * FROM (VALUES
      ('The Hobbit','To Read'),
      ('Atomic Habits','To Read'),
      ('Clean Code','To Read'),
      ('The Pragmatic Programmer','To Read'),
      ('1984','To Read'),
      ('Sapiens','To Read'),
      ('Deep Work','To Read'),
      ('The Alchemist','To Read'),
      ('The Little Prince','To Read'),
      ('Thinking, Fast and Slow','To Read')
    ) AS v(title,status)
    WHERE NOT EXISTS (SELECT 1 FROM books);
  `);
}

module.exports = { getPool, init };
