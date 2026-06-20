import { Router } from "express";
import { pool } from "../db/database";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name NOT IN (
        'documents',
        'document_chunks',
        'chunk_embeddings'
      )
      ORDER BY table_name
    `);

    res.json(
      tables.rows.map((t) => ({
        name: t.table_name,
        table_name: t.table_name,
      }))
    );
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:id/preview", async (req, res) => {
  try {
    const table = req.params.id;

    const result = await pool.query(
      `SELECT * FROM "${table}" LIMIT 20`
    );

    res.json({
      rows: result.rows,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;