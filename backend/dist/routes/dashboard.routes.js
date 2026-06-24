"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const groq_1 = require("../services/groq");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const tablesResult = await database_1.pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name NOT IN ('pg_stat_statements')
    `);
        const datasetCount = tablesResult.rows.length;
        let totalRows = 0;
        for (const table of tablesResult.rows) {
            try {
                const result = await database_1.pool.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
                totalRows += Number(result.rows[0].count);
            }
            catch {
                // skip system tables
            }
        }
        res.json({
            datasetCount,
            totalRows,
            totalQueries: 0,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard",
        });
    }
});
router.get("/:dataset", async (req, res) => {
    try {
        const { dataset } = req.params;
        const rowCountResult = await database_1.pool.query(`SELECT COUNT(*) FROM "${dataset}"`);
        const columnsResult = await database_1.pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = $1
      `, [dataset]);
        res.json({
            dataset,
            totalRows: Number(rowCountResult.rows[0].count),
            totalColumns: columnsResult.rows.length,
            columns: columnsResult.rows,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
router.get("/:dataset/kpis", async (req, res) => {
    try {
        const { dataset } = req.params;
        const result = await database_1.pool.query(`
      SELECT
        COUNT(*) as total_rows,

        AVG(
          NULLIF(
            REGEXP_REPLACE(
              discount_price,
              '[^0-9.]',
              '',
              'g'
            ),
            ''
          )::numeric
        ) as avg_discount_price,

        MAX(
          NULLIF(
            REGEXP_REPLACE(
              discount_price,
              '[^0-9.]',
              '',
              'g'
            ),
            ''
          )::numeric
        ) as max_discount_price,

        MIN(
          NULLIF(
            REGEXP_REPLACE(
              discount_price,
              '[^0-9.]',
              '',
              'g'
            ),
            ''
          )::numeric
        ) as min_discount_price

      FROM "${dataset}"
    `);
        return res.json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
router.get("/:dataset/top-products", async (req, res) => {
    try {
        const { dataset } = req.params;
        const result = await database_1.pool.query(`
  SELECT
    LEFT(name,50) as name,

    NULLIF(
      REPLACE(
        REPLACE(
          COALESCE(discount_price,''),
          '₹',
          ''
        ),
        ',',
        ''
      ),
      ''
    )::NUMERIC as price

  FROM "${dataset}"

  WHERE discount_price IS NOT NULL
  AND discount_price <> ''

  ORDER BY price DESC

  LIMIT 5
`);
        res.json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
router.get("/:dataset/insights", async (req, res) => {
    try {
        const { dataset } = req.params;
        const kpiResult = await database_1.pool.query(`
  SELECT
    COUNT(*) as total_rows,

    AVG(
      NULLIF(
        REPLACE(
          REPLACE(
            COALESCE(discount_price,''),
            '₹',
            ''
          ),
          ',',
          ''
        ),
        ''
      )::NUMERIC
    ) as avg_price,

    MAX(
      NULLIF(
        REPLACE(
          REPLACE(
            COALESCE(discount_price,''),
            '₹',
            ''
          ),
          ',',
          ''
        ),
        ''
      )::NUMERIC
    ) as max_price

  FROM "${dataset}"
`);
        const topProducts = await database_1.pool.query(`
      SELECT
        LEFT(name,50) as name,

        CAST(
          REPLACE(
            REPLACE(
              COALESCE(discount_price,'0'),
              '₹',
              ''
            ),
            ',',
            ''
          ) AS NUMERIC
        ) as price

      FROM "${dataset}"

      WHERE discount_price IS NOT NULL
      AND discount_price <> ''

      ORDER BY price DESC

      LIMIT 5
    `);
        const prompt = `
You are a senior business analyst.

Dataset: ${dataset}

KPIs:
${JSON.stringify(kpiResult.rows[0], null, 2)}

Top Products:
${JSON.stringify(topProducts.rows, null, 2)}

Generate 5 concise business insights.

Return only bullet points.
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
            insights: response.choices[0].message.content,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
router.get("/:dataset/profile", async (req, res) => {
    try {
        const { dataset } = req.params;
        const columnsResult = await database_1.pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = $1
      `, [dataset]);
        const rowCount = await database_1.pool.query(`SELECT COUNT(*) FROM "${dataset}"`);
        const columns = columnsResult.rows;
        const numericColumns = columns.filter((c) => c.data_type.includes("int") ||
            c.data_type.includes("numeric") ||
            c.data_type.includes("double"));
        const textColumns = columns.filter((c) => c.data_type.includes("text") ||
            c.data_type.includes("character"));
        res.json({
            rows: Number(rowCount.rows[0].count),
            columns: columns.length,
            numericColumns,
            textColumns,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
router.get("/:dataset/profile", async (req, res) => {
    try {
        const { dataset } = req.params;
        const columnsResult = await database_1.pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
      `, [dataset]);
        const rowCount = await database_1.pool.query(`SELECT COUNT(*) FROM "${dataset}"`);
        const columns = columnsResult.rows;
        const numericColumns = columns.filter((c) => c.data_type.includes("int") ||
            c.data_type.includes("numeric") ||
            c.data_type.includes("double"));
        const textColumns = columns.filter((c) => c.data_type.includes("text") ||
            c.data_type.includes("character"));
        res.json({
            rows: Number(rowCount.rows[0].count),
            columns: columns.length,
            numericColumns,
            textColumns,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
router.get("/:dataset/category-distribution", async (req, res) => {
    try {
        const { dataset } = req.params;
        const columnsResult = await database_1.pool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1
          `, [dataset]);
        const columnNames = columnsResult.rows.map((c) => c.column_name);
        let categoryColumn = "";
        if (columnNames.includes("sub_category")) {
            categoryColumn =
                "sub_category";
        }
        else if (columnNames.includes("main_category")) {
            categoryColumn =
                "main_category";
        }
        else {
            categoryColumn =
                columnNames.find((c) => c !== "id" &&
                    c !== "name") || "";
        }
        if (!categoryColumn) {
            return res.json([]);
        }
        const result = await database_1.pool.query(`
          SELECT
            "${categoryColumn}" as name,
            COUNT(*)::int as value
          FROM "${dataset}"
          GROUP BY "${categoryColumn}"
          ORDER BY value DESC
          LIMIT 8
        `);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.default = router;
