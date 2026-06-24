"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const database_1 = require("../db/database");
const chunkText_1 = require("../services/chunkText");
const saveChunks_1 = require("../services/saveChunks");
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    dest: "src/documents/",
});
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }
        const result = await database_1.pool.query(`
        INSERT INTO documents
        (
          file_name,
          file_path,
          file_size
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `, [
            req.file.originalname,
            req.file.path,
            req.file.size,
        ]);
        const fileContent = fs_1.default.readFileSync(req.file.path, "utf-8");
        const chunks = (0, chunkText_1.chunkText)(fileContent);
        await (0, saveChunks_1.saveChunks)(result.rows[0].id, chunks);
        res.json({
            success: true,
            document: result.rows[0],
            totalChunks: chunks.length,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error.message,
        });
    }
});
exports.default = router;
