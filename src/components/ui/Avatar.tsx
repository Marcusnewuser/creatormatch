import { cn } from '../../lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'profile'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  profile: 'h-20 w-20 sm:h-24 sm:w-24 text-xl sm:text-2xl',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ src, alt, name = 'User', size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={cn('rounded-full object-cover ring-2 ring-white', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-light text-brand-primary font-semibold flex items-center justify-center ring-2 ring-white',
        sizes[size],
        className,
      )}
      aria-label={alt || name}
    >
      {getInitials(name)}
    </div>
  )
}
