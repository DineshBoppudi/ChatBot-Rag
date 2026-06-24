import { Router } from "express";
import { pool } from "../db/database";
import { groq } from "../services/groq";

const router = Router();

/* Dashboard Summary */
router.get("/", async (req, res) => {
  try {
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name NOT IN ('pg_stat_statements')
    `);

    const datasetCount = tablesResult.rows.length;

    let totalRows = 0;

    for (const table of tablesResult.rows) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) FROM "${table.table_name}"`
        );

        totalRows += Number(result.rows[0].count);
      } catch {
        // skip
      }
    }

    res.json({
      datasetCount,
      totalRows,
      totalQueries: 0,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
});

/* KPIs */
router.get("/:dataset/kpis", async (req, res) => {
  try {
    const { dataset } = req.params;

    const result = await pool.query(`
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

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* Top Products */
router.get("/:dataset/top-products", async (req, res) => {
  try {
    const { dataset } = req.params;

    const result = await pool.query(`
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* Category Distribution */
router.get("/:dataset/category-distribution", async (req, res) => {
  try {
    const { dataset } = req.params;

    const columnsResult = await pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      `,
      [dataset]
    );

    const columnNames = columnsResult.rows.map(
      (c) => c.column_name
    );

    let categoryColumn = "";

    if (columnNames.includes("sub_category")) {
      categoryColumn = "sub_category";
    } else if (
      columnNames.includes("main_category")
    ) {
      categoryColumn = "main_category";
    } else {
      categoryColumn =
        columnNames.find(
          (c) =>
            c !== "id" &&
            c !== "name"
        ) || "";
    }

    if (!categoryColumn) {
      return res.json([]);
    }

    const result = await pool.query(`
      SELECT
        "${categoryColumn}" as name,
        COUNT(*)::int as value
      FROM "${dataset}"
      GROUP BY "${categoryColumn}"
      ORDER BY value DESC
      LIMIT 8
    `);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* AI Insights */
router.get("/:dataset/insights", async (req, res) => {
  try {
    const { dataset } = req.params;

    const kpiResult = await pool.query(`
      SELECT COUNT(*) as total_rows
      FROM "${dataset}"
    `);

    const prompt = `
Dataset: ${dataset}

KPIs:
${JSON.stringify(kpiResult.rows[0])}

Generate 5 concise business insights.
Return only bullet points.
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

    res.json({
      insights:
        response.choices[0].message.content,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* Dataset Profile */
router.get("/:dataset/profile", async (req, res) => {
  try {
    const { dataset } = req.params;

    const columnsResult = await pool.query(
      `
      SELECT column_name,data_type
      FROM information_schema.columns
      WHERE table_name = $1
      `,
      [dataset]
    );

    const rowCount = await pool.query(
      `SELECT COUNT(*) FROM "${dataset}"`
    );

    res.json({
      rows: Number(rowCount.rows[0].count),
      columns: columnsResult.rows.length,
      schema: columnsResult.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/*
  IMPORTANT:
  KEEP THIS ROUTE LAST
*/
router.get("/:dataset", async (req, res) => {
  try {
    const { dataset } = req.params;

    const rowCountResult = await pool.query(
      `SELECT COUNT(*) FROM "${dataset}"`
    );

    const columnsResult = await pool.query(
      `
      SELECT column_name,data_type
      FROM information_schema.columns
      WHERE table_name = $1
      `,
      [dataset]
    );

    res.json({
      dataset,
      totalRows: Number(
        rowCountResult.rows[0].count
      ),
      totalColumns:
        columnsResult.rows.length,
      columns: columnsResult.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;