"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.get("/status", async (req, res) => {
    const result = await database_1.pool.query(`
    SELECT COUNT(*) as total
    FROM chunk_embeddings
  `);
    res.json({
        embeddings: result.rows[0].total,
    });
});
exports.default = router;
