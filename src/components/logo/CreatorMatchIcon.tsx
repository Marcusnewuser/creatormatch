interface CreatorMatchIconProps {
  size?: number
  className?: string
}

/** Official CreatorMatch app icon — exact brand asset. */
export function CreatorMatchIcon({ size = 32, className }: CreatorMatchIconProps) {
  return (
    <img
      src="/creatormatch-icon.png"
      alt=""
      width={size}
      height={size}
      className={className}
      draggable={false}
      aria-hidden="true"
    />
  )
}
