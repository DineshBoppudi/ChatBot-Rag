import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { parseCsvAndCreateTable } from "../services/csvService";
import { pool } from "../db";
import { log } from "../utils/logger";

export async function handleUpload(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const filePath = req.file.path;
    const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const result: any = await parseCsvAndCreateTable(filePath, originalName);

    // record in datasets table
    await pool.query(
      `INSERT INTO datasets (name, table_name, row_count) VALUES ($1, $2, $3) ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count`,
      [originalName, result.tableName, result.rowCount]
    );

    // cleanup uploaded file
    try { fs.unlinkSync(filePath); } catch (e) { log.error('cleanup failed', e); }

    res.json({ dataset: originalName, table: result.tableName, rowCount: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
