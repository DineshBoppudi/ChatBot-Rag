"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGemini = callGemini;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set — Gemini calls will fail');
}
async function callGemini(prompt) {
    // Placeholder: adjust to real Gemini REST API shape
    const url = 'https://gemini.api.example/v1/generate';
    const resp = await axios_1.default.post(url, { prompt }, { headers: { Authorization: `Bearer ${GEMINI_API_KEY}` } });
    return resp.data;
}
