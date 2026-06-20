require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Client } = require('pg');

const upload = multer({ dest: os.tmpdir() });
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not set. Set it in environment to connect to Neon/Postgres.');
}

function createPgClient() {
  return new Client({ connectionString: DATABASE_URL });
}

function sanitizeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+/, '').toLowerCase();
}

// POST /api/upload -> accepts 'file' multipart form field (CSV)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const csvPath = req.file.path;
  const originalName = req.file.originalname || 'dataset';
  const baseName = path.parse(originalName).name;
  const tableName = sanitizeIdentifier(`dataset_${baseName}_${Date.now()}`);

  const rows = [];
  let headers = null;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('headers', (h) => {
          headers = h.map((c) => sanitizeIdentifier(c));
        })
        .on('data', (data) => {
          // ensure consistent keys using sanitized headers
          if (!headers) {
            headers = Object.keys(data).map((c) => sanitizeIdentifier(c));
          }
          const row = {};
          Object.keys(data).forEach((k, i) => {
            const col = headers[i] || sanitizeIdentifier(k);
            row[col] = data[k];
          });
          rows.push(row);
          // Safety: avoid extremely large uploads memory blow
          if (rows.length > 200000) {
            reject(new Error('CSV too large'));
          }
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    if (!headers || headers.length === 0) {
      return res.status(400).json({ message: 'CSV has no headers' });
    }

    if (!DATABASE_URL) {
      // Clean up temp file
      fs.unlinkSync(csvPath);
      return res.status(200).json({ table_name: tableName, row_count: rows.length, note: 'No DATABASE_URL; rows parsed but not persisted.' });
    }

    const client = createPgClient();
    await client.connect();

    // Build CREATE TABLE statement with all TEXT columns
    const colDefs = headers.map((h) => `"${h}" TEXT`).join(', ');
    const createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs})`;
    await client.query(createSql);

    // Insert rows in batches
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      // build parameterized query
      const values: any[] = [];
      const rowsSql = batch
        .map((r, rowIdx) => {
          const rowVals = headers.map((h) => {
            values.push(r[h] == null ? null : String(r[h]));
            return `$${values.length}`;
          });
          return `(${rowVals.join(',')})`;
        })
        .join(',');

      const insertSql = `INSERT INTO "${tableName}" (${headers.map((h) => `"${h}"`).join(',')}) VALUES ${rowsSql}`;
      await client.query(insertSql, values);
    }

    await client.end();

    // remove temp file
    fs.unlinkSync(csvPath);

    return res.json({ table_name: tableName, row_count: rows.length });
  } catch (err) {
    console.error('upload error', err);
    try { fs.unlinkSync(csvPath); } catch(e){}
    return res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// GET /api/datasets -> list tables created by this service and provide small sample
app.get('/api/datasets', async (req, res) => {
  if (!DATABASE_URL) return res.json([]);
  const client = createPgClient();
  await client.connect();

  try {
    const q = `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'dataset_%' ORDER BY tablename`;
    const r = await client.query(q);
    const tables = r.rows.map((row) => row.tablename);

    const result = [];
    for (const t of tables) {
      try {
        const sample = await client.query(`SELECT * FROM "${t}" LIMIT 5`);
        result.push({ table_name: t, sample: sample.rows });
      } catch (e) {
        result.push({ table_name: t, sample: [] });
      }
    }

    await client.end();
    res.json(result);
  } catch (err) {
    await client.end();
    console.error(err);
    res.status(500).json({ message: 'Error listing datasets' });
  }
});

// GET /api/datasets/:name/preview -> return first rows
app.get('/api/datasets/:name/preview', async (req, res) => {
  const name = req.params.name;
  const sanitized = sanitizeIdentifier(name);
  if (sanitized !== name) {
    // don't allow arbitrary strings - require sanitized match
    return res.status(400).json({ message: 'Invalid dataset name' });
  }

  if (!DATABASE_URL) return res.status(400).json({ message: 'DATABASE_URL not configured' });
  const client = createPgClient();
  await client.connect();

  try {
    const resp = await client.query(`SELECT * FROM "${sanitized}" LIMIT 50`);
    await client.end();
    res.json({ rows: resp.rows });
  } catch (err) {
    await client.end();
    console.error(err);
    res.status(500).json({ message: 'Error fetching preview' });
  }
});

// GET /api/dashboard -> simple stats
app.get('/api/dashboard', async (req, res) => {
  if (!DATABASE_URL) return res.json({ datasetCount: 0, totalRows: 0, totalQueries: 0 });
  const client = createPgClient();
  await client.connect();

  try {
    const q = `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'dataset_%'`;
    const r = await client.query(q);
    const tables = r.rows.map((row) => row.tablename);

    let totalRows = 0;
    for (const t of tables) {
      try {
        const c = await client.query(`SELECT count(*) AS count FROM "${t}"`);
        totalRows += Number(c.rows[0].count || 0);
      } catch (e) {
        // ignore per-table error
      }
    }

    await client.end();
    res.json({ datasetCount: tables.length, totalRows, totalQueries: 0 });
  } catch (err) {
    await client.end();
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard' });
  }
});

// POST /api/datasets/refresh (no-op placeholder)
app.post('/api/datasets/refresh', (req, res) => {
  // Placeholder for backend to trigger dataset ingestion/refresh jobs
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
