import { Router } from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

import { generateTableName } from "../services/tableName";
import { createTable } from "../services/createTable";
import { insertRows } from "../services/insertRows";

const router = Router();

const upload = multer({
  dest: "src/uploads/",
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const results: any[] = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const columns = Object.keys(results[0] || {});

          const tableName = generateTableName(
            req.file!.originalname
          );

          await createTable(
  tableName,
  columns
);

await insertRows(
  tableName,
  results
);

       res.json({
  success: true,
  message: "Dataset imported successfully",
  tableName,
  totalRows: results.length,
});
        } catch (error) {
          console.error(error);

          res.status(500).json({
            success: false,
            message: "Error creating table",
          });
        }
      });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error reading CSV",
    });
  }
});

export default router;