import { Request, Response } from 'express';
import { pool } from '../db';
import { callGemini } from '../services/geminiService';
import { log } from '../utils/logger';

function validateSql(sql: string) {
  const forbidden = ['INSERT','UPDATE','DELETE','DROP','ALTER','TRUNCATE','CREATE','GRANT'];
  const up = sql.toUpperCase();
  for (const f of forbidden) {
    if (up.includes(f)) throw new Error('Only SELECT queries are allowed');
  }
  // basic ensure starts with SELECT
  if (!up.trim().startsWith('SELECT')) throw new Error('Only SELECT queries are allowed');
}

export async function handleChat(req: Request, res: Response) {
  try {
    const { table_name, question } = req.body;
    if (!table_name || !question) return res.status(400).json({ error: 'table_name and question required' });

    // fetch schema
    const schemaRes = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1`,
      [table_name]
    );
    const schema = schemaRes.rows.map((r:any)=>`${r.column_name} (${r.data_type})`).join(', ');

    // build prompt for Gemini to generate SQL
    const prompt = `You are an assistant that generates a single SQL SELECT statement for Postgres given a table name and schema. Table: ${table_name}. Columns: ${schema}.\nUser question: ${question}\nReturn only the SQL without explanation.`;

    const gmResp: any = await callGemini(prompt);
    const sql = gmResp?.sql || gmResp?.text || gmResp?.output || gmResp?.choices?.[0]?.text;
    if (!sql) throw new Error('Gemini did not return SQL');

    validateSql(sql);

    const result = await pool.query(sql);
    const rows = result.rows;

    // ask Gemini to produce a natural language answer given rows
    const answerPrompt = `User question: ${question}\nSQL: ${sql}\nResults: ${JSON.stringify(rows.slice(0,20))}\nProvide a concise human-friendly answer and a one-line summary.`;
    const ansResp: any = await callGemini(answerPrompt);
    const answer = ansResp?.text || ansResp?.answer || JSON.stringify(ansResp);

    res.json({ sql, rows, answer });
  } catch (err:any) {
    log.error(err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
}
