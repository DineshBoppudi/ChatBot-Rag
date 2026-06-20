import { useState, useCallback, useRef } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";

function parseCSVPreview(text: string, maxRows = 5) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1, 1 + maxRows).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<any | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const readPreview = useCallback((f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const p = parseCSVPreview(text, 5);
      setPreview(p);
    };
    reader.onerror = () => setPreview({ headers: [], rows: [] });
    reader.readAsText(f);
  }, []);

  const onFileChange = (f: File | null) => {
    setFile(f);
    setDatasetInfo(null);
    setMessage("");
    setProgress(0);
    if (f) readPreview(f);
    else setPreview({ headers: [], rows: [] });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] || null;
    if (f && (f.type.includes("csv") || f.name.endsWith('.csv'))) {
      onFileChange(f);
    } else {
      setMessage("Please drop a CSV file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return setMessage("Please choose a CSV file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("");
      setProgress(0);

      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e: any) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      setDatasetInfo(response.data || null);
      setMessage("Dataset uploaded successfully.");

      // refresh server-side dataset list (best effort)
      try {
        await api.post("/api/datasets/refresh");
      } catch (e) {}

      // navigate to dashboard with the uploaded dataset so visuals render immediately
      try {
        const table = response.data?.table_name || response.data?.name;
        if (table) navigate(`/?dataset=${encodeURIComponent(table)}`);
      } catch (e) {
        // ignore navigation errors
      }
    } catch (error: any) {
      console.error(error);
      const serverMsg = error?.response?.data?.error || error?.response?.data?.message || (error?.response?.data ? JSON.stringify(error.response.data) : null) || error.message || 'Upload failed';
      const status = error?.response?.status ? ` (${error.response.status})` : '';
      setMessage(`Upload failed${status}: ${serverMsg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Upload Dataset</h1>
          <p className="text-sm text-gray-500 mt-1">Upload CSV files to create datasets for analysis.</p>
        </div>
        <div>
          <Link to="/">
            <Button variant="secondary">Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="card p-6 max-w-3xl">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 rounded-md p-8 text-center mb-6 transition ${dragOver ? 'border-dashed border-indigo-300 bg-gray-50/40' : 'border-dashed border-gray-200 bg-transparent'}`}
        >
          <div className="text-lg font-medium">Drag & drop a CSV file here</div>
          <div className="text-sm text-gray-500 mt-2">or</div>

          <div className="mt-4">
            <input
              ref={inputRef}
              id="file-input"
              type="file"
              accept=".csv"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button onClick={() => inputRef.current?.click()} className="mt-3">Choose a file</Button>
          </div>

          <div className="text-sm text-gray-500 mt-3">Accepted: .csv — Max recommended size: 50MB</div>
        </div>

        {file && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
              </div>

              <div className="w-48">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-green-400 to-green-600"></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{progress}%</div>
              </div>
            </div>

            {preview.headers.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Preview first {preview.rows.length} rows</div>
                <div className="overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {preview.headers.map((h, i) => (
                          <th key={i} className="px-2 py-1 text-left border-b">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((r, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50'}>
                          {r.map((c, ci) => (
                            <td key={ci} className="px-2 py-1 text-xs">{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleUpload} disabled={uploading || !file}>{uploading ? 'Uploading...' : 'Upload Dataset'}</Button>
          <Button variant="secondary" onClick={() => { setFile(null); setPreview({ headers: [], rows: [] }); setMessage(''); setDatasetInfo(null); setProgress(0); }}>Cancel</Button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-green-50 rounded text-sm text-gray-700">{message}</div>
        )}

        {datasetInfo && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <div className="font-medium">Uploaded dataset</div>
            <div className="text-sm text-gray-700">Table: {datasetInfo.table_name || datasetInfo.name || 'unknown'}</div>
            {datasetInfo.row_count && (<div className="text-sm text-gray-700">Rows: {datasetInfo.row_count}</div>)}

            <div className="mt-3 flex gap-3">
              <Link to="/"><Button variant="secondary">Dashboard</Button></Link>
              <Link to={`/?dataset=${encodeURIComponent(datasetInfo.table_name || datasetInfo.name || '')}`}><Button>Open Dashboard</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;