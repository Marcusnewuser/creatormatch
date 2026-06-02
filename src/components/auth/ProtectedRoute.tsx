import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/LoadingState'
import { getDefaultHomePath, needsOnboarding } from '../../lib/account-mode'
import type { AppMode } from '../../types/database'

interface ProtectedRouteProps {
  /** Creator or brand route tree — requires matching profile unless on profile create. */
  requireMode?: AppMode
  /** Admin-only routes */
  requireAdmin?: boolean
}

export function ProtectedRoute({ requireMode, requireAdmin }: ProtectedRouteProps) {
  const { user, profile, creatorProfile, brandProfile, loading } = useAuth()
  const location = useLocation()
  const isProfileCreate = /\/profile\/create$/.test(location.pathname)

  if (loading) {
    return <LoadingState />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin) {
    if (profile?.role !== 'admin') {
      return (
        <Navigate
          to={getDefaultHomePath(profile, creatorProfile, brandProfile, null)}
          replace
        />
      )
    }
    return <Outlet />
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (needsOnboarding(profile, creatorProfile, brandProfile)) {
    return <Navigate to="/role" replace />
  }

  if (requireMode === 'creator' && !creatorProfile && !isProfileCreate) {
    return <Navigate to="/creator/profile/create" replace />
  }

  if (requireMode === 'brand' && !brandProfile && !isProfileCreate) {
    return <Navigate to="/brand/profile/create" replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { user, profile, creatorProfile, brandProfile, activeMode, loading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  if (loading) {
    return <LoadingState />
  }

  if (user) {
    if (needsOnboarding(profile, creatorProfile, brandProfile)) {
      return <Navigate to="/role" replace />
    }
    return (
      <Navigate
        to={from ?? getDefaultHomePath(profile, creatorProfile, brandProfile, activeMode)}
        replace
      />
    )
  }

  return <Outlet />
}

export function OnboardingRoute() {
  const { user, profile, creatorProfile, brandProfile, activeMode, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (!needsOnboarding(profile, creatorProfile, brandProfile)) {
    return (
      <Navigate
        to={getDefaultHomePath(profile, creatorProfile, brandProfile, activeMode)}
        replace
      />
    )
  }

  return <Outlet />
}

/** @deprecated Use OnboardingRoute */
export const RoleSelectionRoute = OnboardingRoute
