"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchEmbeddings = searchEmbeddings;
const database_1 = require("../db/database");
const generateEmbedding_1 = require("./generateEmbedding");
async function searchEmbeddings(datasetName, question) {
    const embedding = await (0, generateEmbedding_1.generateEmbedding)(question);
    const result = await database_1.pool.query(`
    SELECT
      chunk_text,
      1 - (embedding <=> $2::vector) AS similarity
    FROM chunk_embeddings
    WHERE dataset_name = $1
    ORDER BY embedding <=> $2::vector
    LIMIT 5
    `, [
        datasetName,
        `[${embedding.join(",")}]`,
    ]);
    return result.rows;
}
