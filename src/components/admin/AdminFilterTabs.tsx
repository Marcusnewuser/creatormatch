import { cn } from '../../lib/utils'

interface AdminFilterTabsProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function AdminFilterTabs<T extends string>({
  options,
  value,
  onChange,
}: AdminFilterTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-brand-primary text-white'
              : 'bg-white border border-border text-text-secondary hover:border-brand-primary/30',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
