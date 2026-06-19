import { Router } from "express";
import { pool } from "../db/database";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error fetching datasets",
    });
  }
});

export default router;