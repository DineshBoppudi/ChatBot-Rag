import { Router } from "express";
import { pool } from "../db/database";

const router = Router();

router.get("/status", async (req, res) => {
  const result = await pool.query(`
    SELECT COUNT(*) as total
    FROM chunk_embeddings
  `);

  res.json({
    embeddings: result.rows[0].total,
  });
});

export default router;