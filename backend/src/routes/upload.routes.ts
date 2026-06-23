import { Router } from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

import { generateTableName } from "../services/tableName";
import { createTable } from "../services/createTable";
import { insertRows } from "../services/insertRows";
import { storeEmbeddings } from "../services/storeEmbeddings";

console.log("UPLOAD ROUTES LOADED");

const router = Router();

const upload = multer({
  dest: "src/uploads/",
});

router.post("/", upload.single("file"), async (req, res) => {
  console.log("UPLOAD ROUTE HIT");

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
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", async () => {
        try {
          const columns = Object.keys(results[0] || {});

          const tableName =
            generateTableName(
              req.file!.originalname
            );

          await createTable(
            tableName,
            columns
          );

          console.log("TABLE CREATED");

          await insertRows(
            tableName,
            results
          );

          console.log("ROWS INSERTED");

          await storeEmbeddings(
            tableName,
            results
          );

          console.log("EMBEDDINGS STORED");

          return res.json({
            success: true,
            message:
              "Dataset imported successfully",
            tableName,
            totalRows: results.length,
            embeddingsCreated: Math.min(
              results.length,
              500
            ),
          });
        } catch (error) {
          console.error(error);

          return res.status(500).json({
            success: false,
            message:
              "Error creating table",
          });
        }
      })
      .on("error", (error) => {
        console.error(error);

        return res.status(500).json({
          success: false,
          message:
            "Error processing CSV",
        });
      });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error reading CSV",
    });
  }
});

export default router;