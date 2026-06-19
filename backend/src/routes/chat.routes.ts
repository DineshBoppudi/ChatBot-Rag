import { Router } from "express";
import { model } from "../services/gemini";
import { pool } from "../db/database";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const question = req.body?.question;
    const dataset = req.body?.dataset;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!dataset) {
      return res.status(400).json({
        success: false,
        message: "Dataset is required",
      });
    }

    // Get table columns dynamically
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = '${dataset}'
      ORDER BY ordinal_position
    `);

    const columns = columnsResult.rows
      .map((col) => col.column_name)
      .join("\n");

    const prompt = `
You are an expert PostgreSQL SQL generator.

Table Name:
${dataset}

Columns:
${columns}

Important Rules:
- Return ONLY SQL
- Generate PostgreSQL SQL
- Generate SELECT queries only
- Never generate INSERT
- Never generate UPDATE
- Never generate DELETE
- Never generate DROP
- Never generate ALTER
- Do not use markdown

Question:
${question}
`;

    const result = await model.generateContent(prompt);

    const sql = result.response
      .text()
      .replace(/```sql/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("\nGenerated SQL:");
    console.log(sql);

    if (!sql.toLowerCase().startsWith("select")) {
      return res.status(400).json({
        success: false,
        message: "Only SELECT queries are allowed",
      });
    }

    const queryResult = await pool.query(sql);

    const answerPrompt = `
You are a professional data analyst.

User Question:
${question}

Query Result:
${JSON.stringify(queryResult.rows)}

Give a short, direct answer.

Do not mention SQL.
`;

    const answerResult =
      await model.generateContent(answerPrompt);

    const answer =
      answerResult.response.text();

    res.json({
      success: true,
      question,
      dataset,
      sql,
      answer,
      rows: queryResult.rows,
    });

  } catch (error) {
    console.error("Chat Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process question",
      error: String(error),
    });
  }
});

export default router;