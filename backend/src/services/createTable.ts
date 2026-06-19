import { pool } from "../db/database";

export async function createTable(
  tableName: string,
  columns: string[]
) {
  const columnDefinitions = columns
    .map(
      (col) =>
        `"${col.toLowerCase().replace(/\s+/g, "_")}" TEXT`
    )
    .join(",");

  const query = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      id SERIAL PRIMARY KEY,
      ${columnDefinitions}
    );
  `;

  await pool.query(query);
}