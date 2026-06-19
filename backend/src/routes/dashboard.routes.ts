import { Router } from "express";
import { pool } from "../db/database";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name NOT IN ('pg_stat_statements')
    `);

    const datasetCount = tablesResult.rows.length;

    let totalRows = 0;

    for (const table of tablesResult.rows) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) FROM "${table.table_name}"`
        );

        totalRows += Number(result.rows[0].count);
      } catch {
        // skip system tables
      }
    }

    res.json({
      datasetCount,
      totalRows,
      totalQueries: 0,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
});

export default router;