"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveChunks = saveChunks;
const database_1 = require("../db/database");
async function saveChunks(documentId, chunks) {
    for (let i = 0; i < chunks.length; i++) {
        await database_1.pool.query(`
      INSERT INTO document_chunks
      (
        document_id,
        chunk_text,
        chunk_index
      )
      VALUES ($1,$2,$3)
      `, [
            documentId,
            chunks[i],
            i,
        ]);
    }
}
