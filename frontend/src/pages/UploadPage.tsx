import { useState } from "react";
import { api } from "../services/api";

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/api/upload",
        formData
      );

      setMessage("Dataset uploaded successfully");

      console.log(response.data);
    } catch (error) {
      console.error(error);
      setMessage("Upload failed");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Upload Dataset
      </h1>

      <div className="bg-white rounded-xl shadow p-8 max-w-2xl">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
          <p className="text-lg font-medium">
            Upload a CSV Dataset
          </p>

          <p className="text-gray-500 mt-2">
            Choose a CSV file from your computer
          </p>

          <input
            type="file"
            accept=".csv"
            className="mt-6"
            onChange={(e) =>
              setFile(
                e.target.files?.[0] || null
              )
            }
          />
        </div>

        <button
          onClick={handleUpload}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Upload Dataset
        </button>

        {message && (
          <div className="mt-4 p-3 bg-slate-100 rounded">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;