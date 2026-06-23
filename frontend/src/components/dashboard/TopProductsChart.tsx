import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

interface Props {
  data: any[];
}

export default function TopProductsChart({
  data,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">
        Top Products
      </h2>

      <ResponsiveContainer
        width="100%"
        height={320}
      >
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            hide
          />

          <Tooltip />

          <Bar
            dataKey="price"
            fill="#547d8a"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}