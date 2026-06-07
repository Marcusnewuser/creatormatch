interface AdminGrowthChartProps {
  title: string
  data: { label: string; value: number }[]
}

export function AdminGrowthChart({ title, data }: AdminGrowthChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((point) => (
          <div key={point.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-full max-w-[32px] rounded-t-md bg-brand-primary transition-all"
              style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
              title={`${point.value}`}
            />
            <span className="text-[10px] text-text-secondary truncate w-full text-center">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
