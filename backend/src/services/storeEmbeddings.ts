import { pool } from "../db/database";
import { generateEmbedding } from "./generateEmbedding";

console.log("STORE EMBEDDINGS FILE LOADED");

export async function storeEmbeddings(
  datasetName: string,
  rows: any[]
) {
  console.log("=================================");
  console.log("storeEmbeddings called");
  console.log("Dataset:", datasetName);
  console.log("Rows:", rows.length);
  console.log("=================================");

  try {
    const limitedRows = rows.slice(0, 500);

    for (const row of limitedRows) {
      const chunkText = Object.entries(row)
        .map(
          ([key, value]) =>
            `${key}: ${value}`
        )
        .join(", ");

      console.log("Generating embedding...");

      const embedding =
        await generateEmbedding(chunkText);

      console.log(
        "Embedding generated. Dimensions:",
        embedding.length
      );

      await pool.query(
        `
        INSERT INTO chunk_embeddings
        (
          dataset_name,
          chunk_text,
          embedding
        )
        VALUES
        (
          $1,
          $2,
          $3::vector
        )
        `,
        [
          datasetName,
          chunkText,
          `[${embedding.join(",")}]`,
        ]
      );

      console.log("Embedding stored");
    }

    console.log(
      `Stored embeddings for ${datasetName}`
    );
  } catch (error: any) {
    console.error(
      "Embedding storage failed"
    );
    console.error(error);

    if (error?.message) {
      console.error(
        "MESSAGE:",
        error.message
      );
    }
  }
}