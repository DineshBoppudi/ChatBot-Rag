import { pool } from "../db/database";

export async function saveChunks(
  documentId: number,
  chunks: string[]
) {
  for (let i = 0; i < chunks.length; i++) {
    await pool.query(
      `
      INSERT INTO document_chunks
      (
        document_id,
        chunk_text,
        chunk_index
      )
      VALUES ($1,$2,$3)
      `,
      [
        documentId,
        chunks[i],
        i,
      ]
    );
  }
}