import { LogOut } from 'lucide-react'
import { Button } from './ui/Button'
import { useLogout } from '../hooks/useLogout'

interface LogoutButtonProps {
  fullWidth?: boolean
  variant?: 'danger' | 'outline'
  className?: string
}

export function LogoutButton({ fullWidth, variant = 'outline', className }: LogoutButtonProps) {
  const { logout, loggingOut } = useLogout()

  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      loading={loggingOut}
      onClick={logout}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      Log Out
    </Button>
  )
}
