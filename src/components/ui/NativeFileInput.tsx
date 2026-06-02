import type { ChangeEvent } from 'react'
import { cn } from '../../lib/utils'

const fileInputClassName = cn(
  'block w-full max-w-full text-sm text-text-secondary',
  'file:mr-3 file:rounded-xl file:border-0 file:bg-brand-primary file:px-4 file:py-2.5',
  'file:text-sm file:font-semibold file:text-white file:cursor-pointer',
  'hover:file:bg-brand-secondary file:transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

interface NativeFileInputProps {
  id?: string
  label?: string
  hint?: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  accept?: string
  className?: string
}

/** Browser-native file picker — works reliably on Windows, iOS, and Android. */
export function NativeFileInput({
  id,
  label,
  hint,
  onChange,
  disabled,
  accept = 'image/*',
  className,
}: NativeFileInputProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={onChange}
        className={fileInputClassName}
      />
      {hint && <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
