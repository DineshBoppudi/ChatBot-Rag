import { useEffect, useState } from "react";
import { api } from "../services/api";

import KpiCard from "../components/dashboard/KpiCard";
import TopProductsChart from "../components/dashboard/TopProductsChart";
import InsightsPanel from "../components/dashboard/InsightsPanel";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";

import Button from "../components/Button";

function DashboardPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  

  const [kpis, setKpis] = useState<any>(null);

  const [chartData, setChartData] =
    useState<any[]>([]);

  const [insights, setInsights] =
    useState("");

  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selected) {
      loadAnalytics();
    }
  }, [selected]);

  const loadDatasets = async () => {
    try {
      const res = await api.get(
        "/api/datasets"
      );

      setDatasets(res.data);

      if (res.data.length) {
        setSelected(
          res.data[0].table_name
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [
        kpiRes,
        chartRes,
        insightRes,
        pieRes,
      ] = await Promise.all([
        api.get(
          `/api/dashboard/${selected}/kpis`
        ),

        api.get(
          `/api/dashboard/${selected}/top-products`
        ),

        api.get(
          `/api/dashboard/${selected}/insights`
        ),
        api.get(
  `/api/dashboard/${selected}/category-distribution`
),
      ]);

      setKpis(kpiRes.data);

      setChartData(chartRes.data);
      setCategoryData(pieRes.data);

      setInsights(
        insightRes.data.insights
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col p-2">

      <div className="flex justify-between items-center mb-5">

        <div>
          <h1 className="text-2xl font-bold">
            Analytics Dashboard
          </h1>

          <p className="text-slate-500">
            AI Powered Dataset Analysis
          </p>
        </div>

        <div className="flex gap-3">

          <select
            value={selected}
            onChange={(e) =>
              setSelected(
                e.target.value
              )
            }
            className="px-4 py-2 rounded-xl border bg-white"
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

          <Button>
            Upload Dataset
          </Button>

        </div>

      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">

        <KpiCard
  title="Total Rows"
  value={kpis?.total_rows || 0}
  color="blue"
/>

<KpiCard
  title="Average Price"
  value={`₹${Math.round(
    Number(
      kpis?.avg_discount_price || 0
    )
  )}`}
  color="green"
/>

<KpiCard
  title="Maximum Price"
  value={`₹${kpis?.max_discount_price || 0}`}
  color="amber"
/>

<KpiCard
  title="Minimum Price"
  value={`₹${kpis?.min_discount_price || 0}`}
  color="rose"
/>

      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">

  <div className="col-span-5">
    <TopProductsChart
      data={chartData}
    />
  </div>

  <div className="col-span-3">
    <CategoryPieChart
      data={categoryData}
    />
  </div>

  <div className="col-span-4">
    <InsightsPanel
      insights={insights}
    />
  </div>

</div>

    </div>
  );
}

export default DashboardPage;