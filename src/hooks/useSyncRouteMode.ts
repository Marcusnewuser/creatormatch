import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { AppMode } from '../types/database'

/** Keep activeMode in sync with the current route tree. */
export function useSyncRouteMode(mode: AppMode) {
  const { activeMode, switchMode, isAdmin } = useAuth()

  useEffect(() => {
    if (isAdmin) return
    if (activeMode !== mode) {
      switchMode(mode)
    }
  }, [mode, activeMode, switchMode, isAdmin])
}
