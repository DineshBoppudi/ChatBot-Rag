interface Props {
  insights: string;
}

export default function InsightsPanel({
  insights,
}: Props) {
  const lines = insights
    ?.split("\n")
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">
        AI Insights
      </h2>

      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={index}
            className="p-3 rounded-xl bg-slate-50"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}