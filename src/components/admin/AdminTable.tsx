import { cn } from '../../lib/utils'

interface AdminTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export function AdminTable({ headers, children, className }: AdminTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-border bg-white shadow-soft', className)}>
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50/80">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium text-text-secondary whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}

export function AdminTableRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <tr className={cn('hover:bg-gray-50/50 transition-colors', className)}>{children}</tr>
}

export function AdminTableCell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={cn('px-4 py-3 text-text-primary align-middle', className)}>{children}</td>
}
