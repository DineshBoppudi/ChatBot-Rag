import { useEffect, useState } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const navigate = useNavigate();

  const colors = ["#0ea5a4", "#06b6d4", "#8b5cf6", "#f97316", "#ef4444", "#10b981"];

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await api.get("/api/datasets");
      setDatasets(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const openPreview = async (dataset: any) => {
    const id = dataset.table_name || dataset.name;
    setSelected(dataset);
    setLoadingPreview(true);
    try {
      const res = await api.get(`/api/datasets/${encodeURIComponent(id)}/preview`);
      // API returns { rows: [...] } or array
      setPreview(res.data.rows || res.data || []);
    } catch (err) {
      console.error(err);
      setPreview([]);
    }
    setLoadingPreview(false);
  };

  const closePreview = () => {
    setSelected(null);
    setPreview([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Datasets</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/upload')}>Upload</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset, idx) => {
          const id = dataset.table_name || dataset.name || `dataset-${idx}`;
          const display = dataset.table_name || dataset.name || id;
          const accent = colors[idx % colors.length];

          return (
            <div
              key={id}
              role="button"
              onClick={() => openPreview(dataset)}
              className="bg-white rounded-xl shadow-lg p-5 transition transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              style={{ borderLeft: `6px solid ${accent}` }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center text-xl font-semibold text-slate-700">{display.charAt(0).toUpperCase()}</div>

                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{display}</h2>
                  <div className="text-sm text-muted mt-1">{dataset.sample?.length ? `${dataset.sample.length} sample rows` : 'No sample available'}</div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">Ready</div>
                    {dataset.row_count && <div className="text-xs text-muted">{dataset.row_count} rows</div>}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-500">Uploaded: {dataset.uploaded_at ? new Date(dataset.uploaded_at).toLocaleString() : '—'}</div>
                <div className="flex items-center gap-2">
                  <Button onClick={(e:any) => { e.stopPropagation(); openPreview(dataset); }} variant="secondary">Preview</Button>
                  <Button onClick={(e:any) => { e.stopPropagation(); navigate(`/?dataset=${encodeURIComponent(id)}`); }}>Open</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Preview: {selected.table_name || selected.name}</h3>
                <div className="text-sm text-gray-500">Showing sample rows (client preview)</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => { navigate(`/?dataset=${encodeURIComponent(selected.table_name || selected.name || '')}`); closePreview(); }}>Open in Dashboard</Button>
                <Button onClick={() => closePreview()} variant="secondary">Close</Button>
              </div>
            </div>

            <div className="p-4">
              {loadingPreview ? (
                <div className="text-center py-8">Loading preview...</div>
              ) : preview.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No preview rows available</div>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full border-collapse table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        {(Object.keys(preview[0]) || []).map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-xs text-gray-600 border-b">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {(Object.keys(preview[0]) || []).map((col) => (
                            <td key={`${rIdx}-${col}`} className="px-3 py-2 text-sm text-gray-700 align-top border-b">{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default DatasetsPage;