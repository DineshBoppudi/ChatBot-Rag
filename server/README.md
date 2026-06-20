Server for file ingestion and dataset endpoints

Setup
1. cd server
2. npm install
3. Copy .env.example to .env and set DATABASE_URL to your Neon/Postgres connection string

Run
- npm start

Endpoints
- POST /api/upload (multipart form, field 'file') -> stores CSV into a new table named dataset_<name>_<timestamp>
- GET /api/datasets -> lists dataset tables and returns a small sample
- GET /api/datasets/:name/preview -> returns first 50 rows for preview
- GET /api/dashboard -> basic stats
- POST /api/datasets/refresh -> placeholder

Notes
- This server creates tables with TEXT columns and inserts values as strings. For production use, add schema detection and proper typing.
- Do NOT commit .env with secrets.
