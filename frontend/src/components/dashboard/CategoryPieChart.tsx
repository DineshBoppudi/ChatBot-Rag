import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#BFDBFE",
  "#A7F3D0",
  "#FDE68A",
  "#FBCFE8",
  "#C7D2FE",
  "#DDD6FE",
  "#FCA5A5",
  "#93C5FD",
];

export default function CategoryPieChart({
  data,
}: any) {
  if (!data?.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        No category data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full">

      <h2 className="font-semibold mb-4">
        Category Distribution
      </h2>

      <ResponsiveContainer
        width="100%"
        height={280}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            label
          >
            {data.map(
              (
                _: any,
                index: number
              ) => (
                <Cell
                  key={index}
                  fill={
                    COLORS[
                      index %
                        COLORS.length
                    ]
                  }
                />
              )
            )}
          </Pie>

          <Tooltip />

          <Legend />
        </PieChart>
      </ResponsiveContainer>

    </div>
  );
}