import { pool } from "../db/database";
import { generateEmbedding } from "./generateEmbedding";

export async function searchEmbeddings(
  datasetName: string,
  question: string
) {
  const embedding =
    await generateEmbedding(question);

  const result = await pool.query(
    `
    SELECT
      chunk_text,
      1 - (embedding <=> $2::vector) AS similarity
    FROM chunk_embeddings
    WHERE dataset_name = $1
    ORDER BY embedding <=> $2::vector
    LIMIT 5
    `,
    [
      datasetName,
      `[${embedding.join(",")}]`,
    ]
  );

  return result.rows;
}