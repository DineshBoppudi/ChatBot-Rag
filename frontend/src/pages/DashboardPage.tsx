import { useEffect, useState } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
  const [numericColumn, setNumericColumn] = useState<string | null>(null);

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

      const rows = response.data.rows || [];
      setPreviewRows(rows);

      detectNumericColumn(rows);
    } catch (error) {
      console.error(error);
    }
  };

  const detectNumericColumn = (rows: any[]) => {
    if (!rows.length) return;

    const keys = Object.keys(rows[0]);

    for (const key of keys) {
      const numeric = rows.every(
        (r) =>
          r[key] === null ||
          r[key] === undefined ||
          !isNaN(Number(r[key]))
      );

      if (numeric) {
        setNumericColumn(key);
        return;
      }
    }

    setNumericColumn(null);
  };

  const chartData = () => {
    if (!previewRows.length || !numericColumn) return [];

    return previewRows.slice(0, 20).map((row, index) => ({
      name: `${index + 1}`,
      value: Number(row[numericColumn]) || 0,
    }));
  };

  const insights = [
    `${stats.datasetCount} datasets available`,
    `${stats.totalRows.toLocaleString()} rows indexed`,
    selected
      ? `Analyzing "${selected}"`
      : "Select a dataset",
  ];

  const generatedSql = selected
    ? `SELECT *
FROM ${selected}
LIMIT 50;`
    : "-- No dataset selected";

  const copySql = () => {
    navigator.clipboard.writeText(generatedSql);
  };

  return (
    <div className="w-full">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">

        <div>
          <h1 className="text-2xl font-semibold">
            Dashboard
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Data analytics overview
          </p>
        </div>

        <Button onClick={() => navigate("/upload")}>
          Upload Dataset
        </Button>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Database size={18} className="text-indigo-600" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Datasets
            </p>

            <h2 className="text-2xl font-semibold">
              {stats.datasetCount}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-600" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Rows
            </p>

            <h2 className="text-2xl font-semibold">
              {stats.totalRows.toLocaleString()}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <MessageCircle size={18} className="text-purple-600" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              AI Queries
            </p>

            <h2 className="text-2xl font-semibold">
              {stats.totalQueries}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <FileText size={18} className="text-amber-600" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Active Dataset
            </p>

            <h2 className="text-sm font-semibold truncate max-w-[140px]">
              {selected || "None"}
            </h2>
          </div>

        </div>

      </div>

      {/* CHART + INSIGHTS */}

      <div className="grid grid-cols-12 gap-4 mb-6">

        <div className="col-span-8 bg-white rounded-2xl p-4">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-lg font-semibold">
              Visualization
            </h2>

            <select
              value={selected}
              onChange={(e) =>
                setSelected(e.target.value)
              }
              className="px-3 py-2 border rounded-lg text-sm"
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

          <div style={{ width: "100%", height: 260 }}>

            <ResponsiveContainer>

              <AreaChart data={chartData()}>

                <defs>
                  <linearGradient
                    id="colorValue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#4F46E5"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="95%"
                      stopColor="#4F46E5"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4F46E5"
                  fill="url(#colorValue)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

        <div className="col-span-4 bg-white rounded-2xl p-4">

          <div className="flex items-center gap-2 mb-4">

            <Sparkles
              size={18}
              className="text-emerald-600"
            />

            <h2 className="text-lg font-semibold">
              AI Insights
            </h2>

          </div>

          <div className="space-y-3">

            {insights.map((insight, index) => (
              <div
                key={index}
                className="bg-emerald-50 rounded-xl p-3 flex gap-2"
              >
                <CheckCircle2
                  size={16}
                  className="text-emerald-600 shrink-0 mt-0.5"
                />

                <p className="text-sm">
                  {insight}
                </p>

              </div>
            ))}

          </div>

          <Button
            className="w-full mt-4"
            onClick={() => navigate("/chat")}
          >
            Ask AI
          </Button>

        </div>

      </div>

      {/* RESULTS + SQL */}

      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-8 bg-white rounded-2xl p-4">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-lg font-semibold">
              Results Preview
            </h2>

            <span className="text-xs text-slate-500">
              {previewRows.length} rows
            </span>

          </div>

          <div className="overflow-auto max-h-[350px]">

            {previewRows.length > 0 ? (
              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b">

                    {Object.keys(previewRows[0]).map((col) => (
                      <th
                        key={col}
                        className="text-left px-3 py-2"
                      >
                        {col}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {previewRows
                    .slice(0, 10)
                    .map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b hover:bg-slate-50"
                      >
                        {Object.values(row).map(
                          (value, index) => (
                            <td
                              key={index}
                              className="px-3 py-2"
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
              <p className="text-slate-500">
                No preview available
              </p>
            )}

          </div>

        </div>

        <div className="col-span-4 bg-white rounded-2xl p-4">

          <h2 className="text-lg font-semibold mb-4">
            Generated SQL
          </h2>

          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-auto h-[250px]">
{generatedSql}
          </pre>

          <Button
            variant="secondary"
            className="w-full mt-4"
            onClick={copySql}
          >
            <div className="flex items-center gap-2">
              <Copy size={14} />
              Copy SQL
            </div>
          </Button>

        </div>

      </div>

    </div>
  );
}

export default DashboardPage;