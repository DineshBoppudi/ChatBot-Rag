"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertRows = insertRows;
const database_1 = require("../db/database");
async function insertRows(tableName, rows) {
    let rowNumber = 0;
    try {
        console.log("INSERT ROWS STARTED");
        for (const row of rows) {
            rowNumber++;
            console.log(`Inserting row ${rowNumber}/${rows.length}`);
            const columns = Object.keys(row)
                .map((col) => `"${col
                .toLowerCase()
                .replace(/\s+/g, "_")}"`)
                .join(",");
            const values = Object.values(row);
            const placeholders = values
                .map((_, index) => `$${index + 1}`)
                .join(",");
            const query = `
        INSERT INTO "${tableName}"
        (${columns})
        VALUES (${placeholders})
      `;
            await database_1.pool.query(query, values);
        }
        console.log("INSERT ROWS COMPLETED");
    }
    catch (error) {
        console.error("INSERT ROWS FAILED");
        console.error("Failed at row:", rowNumber);
        console.error(error);
        if (error?.message) {
            console.error("MESSAGE:", error.message);
        }
        throw error;
    }
}
