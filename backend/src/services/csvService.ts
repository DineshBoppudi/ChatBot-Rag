import fs from "fs";
import csv from "csv-parser";
import { pool } from "../db";
import { log } from "../utils/logger";

function sanitizeTableName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+/, "")
    .replace(/_+$/, "")
    .slice(0, 63);
}

function inferType(current: string | null, value: string | null) {
  if (value === null || value === undefined || value === "") return current || "TEXT";
  const v = value.trim();
  if (v === "") return current || "TEXT";
  // boolean
  if (/^(true|false)$/i.test(v)) {
    if (current === "TEXT") return "TEXT";
    return "BOOLEAN";
  }
  // integer
  if (/^-?\d+$/.test(v)) {
    if (current === null) return "INTEGER";
    if (current === "INTEGER") return "INTEGER";
    if (current === "NUMERIC") return "NUMERIC";
    if (current === "BOOLEAN") return "TEXT";
    return current || "INTEGER";
  }
  // numeric
  if (/^-?\d+\.\d+$/.test(v)) return (current === "TEXT") ? "TEXT" : "NUMERIC";
  return "TEXT";
}

export async function parseCsvAndCreateTable(filePath: string, originalName: string) {
  return new Promise(async (resolve, reject) => {
    const rows: any[] = [];
    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on("data", (data: any) => {
      rows.push(data);
    });

    stream.on("end", async () => {
      try {
        if (rows.length === 0) return resolve({ tableName: sanitizeTableName(originalName), rowCount: 0 });
        const columns = Object.keys(rows[0]);
        const types: Record<string, string> = {};
        // initialize
        for (const col of columns) types[col] = null as any;
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
        log.info("Creating table", tableName);
        await pool.query(createSql);

        // insert rows in batches
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const valuesSql: string[] = [];
          const params: any[] = [];
          batch.forEach((r, rowIdx) => {
            const placeholders: string[] = [];
            columns.forEach((col, colIdx) => {
              const val = r[col] === "" ? null : r[col];
              params.push(val);
              placeholders.push(`$${params.length}`);
            });
            valuesSql.push(`(${placeholders.join(",")})`);
          });
          const insertSql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c.replace(/"/g,'""')}"`).join(',')}) VALUES ${valuesSql.join(',')}`;
          await pool.query(insertSql, params);
        }

        resolve({ tableName, rowCount: rows.length, columns: Object.entries(types).map(([k,v])=>({name:k,type:v})) });
      } catch (err) {
        reject(err);
      }
    });

    stream.on("error", (err: any) => reject(err));
  });
}
