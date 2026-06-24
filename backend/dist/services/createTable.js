"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTable = createTable;
const database_1 = require("../db/database");
async function createTable(tableName, columns) {
    const columnDefinitions = columns
        .map((col) => `"${col.toLowerCase().replace(/\s+/g, "_")}" TEXT`)
        .join(",");
    const query = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      id SERIAL PRIMARY KEY,
      ${columnDefinitions}
    );
  `;
    await database_1.pool.query(query);
}
