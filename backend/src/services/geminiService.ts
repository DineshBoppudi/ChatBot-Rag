import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set — Gemini calls will fail');
}

export async function callGemini(prompt: string) {
  // Placeholder: adjust to real Gemini REST API shape
  const url = 'https://gemini.api.example/v1/generate';
  const resp = await axios.post(url, { prompt }, { headers: { Authorization: `Bearer ${GEMINI_API_KEY}` } });
  return resp.data;
}
