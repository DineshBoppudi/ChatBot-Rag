import { useEffect, useState } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  Database,
  TrendingUp,
  MessageCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
} from "lucide-react";

function DashboardPage() {
  const [stats, setStats] = useState({
    datasetCount: 0,
    totalRows: 0,
    totalQueries: 0,
  });

  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (selected) {
      loadPreview(selected);
    }
  }, [selected]);

  const loadDashboard = async () => {
    try {
      const statsRes = await api.get("/api/dashboard");
      setStats(statsRes.data);

      const datasetsRes = await api.get("/api/datasets");
      setDatasets(datasetsRes.data);

      if (datasetsRes.data.length > 0) {
        setSelected(datasetsRes.data[0].table_name);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadPreview = async (tableName: string) => {
    try {
      const response = await api.get(
        `/api/datasets/${encodeURIComponent(tableName)}/preview`
      );

      setPreviewRows(response.data.rows || []);
    } catch (error) {
      console.error(error);
    }
  };

  const chartData = () => {
    if (!previewRows.length) return [];

    const columns = Object.keys(previewRows[0]);

    let categoryColumn: string | null = null;
    let valueColumn: string | null = null;

    for (const col of columns) {
      const numeric = previewRows.every(
        (row) =>
          row[col] === null ||
          row[col] === undefined ||
          !isNaN(Number(row[col]))
      );

      if (numeric && !valueColumn) {
        valueColumn = col;
      }

      if (!numeric && !categoryColumn) {
        categoryColumn = col;
      }
    }

    if (!valueColumn) return [];

    return previewRows.slice(0, 15).map((row, index) => ({
      name: categoryColumn
        ? String(row[categoryColumn])
        : `${index + 1}`,
      value: Number(row[valueColumn]) || 0,
    }));
  };

  const getChartType = () => {
    const data = chartData();

    if (!data.length) return "area";

    const uniqueNames = new Set(data.map((d) => d.name));

    if (uniqueNames.size <= 5) return "pie";
    if (uniqueNames.size <= 15) return "bar";

    return "line";
  };

  const renderChart = () => {
    const data = chartData();

    if (!data.length) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400">
          No chart data available
        </div>
      );
    }

    const chartType = getChartType();

    const colors = [
      "#4F46E5",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#06B6D4",
      "#8B5CF6",
    ];
        if (chartType === "pie") {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={70}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      );
    }

    if (chartType === "bar") {
      return (
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="value"
            fill="#4F46E5"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      );
    }

    return (
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#4F46E5"
          strokeWidth={3}
        />
      </LineChart>
    );
  };

  const generatedSql = selected
    ? `SELECT *
FROM ${selected}
LIMIT 50;`
    : "-- No dataset selected";

  const insights = [
    `${stats.datasetCount} datasets available`,
    `${stats.totalRows.toLocaleString()} rows indexed`,
    selected
      ? `Analyzing "${selected}"`
      : "Select a dataset",
  ];

  return (
    <div className="w-full">

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">
            Dashboard
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Analytics overview
          </p>
        </div>

        <Button onClick={() => navigate("/upload")}>
          Upload Dataset
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">

        <div className="bg-white rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Database size={16} />
            <span className="text-xs text-slate-500">
              Datasets
            </span>
          </div>

          <div className="text-xl font-semibold mt-2">
            {stats.datasetCount}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span className="text-xs text-slate-500">
              Rows
            </span>
          </div>

          <div className="text-xl font-semibold mt-2">
            {stats.totalRows.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} />
            <span className="text-xs text-slate-500">
              AI Queries
            </span>
          </div>

          <div className="text-xl font-semibold mt-2">
            {stats.totalQueries}
          </div>
        </div>

        <div className="bg-white rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <span className="text-xs text-slate-500">
              Dataset
            </span>
          </div>

          <div className="text-sm font-semibold mt-2 truncate">
            {selected || "None"}
          </div>
        </div>

      </div>
            <div className="grid grid-cols-12 gap-3 mb-4">

        <div className="col-span-8 bg-white rounded-xl p-3">

          <div className="flex justify-between items-center mb-3">

            <h2 className="text-sm font-semibold">
              Visualization
            </h2>

            <select
              value={selected}
              onChange={(e) =>
                setSelected(e.target.value)
              }
              className="text-xs px-2 py-1"
            >
              {datasets.map((d) => (
                <option
                  key={d.table_name}
                  value={d.table_name}
                >
                  {d.table_name}
                </option>
              ))}
            </select>

          </div>

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

        </div>

        <div className="col-span-4 bg-white rounded-xl p-3">

          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} />
            <h2 className="text-sm font-semibold">
              AI Insights
            </h2>
          </div>

          <div className="space-y-2">

            {insights.map((item, index) => (
              <div
                key={index}
                className="bg-emerald-50 rounded-lg p-2 flex gap-2"
              >
                <CheckCircle2 size={14} />
                <p className="text-xs">{item}</p>
              </div>
            ))}

          </div>

          <Button
            className="w-full mt-3"
            onClick={() => navigate("/chat")}
          >
            Ask AI
          </Button>

        </div>

      </div>

      <div className="bg-white rounded-xl p-3 mb-4">

        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold">
            Results Preview
          </h2>

          <span className="text-xs text-slate-500">
            {previewRows.length} rows
          </span>
        </div>

        <div className="overflow-auto max-h-[180px]">

          {previewRows.length > 0 ? (
            <table className="w-full text-xs">

              <thead>
                <tr>
                  {Object.keys(previewRows[0]).map((col) => (
                    <th
                      key={col}
                      className="text-left px-2 py-2"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {previewRows
                  .slice(0, 8)
                  .map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map(
                        (value, index) => (
                          <td
                            key={index}
                            className="px-2 py-2"
                          >
                            {String(value)}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
              </tbody>

            </table>
          ) : (
            <p className="text-xs text-slate-500">
              No preview available
            </p>
          )}

        </div>

      </div>

      <div className="bg-white rounded-xl p-3">

        <div className="flex items-center justify-between mb-2">

          <h2 className="text-sm font-semibold">
            Generated SQL
          </h2>

          <Button
            variant="secondary"
            onClick={() =>
              navigator.clipboard.writeText(generatedSql)
            }
          >
            <Copy size={14} />
          </Button>

        </div>

        <pre className="bg-slate-900 text-slate-100 text-xs rounded-lg p-3 overflow-auto h-[120px]">
{generatedSql}
        </pre>

      </div>

    </div>
  );
}

export default DashboardPage;