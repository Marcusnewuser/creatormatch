import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'google'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-secondary shadow-soft hover:shadow-card active:scale-[0.98]',
  secondary:
    'bg-brand-light text-brand-primary hover:bg-blue-100 active:scale-[0.98]',
  outline:
    'border border-border bg-white text-text-primary hover:bg-gray-50 active:scale-[0.98]',
  ghost: 'text-text-secondary hover:bg-gray-50 hover:text-text-primary',
  danger:
    'bg-danger text-white hover:bg-red-600 shadow-soft active:scale-[0.98]',
  google:
    'border border-border bg-white text-text-primary hover:bg-gray-50 shadow-soft active:scale-[0.98]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm font-medium rounded-xl',
  lg: 'h-12 px-6 text-base font-medium rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
