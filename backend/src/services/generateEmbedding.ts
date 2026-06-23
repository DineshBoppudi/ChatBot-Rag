import { genAI } from "./gemini";

export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const embeddingModel =
    genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

  const result =
    await embeddingModel.embedContent(text);

  return result.embedding.values;
}