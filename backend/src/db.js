const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});
async function init(){
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
  );`);
  // In case the table already exists, make sure `completed_at` column exists
  await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`);

  // Books table to hold the list of books
  await pool.query(`CREATE TABLE IF NOT EXISTS books(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'To Read'
  );`);

  // Seed the books table if it's empty
  await pool.query(`
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
module.exports={pool,init};
