import { useEffect, useState } from "react";
import { api } from "../services/api";

function DashboardPage() {
  const [stats, setStats] = useState({
    datasetCount: 0,
    totalRows: 0,
    totalQueries: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get("/api/dashboard");

      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            Total Datasets
          </h2>

          <p className="text-4xl font-bold mt-3">
            {stats.datasetCount}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            Total Rows
          </h2>

          <p className="text-4xl font-bold mt-3">
            {stats.totalRows}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            AI Queries
          </h2>

          <p className="text-4xl font-bold mt-3">
            {stats.totalQueries}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;