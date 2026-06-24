"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCsvAndCreateTable = parseCsvAndCreateTable;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
function sanitizeTableName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^_+/, "")
        .replace(/_+$/, "")
        .slice(0, 63);
}
function inferType(current, value) {
    if (value === null || value === undefined || value === "")
        return current || "TEXT";
    const v = value.trim();
    if (v === "")
        return current || "TEXT";
    // boolean
    if (/^(true|false)$/i.test(v)) {
        if (current === "TEXT")
            return "TEXT";
        return "BOOLEAN";
    }
    // integer
    if (/^-?\d+$/.test(v)) {
        if (current === null)
            return "INTEGER";
        if (current === "INTEGER")
            return "INTEGER";
        if (current === "NUMERIC")
            return "NUMERIC";
        if (current === "BOOLEAN")
            return "TEXT";
        return current || "INTEGER";
    }
    // numeric
    if (/^-?\d+\.\d+$/.test(v))
        return (current === "TEXT") ? "TEXT" : "NUMERIC";
    return "TEXT";
}
async function parseCsvAndCreateTable(filePath, originalName) {
    return new Promise(async (resolve, reject) => {
        const rows = [];
        const stream = fs_1.default.createReadStream(filePath).pipe((0, csv_parser_1.default)());
        stream.on("data", (data) => {
            rows.push(data);
        });
        stream.on("end", async () => {
            try {
                if (rows.length === 0)
                    return resolve({ tableName: sanitizeTableName(originalName), rowCount: 0 });
                const columns = Object.keys(rows[0]);
                const types = {};
                // initialize
                for (const col of columns)
                    types[col] = null;
                // infer types across rows
                for (const row of rows) {
                    for (const col of columns) {
                        const val = row[col];
                        types[col] = inferType(types[col] || null, val);
                    }
                }
                const tableName = sanitizeTableName(originalName.replace(/\.csv$/i, ""));
                // build CREATE TABLE
                const colsDefs = columns
                    .map((c) => `"${c.replace(/"/g, '""')}" ${types[c] || "TEXT"}`)
                    .join(", ");
                const createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colsDefs})`;
                logger_1.log.info("Creating table", tableName);
                await db_1.pool.query(createSql);
                // insert rows in batches
                const batchSize = 500;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    const valuesSql = [];
                    const params = [];
                    batch.forEach((r, rowIdx) => {
                        const placeholders = [];
                        columns.forEach((col, colIdx) => {
                            const val = r[col] === "" ? null : r[col];
                            params.push(val);
                            placeholders.push(`$${params.length}`);
                        });
                        valuesSql.push(`(${placeholders.join(",")})`);
                    });
                    const insertSql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',')}) VALUES ${valuesSql.join(',')}`;
                    await db_1.pool.query(insertSql, params);
                }
                resolve({ tableName, rowCount: rows.length, columns: Object.entries(types).map(([k, v]) => ({ name: k, type: v })) });
            }
            catch (err) {
                reject(err);
            }
        });
        stream.on("error", (err) => reject(err));
    });
}
