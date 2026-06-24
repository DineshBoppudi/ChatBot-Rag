"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("../db/database");
const tableName_1 = require("../services/tableName");
const createTable_1 = require("../services/createTable");
const insertRows_1 = require("../services/insertRows");
const storeEmbeddings_1 = require("../services/storeEmbeddings");
console.log("UPLOAD ROUTES LOADED");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
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
        const results = [];
        fs_1.default.createReadStream(req.file.path)
            .pipe((0, csv_parser_1.default)())
            .on("data", (data) => {
            results.push(data);
        })
            .on("end", async () => {
            try {
                const columns = Object.keys(results[0] || {});
                const tableName = (0, tableName_1.generateTableName)(req.file.originalname);
                // ==========================================
                // CHECK IF DATASET ALREADY EXISTS
                // ==========================================
                const existingTable = await database_1.pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
            `, [tableName]);
                if (existingTable.rows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Dataset "${tableName}" already exists`,
                    });
                }
                // ==========================================
                // CREATE TABLE
                // ==========================================
                await (0, createTable_1.createTable)(tableName, columns);
                console.log("TABLE CREATED");
                // ==========================================
                // INSERT ROWS
                // ==========================================
                await (0, insertRows_1.insertRows)(tableName, results);
                console.log("ROWS INSERTED");
                // ==========================================
                // CREATE EMBEDDINGS
                // ==========================================
                await (0, storeEmbeddings_1.storeEmbeddings)(tableName, results);
                console.log("EMBEDDINGS STORED");
                return res.json({
                    success: true,
                    message: "Dataset imported successfully",
                    tableName,
                    totalRows: results.length,
                    embeddingsCreated: Math.min(results.length, 500),
                });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Error creating table",
                });
            }
        })
            .on("error", (error) => {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Error processing CSV",
            });
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error reading CSV",
        });
    }
});
exports.default = router;
