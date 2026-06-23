interface Props {
  title: string;
  value: string | number;
  color?: "blue" | "green" | "amber" | "rose";
}

export default function KpiCard({
  title,
  value,
  color = "blue",
}: Props) {
  const styles = {
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-100",
      text: "text-blue-700",
    },

    green: {
      border: "border-emerald-200",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    },

    amber: {
      border: "border-amber-200",
      bg: "bg-amber-100",
      text: "text-amber-700",
    },

    rose: {
      border: "border-rose-200",
      bg: "bg-rose-100",
      text: "text-rose-700",
    },
  };

  const theme = styles[color];

  return (
    <div
      className={`
        rounded-2xl
        border-2
        ${theme.border}
        ${theme.bg}
        p-5
        shadow-sm
        transition-all
        hover:shadow-md
      `}
    >
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h2
        className={`
          text-3xl
          font-bold
          mt-2
          ${theme.text}
        `}
      >
        {value}
      </h2>
    </div>
  );
}