"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
const gemini_1 = require("./gemini");
async function generateEmbedding(text) {
    const embeddingModel = gemini_1.genAI.getGenerativeModel({
        model: "gemini-embedding-001",
    });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}
