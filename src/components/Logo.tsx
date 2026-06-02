import { cn } from '../lib/utils'
import { CreatorMatchIcon } from './logo/CreatorMatchIcon'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 48, text: 'text-xl' },
  xl: { icon: 72, text: 'text-2xl' },
  hero: { icon: 96, text: 'text-3xl' },
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { icon, text } = sizes[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <CreatorMatchIcon size={icon} />
      {showText && (
        <span className={cn('font-semibold tracking-tight text-text-primary', text)}>
          CreatorMatch
        </span>
      )}
    </div>
  )
}
