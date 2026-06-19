import { pool } from "../db/database";

export async function insertRows(
  tableName: string,
  rows: any[]
) {
  for (const row of rows) {

    const columns = Object.keys(row)
      .map((col) =>
        `"${col.toLowerCase().replace(/\s+/g, "_")}"`
      )
      .join(",");

    const values = Object.values(row);

    const placeholders = values
      .map((_, index) => `$${index + 1}`)
      .join(",");

    const query = `
      INSERT INTO "${tableName}"
      (${columns})
      VALUES (${placeholders})
    `;

    await pool.query(query, values);
  }
}