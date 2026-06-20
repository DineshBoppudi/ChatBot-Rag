import { Router } from "express";
import multer from "multer";
import { pool } from "../db/database";
import { chunkText } from "../services/chunkText";
import { saveChunks } from "../services/saveChunks";
import fs from "fs";

const router = Router();

const upload = multer({
  dest: "src/documents/",
});

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO documents
        (
          file_name,
          file_path,
          file_size
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
          req.file.originalname,
          req.file.path,
          req.file.size,
        ]
      );
      const fileContent = fs.readFileSync(
  req.file.path,
  "utf-8"
);

const chunks = chunkText(fileContent);

await saveChunks(
  result.rows[0].id,
  chunks
);

    res.json({
  success: true,
  document: result.rows[0],
  totalChunks: chunks.length,
});

    } catch (error: any) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

export default router;