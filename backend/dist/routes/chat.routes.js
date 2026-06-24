"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groq_1 = require("../services/groq");
const database_1 = require("../db/database");
const searchEmbeddings_1 = require("../services/searchEmbeddings");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { question, dataset, history = [], } = req.body;
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
        const columnsResult = await database_1.pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
      `, [dataset]);
        const columns = columnsResult.rows.map((c) => c.column_name);
        const schemaText = columns.join(", ");
        // =====================================================
        // BASIC RAG
        // =====================================================
        let sampleRows = [];
        let totalRows = 0;
        try {
            const sampleResult = await database_1.pool.query(`SELECT * FROM "${dataset}" LIMIT 20`);
            sampleRows = sampleResult.rows;
            const countResult = await database_1.pool.query(`SELECT COUNT(*) FROM "${dataset}"`);
            totalRows = Number(countResult.rows[0]?.count || 0);
        }
        catch (e) {
            console.log("Could not fetch dataset context");
        }
        const datasetContext = `
Dataset Name:
${dataset}

Total Rows:
${totalRows}

Columns:
${schemaText}

Sample Rows:
${JSON.stringify(sampleRows, null, 2)}
`;
        // =====================================================
        // HISTORY
        // =====================================================
        const historyText = history
            .slice(-12)
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n");
        let ragContext = "";
        try {
            const ragResults = await (0, searchEmbeddings_1.searchEmbeddings)(dataset, question);
            ragContext = ragResults
                .map((item) => item.chunk_text)
                .join("\n\n");
            console.log("RAG Chunks Retrieved:", ragResults.length);
        }
        catch (error) {
            console.log("RAG search skipped");
        }
        // =====================================================
        // INTENT CLASSIFICATION
        // =====================================================
        const classificationPrompt = `
You are an AI Data Analyst.

Dataset Context:

${datasetContext}

Conversation:

${historyText}

Latest User Question:

${question}

Classify into exactly ONE category:

DATASET_DESCRIPTION
GENERAL_ANALYSIS
SQL_ANALYSIS
CONVERSATION

DATASET_DESCRIPTION:
- explain dataset
- explain columns
- describe schema
- dataset summary

GENERAL_ANALYSIS:
- insights
- KPI ideas
- recommendations
- business analysis
- topics
- trends
- summarize findings

SQL_ANALYSIS:
- counts
- averages
- top values
- aggregations
- rankings
- calculations

CONVERSATION:
- hello
- hi
- thanks
- who are you
- what do you do
- okay
- cool
- never mind

Return ONLY one label.
`;
        const classificationResponse = await groq_1.groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            messages: [
                {
                    role: "user",
                    content: classificationPrompt,
                },
            ],
        });
        const intent = classificationResponse.choices[0]
            .message.content?.trim() ||
            "SQL_ANALYSIS";
        console.log("INTENT:", intent);
        // =====================================================
        // CONVERSATION
        // =====================================================
        if (intent.includes("CONVERSATION")) {
            const response = await groq_1.groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                temperature: 0.3,
                messages: [
                    {
                        role: "system",
                        content: `
You are a friendly AI assistant.

Respond naturally.

Do not force dataset analysis.

Do not repeatedly introduce yourself.

Keep responses concise.
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
                answer: response.choices[0].message.content,
            });
        }
        // =====================================================
        // DATASET DESCRIPTION
        // =====================================================
        if (intent.includes("DATASET_DESCRIPTION")) {
            const prompt = `
You are a senior data analyst.

Dataset Context:

${datasetContext}

Relevant Dataset Information:

${ragContext}

Conversation:

${historyText}

User Question:

${question}

Instructions:

- Explain the dataset naturally.
- Focus on actual sample rows.
- Explain what columns represent.
- Mention possible business uses.
- Avoid generic descriptions.
- Keep under 150 words.
- If user asks to shorten,
  shorten the previous answer.
- Use conversation history.
- Do not mention SQL.
`;
            const response = await groq_1.groq.chat.completions.create({
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
                answer: response.choices[0].message.content ||
                    "Unable to answer.",
            });
        }
        // =====================================================
        // GENERAL ANALYSIS
        // =====================================================
        if (intent.includes("GENERAL_ANALYSIS")) {
            const prompt = `
You are a senior business analyst.

Dataset Context:

${datasetContext}

Relevant Dataset Information:

${ragContext}

Conversation:

${historyText}

User Question:

${question}

Provide a business-focused answer.

Possible tasks:

- insights
- KPI ideas
- recommendations
- trends
- opportunities
- dataset understanding
- business strategy

Instructions:

- Use actual sample rows.
- Use actual dataset structure.
- Avoid generic responses.
- If user asks for KPIs,
  provide meaningful KPIs.
- If user asks for insights,
  provide insights based on data.
- If user says continue,
  continue previous answer.
- If user says summarize,
  provide shorter version.
- Do not generate SQL.
- Keep answers concise.
`;
            const response = await groq_1.groq.chat.completions.create({
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
                answer: response.choices[0].message.content ||
                    "Unable to answer.",
            });
        }
        // =====================================================
        // SQL ANALYSIS
        // =====================================================
        const sqlPrompt = `
You are an expert PostgreSQL analyst.

Dataset Context:

${datasetContext}

Relevant Dataset Information:

${ragContext}

Conversation:

${historyText}

Question:

${question}

Rules:

- Generate ONLY PostgreSQL SQL.
- Must start with SELECT.
- Use ONLY available columns.
- Never invent columns.
- If the dataset does not contain
  enough information return exactly:

CANNOT_ANSWER

- No markdown.
- No explanations.
- No comments.
- Use LIMIT 20 unless otherwise requested.
`;
        const sqlResponse = await groq_1.groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            messages: [
                {
                    role: "user",
                    content: sqlPrompt,
                },
            ],
        });
        const sql = sqlResponse.choices[0].message.content?.trim() || "";
        console.log("GENERATED SQL:");
        console.log(sql);
        // =====================================================
        // CANNOT ANSWER
        // =====================================================
        if (sql === "CANNOT_ANSWER") {
            return res.json({
                success: true,
                sql: "",
                rows: [],
                answer: `The dataset "${dataset}" does not contain enough information to answer that question.`,
            });
        }
        // =====================================================
        // VALIDATE SQL
        // =====================================================
        if (!sql.toLowerCase().startsWith("select")) {
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
            queryResult = await database_1.pool.query(sql);
        }
        catch (sqlError) {
            console.error("SQL EXECUTION ERROR:");
            console.error(sqlError);
            return res.status(400).json({
                success: false,
                message: "Generated SQL failed",
                sql,
                error: sqlError.message,
            });
        }
        const rows = queryResult.rows;
        console.log("ROWS RETURNED:", rows.length);
        // =====================================================
        // HUMAN ANSWER GENERATION
        // =====================================================
        const answerPrompt = `
You are a senior business analyst.

Dataset Context:

${datasetContext}

User Question:

${question}

SQL Used:

${sql}

Results:

${JSON.stringify(rows, null, 2)}

Instructions:

- Answer naturally.
- Sound like a human analyst.
- Mention actual values.
- Explain findings clearly.
- Be concise.
- Do not repeat raw JSON.
- Do not dump the SQL query.
- If no rows were returned,
  explain why.
- If one value clearly answers
  the question, provide it directly.
- Focus on business insights.
`;
        const answerResponse = await groq_1.groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            messages: [
                {
                    role: "user",
                    content: answerPrompt,
                },
            ],
        });
        const answer = answerResponse.choices[0].message
            .content ||
            "No answer generated.";
        return res.json({
            success: true,
            sql,
            rows,
            answer,
        });
    }
    catch (error) {
        console.error("CHAT ERROR:");
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Chat failed",
            error: error.message,
        });
    }
});
exports.default = router;
