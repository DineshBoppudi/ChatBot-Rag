import { Router } from "express";
import { pool } from "../db/database";

const router = Router();

// Return dataset metadata with small preview (if available)
router.get("/", async (req, res) => {
  try {
    let out: any[] = [];

    try {
      // Preferred: use datasets metadata table if available
      const meta = await pool.query(`SELECT name, table_name, row_count, created_at FROM datasets ORDER BY created_at DESC`);
      for (const d of meta.rows) {
        let sample: any[] = [];
        try {
          const sampleQ = await pool.query(`SELECT * FROM "${d.table_name}" LIMIT 5`);
          sample = sampleQ.rows;
        } catch (e) {
          sample = [];
        }
        out.push({
          name: d.name,
          table_name: d.table_name,
          row_count: d.row_count,
          uploaded_at: d.created_at,
          sample,
        });
      }
    } catch (metaErr) {
      // Fallback: if datasets metadata table isn't present or has different schema,
      // list public tables from information_schema and return basic info so frontend still works.
      console.warn('datasets metadata not available, falling back to information_schema:', metaErr.message);
      const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
      for (const t of tables.rows) {
        out.push({ name: t.table_name, table_name: t.table_name, row_count: null, uploaded_at: null, sample: [] });
      }
    }

    res.json(out);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching datasets", error: error.message });
  }
});

// Preview route for a specific dataset (by table_name or name)
router.get("/:id/preview", async (req, res) => {
  try {
    const id = req.params.id;

    // try to resolve a table_name from metadata first
    const meta = await pool.query(`SELECT table_name FROM datasets WHERE table_name = $1 OR name = $1 LIMIT 1`, [id]);
    const table = meta.rowCount > 0 ? meta.rows[0].table_name : id;

    // fetch up to 200 rows for preview
    const rowsQ = await pool.query(`SELECT * FROM "${table}" LIMIT 200`);
    res.json({ rows: rowsQ.rows });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching preview", error: error.message });
  }
});

export default router;