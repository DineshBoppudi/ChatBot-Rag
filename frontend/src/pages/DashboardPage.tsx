import { useEffect, useState } from "react";
import { api } from "../services/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import Button from "../components/Button";
import { useLocation, useNavigate } from "react-router-dom";

function DashboardPage() {
  const [stats, setStats] = useState({ datasetCount: 0, totalRows: 0, totalQueries: 0 });
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [numericColumn, setNumericColumn] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ds = params.get('dataset');

    loadStats();
    loadDatasets(ds || undefined);
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get("/api/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDatasets = async (preferred?: string) => {
    try {
      const response = await api.get("/api/datasets");
      setDatasets(response.data || []);
      if (preferred) setSelected(preferred);
      else if (response.data?.length) setSelected(response.data[0].table_name || response.data[0].name);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selected) fetchPreview(selected);
  }, [selected]);

  const fetchPreview = async (name: string) => {
    try {
      const resp = await api.get(`/api/datasets/${encodeURIComponent(name)}/preview`);
      const rows = resp.data.rows || resp.data || [];
      setPreviewRows(rows.slice(0, 50));
      pickNumericColumn(rows);
    } catch (e) {
      try {
        const resp2 = await api.get("/api/datasets");
        const ds = resp2.data.find((d: any) => (d.table_name || d.name) === name);
        if (ds && ds.sample) {
          setPreviewRows(ds.sample.slice(0, 50));
          pickNumericColumn(ds.sample);
        } else {
          setPreviewRows([]);
          setNumericColumn(null);
        }
      } catch (e2) {
        console.error(e2);
      }
    }
  };

  const pickNumericColumn = (rows: any[]) => {
    if (!rows || !rows.length) return setNumericColumn(null);
    const first = rows[0];
    const keys = Object.keys(first);
    for (const k of keys) {
      if (rows.every((r) => r[k] === null || r[k] === undefined || !isNaN(Number(r[k])))) {
        setNumericColumn(k);
        return;
      }
    }
    setNumericColumn(null);
  };

  const chartData = () => {
    if (!previewRows.length || !numericColumn) return [];
    return previewRows.map((r: any, idx: number) => ({
      name: (r[numericColumn] || idx).toString().slice(0, 10),
      value: Number(r[numericColumn]) || 0,
    }));
  };

  const onPreviewClick = (table: string) => {
    // navigate with query param to allow deep linking
    navigate(`/?dataset=${encodeURIComponent(table)}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of datasets and quick visual insights.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/upload')}>Upload Dataset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Total Datasets</h2>
          <p className="text-4xl font-bold mt-3">{stats.datasetCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">Total Rows</h2>
          <p className="text-4xl font-bold mt-3">{stats.totalRows}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">AI Queries</h2>
          <p className="text-4xl font-bold mt-3">{stats.totalQueries}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Dataset Preview & Chart</h2>

          <div>
            <select
              value={selected || ""}
              onChange={(e) => setSelected(e.target.value)}
              className="border px-3 py-1 rounded"
            >
              {datasets.map((d) => (
                <option key={d.table_name || d.name} value={d.table_name || d.name}>
                  {d.table_name || d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-500">Preview (first 10 rows)</h3>
              <div>
                {selected && <Button onClick={() => onPreviewClick(selected)} variant="secondary">Open in Viewer</Button>}
              </div>
            </div>

            {previewRows && previewRows.length ? (
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(previewRows[0]).map((k) => (
                        <th key={k} className="text-left px-2 py-1 border-b text-xs text-slate-600">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="even:bg-slate-50">
                        {Object.keys(r).map((k) => (
                          <td key={k} className="px-2 py-1 text-xs text-slate-700">
                            {String(r[k])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No preview available for this dataset.</div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-sm text-gray-500 mb-2">Chart</h3>
            {numericColumn ? (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData()}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#6366F1" fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No numeric column found to chart.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;