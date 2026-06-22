import { Router } from "express";
import { groq } from "../services/groq";
import { pool } from "../db/database";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { question, dataset, history = [] } = req.body;

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

    // =====================================================
    // GET SCHEMA
    // =====================================================

    const columnsResult = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
      `,
      [dataset]
    );

    const columns = columnsResult.rows.map(
      (c) => c.column_name
    );

    const schemaText = columns.join(", ");

    // =====================================================
    // GET SAMPLE DATA
    // =====================================================

    let sampleRows: any[] = [];

    try {
      const sampleResult = await pool.query(
        `SELECT * FROM "${dataset}" LIMIT 5`
      );

      sampleRows = sampleResult.rows;
    } catch (e) {
      console.log("Could not fetch sample rows");
    }

    // =====================================================
    // BUILD HISTORY TEXT
    // =====================================================

    const historyText = history
      .slice(-8)
      .map(
        (m: any) =>
          `${m.role.toUpperCase()}: ${m.content}`
      )
      .join("\n");

    // =====================================================
    // CLASSIFY INTENT
    // =====================================================

    const classificationPrompt = `
You are an AI Data Analyst.

Dataset:
${dataset}

Columns:
${schemaText}

Sample Data:
${JSON.stringify(sampleRows, null, 2)}

Conversation History:
${historyText}

Latest Question:
${question}

Classify the request into exactly ONE category:

DATASET_DESCRIPTION
- explaining dataset
- explaining columns
- describing schema
- what data exists

GENERAL_ANALYSIS
- summarize dataset
- provide insights
- suggest KPIs
- give topics
- business recommendations
- dataset understanding
- make it shorter
- expand previous answer
- follow-up conversation

SQL_ANALYSIS
- requires querying data
- counts
- averages
- trends
- top values
- aggregations
- rankings

CONVERSATION

- hi
- hello
- okay
- ok
- thanks
- thank you
- good morning
- who are you
- what do you do
- cool
- got it
- i don't need anything
- never mind

Return ONLY one of:

Return ONLY one of:

DATASET_DESCRIPTION
GENERAL_ANALYSIS
SQL_ANALYSIS
CONVERSATION
`;

    const classificationResponse =
      await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: classificationPrompt,
          },
        ],
      });

    const intent =
      classificationResponse.choices[0].message.content?.trim() ||
      "SQL_ANALYSIS";

    console.log("INTENT:", intent);

    // =====================================================
    // DATASET DESCRIPTION
    // =====================================================

    if (intent.includes("DATASET_DESCRIPTION")) {
      const prompt = `
You are a senior data analyst.

Dataset:
${dataset}

Columns:
${schemaText}

Sample Rows:
${JSON.stringify(sampleRows, null, 2)}

Conversation:
${historyText}

User Question:
${question}

Explain naturally.

If user asks:

- make it shorter
- summarize
- short version

then shorten the previous answer.

Use conversation history.

Keep answers under 150 words.

If asked to shorten,
shorten previous explanation.

Do not mention SQL.
`;

      const response =
        await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

      return res.json({
        success: true,
        sql: "",
        rows: [],
        answer:
          response.choices[0].message.content ||
          "Unable to answer.",
      });
    }

    // =====================================================
    // GENERAL ANALYSIS
    // =====================================================

    if (intent.includes("GENERAL_ANALYSIS")) {
      const prompt = `
You are a senior business analyst.

Dataset:
${dataset}

Columns:
${schemaText}

Sample Data:
${JSON.stringify(sampleRows, null, 2)}

Conversation:
${historyText}

User Question:
${question}

Provide a business-focused answer.

Possible tasks:

- insights
- recommendations
- KPI suggestions
- analysis topics
- business opportunities
- dataset understanding

Use conversation history.

If user says:
- expand
- explain more
- continue

then continue previous answer.

If user says:
- shorten
- summarize

then provide a shorter version.

Keep answers concise.
Do not generate SQL.
`;

      const response =
        await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

      return res.json({
        success: true,
        sql: "",
        rows: [],
        answer:
          response.choices[0].message.content ||
          "Unable to answer.",
      });
    }

    // =====================================================
    // SQL ANALYSIS
    // =====================================================

      if (intent.includes("CONVERSATION")) {
  const response =
    await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
You are a friendly AI Data Analyst.

Respond naturally like ChatGPT.

Do not force dataset analysis.

If user is chatting casually,
respond casually.

Keep answers concise.
`,
        },
        ...history,
        {
          role: "user",
          content: question,
        },
      ],
    });

  return res.json({
    success: true,
    sql: "",
    rows: [],
    answer:
      response.choices[0].message.content,
  });
}
    const sqlPrompt = `
You are an expert PostgreSQL analyst.

Dataset Table:
${dataset}

Columns:
${schemaText}

Sample Data:
${JSON.stringify(sampleRows, null, 2)}

Conversation:
${historyText}

Question:
${question}

Rules:

- Generate ONLY PostgreSQL SQL.
- Must start with SELECT.
- Use ONLY existing columns.
- Never invent columns.
- No markdown.
- No explanation.
- No comments.
- Use GROUP BY when needed.
- Use AVG() for averages.
- Use COUNT(*) for counts.
- Use LIMIT 20 unless needed otherwise.
`;

    const sqlResponse =
      await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: sqlPrompt,
          },
        ],
      });

    const sql =
      sqlResponse.choices[0].message.content?.trim() || "";

    console.log("SQL:", sql);

    if (
      !sql.toLowerCase().startsWith("select")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid SQL generated",
        sql,
      });
    }

    // =====================================================
    // EXECUTE SQL
    // =====================================================

    let queryResult;

    try {
      queryResult = await pool.query(sql);
    } catch (sqlError: any) {
      console.error(sqlError);

      return res.status(400).json({
        success: false,
        message: "Generated SQL failed",
        sql,
        error: sqlError.message,
      });
    }

    const rows = queryResult.rows;

    // =====================================================
    // HUMAN ANSWER
    // =====================================================

    const answerPrompt = `
You are a professional data analyst.

Dataset:
${dataset}

Question:
${question}

Results:
${JSON.stringify(rows, null, 2)}

Instructions:

- Answer naturally.
- Mention important values.
- Explain findings clearly.
- Be concise.
- Sound human.
- Do not repeat raw JSON.
`;

    const answerResponse =
      await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: answerPrompt,
          },
        ],
      });

    return res.json({
      success: true,
      sql,
      rows,
      answer:
        answerResponse.choices[0].message.content ||
        "No answer generated.",
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Chat failed",
      error: error.message,
    });
  }
});

export default router;