"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const tables = await database_1.pool.query(`
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
        res.json(tables.rows.map((t) => ({
            name: t.table_name,
            table_name: t.table_name,
        })));
    }
    catch (error) {
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
        const result = await database_1.pool.query(`SELECT * FROM "${table}" LIMIT 20`);
        res.json({
            rows: result.rows,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.default = router;
