import { pool } from "../db/database";

export async function insertRows(
  tableName: string,
  rows: any[]
) {
  let rowNumber = 0;

  try {
    console.log("INSERT ROWS STARTED");

    for (const row of rows) {
      rowNumber++;

      console.log(
        `Inserting row ${rowNumber}/${rows.length}`
      );

      const columns = Object.keys(row)
        .map(
          (col) =>
            `"${col
              .toLowerCase()
              .replace(/\s+/g, "_")}"`
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

    console.log("INSERT ROWS COMPLETED");
  } catch (error: any) {
    console.error("INSERT ROWS FAILED");
    console.error(
      "Failed at row:",
      rowNumber
    );
    console.error(error);

    if (error?.message) {
      console.error(
        "MESSAGE:",
        error.message
      );
    }

    throw error;
  }
}