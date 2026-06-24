"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDb = initDb;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString)
    throw new Error("DATABASE_URL not set");
exports.pool = new pg_1.Pool({ connectionString });
async function initDb() {
    // metadata table for datasets
    await exports.pool.query(`
    CREATE TABLE IF NOT EXISTS datasets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      table_name TEXT NOT NULL UNIQUE,
      row_count INTEGER,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}
