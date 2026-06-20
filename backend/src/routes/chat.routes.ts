import { Router } from "express";
import { groq } from "../services/groq";
import { pool } from "../db/database";

const router = Router();

router.post("/", async (req, res) => {
  try {
    console.log("========== CHAT REQUEST ==========");
    console.log("BODY:", req.body);

    const question = req.body?.question;
    const dataset = req.body?.dataset;

    console.log("QUESTION:", question);
    console.log("DATASET:", dataset);

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

    const columnsResult = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
      `,
      [dataset]
    );

    console.log("COLUMNS:", columnsResult.rows);

    const columns = columnsResult.rows
      .map((c) => c.column_name)
      .join(", ");

    const prompt = `
Generate ONLY PostgreSQL SELECT query.

Table:
${dataset}

Columns:
${columns}

Question:
${question}

Rules:
- Return SQL only
- SELECT only
- No markdown
- No explanation
- Use LIMIT 20
`;

    console.log("SENDING TO GROQ...");

    const sqlResponse =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const sql =
      sqlResponse.choices[0].message.content?.trim() || "";

    console.log("GENERATED SQL:");
    console.log(sql);

    if (!sql.toLowerCase().startsWith("select")) {
      return res.status(400).json({
        success: false,
        message: "Groq did not return a SELECT query",
        sql,
      });
    }

    const queryResult = await pool.query(sql);

    console.log(
      "ROWS RETURNED:",
      queryResult.rows.length
    );

    return res.json({
      success: true,
      sql,
      answer: `Returned ${queryResult.rows.length} rows`,
      rows: queryResult.rows,
    });

  } catch (error: any) {
    console.error("CHAT ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Chat failed",
      error: error.message,
    });
  }
});

export default router;