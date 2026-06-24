"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpload = handleUpload;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const csvService_1 = require("../services/csvService");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
async function handleUpload(req, res) {
    try {
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });
        const filePath = req.file.path;
        const originalName = path_1.default.basename(req.file.originalname, path_1.default.extname(req.file.originalname));
        const result = await (0, csvService_1.parseCsvAndCreateTable)(filePath, originalName);
        // record in datasets table
        await db_1.pool.query(`INSERT INTO datasets (name, table_name, row_count) VALUES ($1, $2, $3) ON CONFLICT (table_name) DO UPDATE SET row_count = EXCLUDED.row_count`, [originalName, result.tableName, result.rowCount]);
        // cleanup uploaded file
        try {
            fs_1.default.unlinkSync(filePath);
        }
        catch (e) {
            logger_1.log.error('cleanup failed', e);
        }
        res.json({ dataset: originalName, name: originalName, table_name: result.tableName, table: result.tableName, row_count: result.rowCount, rowCount: result.rowCount });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
}
