import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: any[];
}

function ResultsChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]);

  if (keys.length < 2) return null;

  const xKey = keys[0];
  const yKey = keys[1];

  const numericRows = data.filter(
    (row) =>
      !isNaN(Number(row[yKey]))
  );

  if (numericRows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow p-5 mt-6">
      <h2 className="text-lg font-semibold mb-4">
        Visualization
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <BarChart data={numericRows}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey={xKey} />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey={yKey}
            fill="#4F46E5"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ResultsChart;