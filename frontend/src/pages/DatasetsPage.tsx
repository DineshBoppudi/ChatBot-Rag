import { useEffect, useState } from "react";
import { api } from "../services/api";

function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Datasets
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset) => (
          <div
            key={dataset.table_name}
            className="bg-white rounded-xl shadow p-6"
          >
            <h2 className="text-xl font-semibold">
              {dataset.table_name}
            </h2>

            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Active
              </span>
            </div>

            <div className="mt-4 text-gray-500">
              Dataset ready for AI analysis
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DatasetsPage;