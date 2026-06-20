import { genAI } from "./gemini";

export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const embeddingModel =
    genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

  const result =
    await embeddingModel.embedContent(text);

  return result.embedding.values;
}