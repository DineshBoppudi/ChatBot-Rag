import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");

export const pool = new Pool({ connectionString });

export async function initDb() {
  // metadata table for datasets
  await pool.query(`
    CREATE TABLE IF NOT EXISTS datasets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      table_name TEXT NOT NULL UNIQUE,
      row_count INTEGER,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}
